// POST /api/booking — validate, price, hold the dates, start payment.
//
// Body: { rooms, checkIn, checkOut, name, email, phone, guests, method, momoNumber, website }
//   method:     "card" (Stripe, cards issued outside Ghana) | "momo" (MTN Mobile Money)
//   momoNumber: the MTN wallet to charge (method "momo" only)
//   website:    honeypot, must be empty
// Response:
//   card → { url }                     redirect the browser there to pay
//   momo → { momo: { bookingId, eventId } }  poll GET /api/booking/status

import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { siteOrigin } from "@/lib/booking/origin";
import { rooms as roomData } from "@/data/rooms";
import { rangeFits } from "@/lib/booking/availability";
import {
  CalendarNotConfiguredError,
  SoldOutError,
  attachPaymentRef,
  createHold,
  getFreeRooms,
  releaseHold,
  type BookingDetails,
} from "@/lib/booking/calendar";
import { QuoteError, ghsToUsdCents, getGhsPerUsd, quote, type Quote } from "@/lib/booking/pricing";
import {
  CHECKOUT_MINUTES,
  HOLD_MINUTES as CARD_HOLD_MINUTES,
  StripeNotConfiguredError,
  getStripe,
  isStripeTestMode,
} from "@/lib/payments/stripe";
import {
  MomoNotConfiguredError,
  isMomoSandbox,
  isMtnGhanaNumber,
  normalizeMsisdn,
  requestToPay,
} from "@/lib/payments/momo";

export const dynamic = "force-dynamic";

const property = roomData[0];
/** MTN prompts expire after a few minutes; give the guest a little slack. */
const MOMO_HOLD_MINUTES = 10;

// Best-effort per-instance rate limit: each attempt holds real dates.
const attempts = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Invalid request");
  }

  if (str(body.website, 200)) return fail(400, "Invalid request");

  const ip =
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (rateLimited(ip)) {
    return fail(429, "Too many booking attempts. Please wait a few minutes or book on WhatsApp.");
  }

  // Guest details
  const name = str(body.name, 100);
  const email = str(body.email, 200).toLowerCase();
  const phone = str(body.phone, 30);
  const guests = Number(body.guests);
  if (name.length < 2) return fail(400, "Please enter your name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(400, "Please enter a valid email");
  if (!/^\+?[\d\s()-]{7,20}$/.test(phone)) return fail(400, "Please enter a valid phone number");

  // Price (server-side only)
  let q: Quote;
  try {
    q = quote(body.rooms, body.checkIn, body.checkOut);
  } catch (err) {
    if (err instanceof QuoteError) return fail(400, err.message);
    throw err;
  }
  const maxGuests = property.occupancy * q.tier.rooms;
  if (!Number.isInteger(guests) || guests < 1 || guests > maxGuests) {
    return fail(400, `${q.tier.label} sleeps up to ${maxGuests} guests`);
  }

  // Payment method
  const method = body.method;
  if (method !== "card" && method !== "momo") return fail(400, "Choose a payment method");
  let msisdn: string | null = null;
  if (method === "momo") {
    msisdn = normalizeMsisdn(str(body.momoNumber, 30));
    if (!msisdn) return fail(400, "Enter your MTN MoMo number, e.g. 024 123 4567");
    if (!isMomoSandbox() && !isMtnGhanaNumber(msisdn)) {
      return fail(
        400,
        "That isn't an MTN number (MTN numbers start 024, 025, 053, 054, 055 or 059). For Telecel or AirtelTigo, please book on WhatsApp."
      );
    }
  }

  try {
    const free = await getFreeRooms(q.checkIn, q.checkOut);
    if (!rangeFits(free, q.checkIn, q.checkOut, q.tier.rooms)) {
      return fail(409, "Sorry, those dates are no longer available for that many rooms.");
    }

    const details: BookingDetails = {
      bookingId: `ARC-${randomBytes(4).toString("hex").toUpperCase()}`,
      rooms: q.tier.rooms,
      roomsLabel: q.tier.label,
      checkIn: q.checkIn,
      checkOut: q.checkOut,
      guestName: name,
      guestEmail: email,
      guestPhone: phone,
      guests,
      totalGhs: q.totalGhs,
      provider: method === "card" ? "stripe" : "momo",
      referral: request.cookies.get("aracuya_ref")?.value,
    };

    if (method === "momo") {
      return await startMomo(request, details, q, msisdn!);
    }
    return await startCard(request, details, q, email, name, phone, guests);
  } catch (err) {
    if (err instanceof SoldOutError) {
      return fail(409, "Sorry, someone just booked those dates. Please choose others.");
    }
    if (
      err instanceof CalendarNotConfiguredError ||
      err instanceof StripeNotConfiguredError ||
      err instanceof MomoNotConfiguredError
    ) {
      console.error("[booking] not configured:", (err as Error).message);
      return fail(503, "Online booking is temporarily unavailable. Please book on WhatsApp.");
    }
    console.error("[booking] failed:", err);
    return fail(502, "Something went wrong starting payment. Please try again or book on WhatsApp.");
  }
}

