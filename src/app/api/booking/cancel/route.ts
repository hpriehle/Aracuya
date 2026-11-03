// GET /api/booking/cancel?b=<bookingId>&e=<eventId>
// Stripe Checkout's "back" link. Expires the Stripe session and frees the
// held dates right away instead of waiting for the hold to time out.
// Only ever releases unpaid holds; confirmed bookings are untouched.

import { NextRequest, NextResponse } from "next/server";
import { siteOrigin } from "@/lib/booking/origin";
import { getEvent, releaseHold } from "@/lib/booking/calendar";
import { getStripe } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("b") ?? "";
  const eventId = request.nextUrl.searchParams.get("e") ?? "";
  const back = new URL("/reserve?payment=cancelled", siteOrigin(request));

  try {
    const event = eventId ? await getEvent(eventId) : null;
    const props = event?.extendedProperties?.private;
    if (props?.bookingId === bookingId && props.status === "hold") {
      const sessionId = props.paymentRef;
      if (sessionId?.startsWith("cs_")) {
        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        if (session.status === "open") await getStripe().checkout.sessions.expire(sessionId);
        if (session.status === "complete") return NextResponse.redirect(back); // paid after all
      }
      await releaseHold(eventId);
    }
  } catch (err) {
    // The hold still expires on its own; don't strand the guest on an error.
    console.error("[booking/cancel]", err);
  }
  return NextResponse.redirect(back);
}
