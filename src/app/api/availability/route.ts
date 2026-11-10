// GET /api/availability?start=YYYY-MM-DD&end=YYYY-MM-DD
// Free rooms for each night from `start` through `end` (both inclusive).
//
// Response: {
//   totalRooms: 3,
//   nights: { "2026-12-01": 3, "2026-12-02": 1, ... },   // free rooms per night
//   bookedDates: ["2026-12-05", ...]                     // nights with 0 free
// }

import { NextRequest, NextResponse } from "next/server";
import { addDays, isDateStr, nightlyFreeRooms } from "@/lib/booking/availability";
import { CalendarNotConfiguredError, TOTAL_ROOMS, listBlocks } from "@/lib/booking/calendar";

export const dynamic = "force-dynamic";

const MAX_NIGHTS = 400;

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const endInclusive = request.nextUrl.searchParams.get("end");

  if (!isDateStr(start) || !isDateStr(endInclusive) || endInclusive < start) {
    return NextResponse.json(
      { error: "start and end must be YYYY-MM-DD with start <= end" },
      { status: 400 }
    );
  }
  const end = addDays(endInclusive, 1);
  if (end > addDays(start, MAX_NIGHTS)) {
    return NextResponse.json(
      { error: `Range is limited to ${MAX_NIGHTS} nights` },
      { status: 400 }
    );
  }

  try {
    const blocks = await listBlocks(start, end);
    const nights = nightlyFreeRooms(blocks, start, end, TOTAL_ROOMS);
    const bookedDates = Object.keys(nights).filter((n) => nights[n] === 0);

    return NextResponse.json(
      { totalRooms: TOTAL_ROOMS, nights, bookedDates },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    if (err instanceof CalendarNotConfiguredError) {
      return NextResponse.json({ error: "Availability unavailable" }, { status: 503 });
    }
    console.error("[availability]", err);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 502 });
  }
}
