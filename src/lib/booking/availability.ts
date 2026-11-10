// Room-availability math. Pure functions, no Google/network deps.
//
// A "night" is identified by its date (YYYY-MM-DD): the night of 2026-12-01
// is the one starting that evening. A stay checking in on the 1st and
// checking out on the 3rd occupies nights [01, 03) = the 1st and 2nd.
// Ghana (Africa/Accra) is UTC+0 with no DST, so UTC date math is local time.

export interface CalendarBlock {
  /** First night occupied (inclusive). */
  startNight: string;
  /** Night after the last occupied one (exclusive) — i.e. the checkout date. */
  endNight: string;
  /** Rooms this block takes; equals total rooms for whole-house blocks. */
  rooms: number;
}

/** Minimal shape of a Google Calendar event we care about. */
export interface CalendarEventLike {
  status?: string | null;
  summary?: string | null;
  start?: { date?: string | null; dateTime?: string | null } | null;
  end?: { date?: string | null; dateTime?: string | null } | null;
  extendedProperties?: { private?: Record<string, string> | null } | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateStr(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Nights in [start, end). */
export function eachNight(start: string, end: string): string[] {
  const nights: string[] = [];
  for (let n = start; n < end; n = addDays(n, 1)) nights.push(n);
  return nights;
}

/**
 * How many rooms an event takes.
 * 1. Events created by this site carry `rooms` in private extended properties.
 * 2. Manual events can say "1 room" / "2 rooms" in the title.
 * 3. Anything else (Airbnb, "Blocked", maintenance…) takes the whole house.
 */
export function parseRoomCount(
  summary: string | null | undefined,
  privateProps: Record<string, string> | null | undefined,
  totalRooms: number
): number {
  const fromProps = Number.parseInt(privateProps?.rooms ?? "", 10);
  if (privateProps?.source === "aracuya-site" && fromProps >= 1) {
    return Math.min(fromProps, totalRooms);
  }
  const match = summary?.match(/\b([1-9])\s*rooms?\b/i);
  if (match) return Math.min(Number(match[1]), totalRooms);
  return totalRooms;
}

/**
 * Nights a timed event occupies: every night whose ending midnight falls
 * inside (start, end]. So a 15:00 check-in to 11:00 checkout three days later
 * covers three nights, a 00:00–00:00 "1 room booked" entry on Nov 30 covers
 * the night of Nov 30 (how staff enter bookings by hand), and a 10:00–12:00
 * cleaning slot covers none.
 */
function timedRangeToNights(
  startIso: string,
  endIso: string
): { startNight: string; endNight: string } | null {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;

  const DAY = 86_400_000;
  const firstMidnight = Math.floor(start / DAY) * DAY + DAY; // first midnight > start
  const lastMidnight = Math.floor(end / DAY) * DAY; // last midnight <= end
  if (firstMidnight > lastMidnight) return null;

  const toDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return {
    startNight: addDays(toDate(firstMidnight), -1),
    endNight: toDate(lastMidnight),
  };
}

export function eventToBlock(
  event: CalendarEventLike,
  totalRooms: number,
  nowMs: number = Date.now()
): CalendarBlock | null {
  if (event.status === "cancelled") return null;

  const props = event.extendedProperties?.private ?? null;
  // Unpaid checkout holds stop blocking once they expire.
  if (props?.status === "hold") {
    const expires = new Date(props.expiresAt ?? "").getTime();
    if (Number.isNaN(expires) || expires <= nowMs) return null;
  }

  let range: { startNight: string; endNight: string } | null = null;
  if (event.start?.date && event.end?.date) {
    range = { startNight: event.start.date, endNight: event.end.date };
  } else if (event.start?.dateTime && event.end?.dateTime) {
    range = timedRangeToNights(event.start.dateTime, event.end.dateTime);
  }
  if (!range || range.endNight <= range.startNight) return null;

  return {
    ...range,
    rooms: parseRoomCount(event.summary, props, totalRooms),
  };
}

/** Free rooms for each night in [start, end). Never negative. */
export function nightlyFreeRooms(
  blocks: CalendarBlock[],
  start: string,
  end: string,
  totalRooms: number
): Record<string, number> {
  const free: Record<string, number> = {};
  for (const night of eachNight(start, end)) free[night] = totalRooms;

  for (const block of blocks) {
    const from = block.startNight > start ? block.startNight : start;
    const to = block.endNight < end ? block.endNight : end;
    for (const night of eachNight(from, to)) {
      free[night] = Math.max(0, free[night] - block.rooms);
    }
  }
  return free;
}

/** Does a stay of [checkIn, checkOut) fit `roomsNeeded` given free counts? */
export function rangeFits(
  free: Record<string, number>,
  checkIn: string,
  checkOut: string,
  roomsNeeded: number
): boolean {
  return eachNight(checkIn, checkOut).every(
    (night) => (free[night] ?? Number.POSITIVE_INFINITY) >= roomsNeeded
  );
}

/**
 * Parse an iCal feed (e.g. Airbnb's export link) into whole-house blocks.
 * Airbnb uses all-day `DTSTART;VALUE=DATE:20261201` / exclusive `DTEND`.
 */
export function parseICalBlocks(ics: string, totalRooms: number): CalendarBlock[] {
  // Unfold continuation lines (RFC 5545 §3.1).
  const lines = ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const blocks: CalendarBlock[] = [];
  let start: string | null = null;
  let end: string | null = null;
  let inEvent = false;

  const toValue = (line: string) => line.slice(line.indexOf(":") + 1).trim();
  const toDateOrIso = (v: string): { date?: string; dateTime?: string } => {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
    if (!m) return {};
    const date = `${m[1]}-${m[2]}-${m[3]}`;
    return m[4] ? { dateTime: `${date}T${m[4]}:${m[5]}:${m[6]}Z` } : { date };
  };

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      start = end = null;
    } else if (line === "END:VEVENT") {
      if (inEvent && start && end) {
        const block = eventToBlock(
          { start: toDateOrIso(start), end: toDateOrIso(end) },
          totalRooms
        );
        if (block) blocks.push({ ...block, rooms: totalRooms });
      }
      inEvent = false;
    } else if (inEvent && line.startsWith("DTSTART")) {
      start = toValue(line);
    } else if (inEvent && line.startsWith("DTEND")) {
      end = toValue(line);
    }
  }
  return blocks;
}
