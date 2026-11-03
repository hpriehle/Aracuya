// POST /api/booking — validate, price, hold the dates, start payment.
//
// Body: { rooms, checkIn, checkOut, name, email, phone, guests, method, website }
//   method:  "card" (Stripe, cards issued outside Ghana) | "momo" (not yet)
//   website: honeypot, must be empty
// Response: { url } — redirect the browser there to pay.

import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
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
import { QuoteError, ghsToUsdCents, getGhsPerUsd, quote } from "@/lib/booking/pricing";
import {
  CHECKOUT_MINUTES,
  HOLD_MINUTES,
  StripeNotConfiguredError,
  getStripe,
} from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";

const property = roomData[0];

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
  let q;
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

  if (body.method === "momo") {
    return fail(400, "Mobile Money payments are coming soon. Please book on WhatsApp for now.");
  }
  if (body.method !== "card") return fail(400, "Choose a payment method");

  try {
    const stripe = getStripe();
    const ghsPerUsd = await getGhsPerUsd();
    const usdCents = ghsToUsdCents(q.totalGhs, ghsPerUsd);

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
      provider: "stripe",
      referral: request.cookies.get("aracuya_ref")?.value,
    };

    const eventId = await createHold(details, HOLD_MINUTES);

    try {
      const origin = request.nextUrl.origin;
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
  } catch (err) {
    if (err instanceof SoldOutError) {
      return fail(409, "Sorry, someone just booked those dates. Please choose others.");
    }
    if (err instanceof CalendarNotConfiguredError || err instanceof StripeNotConfiguredError) {
      console.error("[booking] not configured:", (err as Error).message);
      return fail(503, "Online booking is temporarily unavailable. Please book on WhatsApp.");
    }
    console.error("[booking] failed:", err);
    return fail(502, "Something went wrong starting payment. Please try again or book on WhatsApp.");
  }
}
