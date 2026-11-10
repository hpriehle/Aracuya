// GET /api/booking/status?b=<bookingId>&e=<eventId>
// Polled by the widget while the guest approves a MoMo payment on their phone.
// Response: { status: "pending" | "confirmed" | "failed", message? }

import { NextRequest, NextResponse } from "next/server";
import { checkMomoBooking } from "@/lib/booking/confirm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("b") ?? "";
  const eventId = request.nextUrl.searchParams.get("e") ?? "";
  if (!/^ARC-[0-9A-F]{8}$/.test(bookingId) || !eventId) {
    return NextResponse.json({ status: "failed", message: "Unknown booking" }, { status: 400 });
  }
  try {
    const state = await checkMomoBooking(eventId, bookingId);
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    // Transient (MTN or Google hiccup): tell the widget to keep waiting.
    console.error("[booking/status]", err);
    return NextResponse.json({ status: "pending" }, { headers: { "Cache-Control": "no-store" } });
  }
}
