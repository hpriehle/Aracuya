// POST|PUT /api/momo/callback?b=<bookingId>&e=<eventId>
// MTN calls this when a request-to-pay settles. The callback is unsigned, so
// its body is ignored: we only use it as a nudge to ask MTN for the real
// status (checkMomoBooking), exactly as the widget's polling does.

import { NextRequest, NextResponse } from "next/server";
import { checkMomoBooking } from "@/lib/booking/confirm";

export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("b") ?? "";
  const eventId = request.nextUrl.searchParams.get("e") ?? "";
  if (/^ARC-[0-9A-F]{8}$/.test(bookingId) && eventId) {
    try {
      await checkMomoBooking(eventId, bookingId);
    } catch (err) {
      console.error("[momo/callback]", err);
    }
  }
  return NextResponse.json({ received: true });
}

export const POST = handle;
export const PUT = handle;