async function startCard(
  request: NextRequest,
  details: BookingDetails,
  q: Quote,
  email: string,
  name: string,
  phone: string,
  guests: number
) {
  const stripe = getStripe();
  const ghsPerUsd = await getGhsPerUsd();
  const usdCents = ghsToUsdCents(q.totalGhs, ghsPerUsd);
  const eventId = await createHold(details, CARD_HOLD_MINUTES, isStripeTestMode());

  try {
    const origin = siteOrigin(request);
    const nightsLabel = `${q.nights} night${q.nights === 1 ? "" : "s"}`;
    const metadata = {
      bookingId: details.bookingId,
      eventId,
      rooms: String(details.rooms),
      roomsLabel: details.roomsLabel,
      checkIn: q.checkIn,
      checkOut: q.checkOut,
      nights: String(q.nights),
      totalGhs: String(q.totalGhs),
      ghsPerUsd: String(ghsPerUsd),
      guestName: name,
      guestPhone: phone,
      guests: String(guests),
      ...(details.referral ? { referral: details.referral.slice(0, 60) } : {}),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      client_reference_id: details.bookingId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: usdCents,
            product_data: {
              name: `Aracuya · ${q.tier.label} · ${nightsLabel}`,
              description: `${q.checkIn} to ${q.checkOut} · GH₵${q.totalGhs.toLocaleString("en-US")} at ${ghsPerUsd.toFixed(2)} GHS/USD`,
            },
          },
        },
      ],
      metadata,
      payment_intent_data: {
        metadata,
        receipt_email: email,
        description: `Aracuya booking ${details.bookingId}`,
      },
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_MINUTES * 60,
      success_url: `${origin}/reserve/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/api/booking/cancel?b=${details.bookingId}&e=${eventId}`,
    });

    await attachPaymentRef(eventId, session.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    await releaseHold(eventId).catch(() => {});
    throw err;
  }
}

async function startMomo(request: NextRequest, details: BookingDetails, q: Quote, msisdn: string) {
  const eventId = await createHold(details, MOMO_HOLD_MINUTES, isMomoSandbox());
  try {
    const nightsLabel = `${q.nights} night${q.nights === 1 ? "" : "s"}`;
    const referenceId = await requestToPay({
      amountGhs: q.totalGhs,
      msisdn,
      externalId: details.bookingId,
      payerMessage: `Aracuya ${details.roomsLabel}, ${nightsLabel} (${details.bookingId})`,
      payeeNote: `Booking ${details.bookingId} ${q.checkIn} to ${q.checkOut}`,
      callbackUrl: `${siteOrigin(request)}/api/momo/callback?b=${details.bookingId}&e=${eventId}`,
    });
    await attachPaymentRef(eventId, referenceId);
    return NextResponse.json({ momo: { bookingId: details.bookingId, eventId } });
  } catch (err) {
    await releaseHold(eventId).catch(() => {});
    throw err;
  }
}
