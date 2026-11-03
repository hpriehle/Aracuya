// Google Calendar access for bookings (server-only).
//
// Auth: a Google service account that the Aracuya calendar is shared with
// ("Make changes to events"). Env:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY   (PEM; literal "\n" sequences are OK)
//   GOOGLE_BOOKING_CALENDAR_ID           (Aracuya: aracuyagh@gmail.com, the primary calendar)
// Optional:
//   BLOCKING_ICAL_URLS    Comma-separated OTA export links (Airbnb, VRBO, Booking.com).
//                         Google Calendar subscribes to these, but subscribed calendars
//                         can't be shared with a service account, so we read them
//                         directly. Every event = whole house.
//   BOOKING_CALENDAR_MOCK=1  serve sample data instead of calling Google
//                            (also the default in dev when Google isn't configured)

import { google, type calendar_v3 } from "googleapis";
import { rooms } from "@/data/rooms";
import {
  addDays,
  eventToBlock,
  parseICalBlocks,
  type CalendarBlock,
} from "./availability";

export const TOTAL_ROOMS = rooms[0].totalRooms;

export class CalendarNotConfiguredError extends Error {
  constructor() {
    super("Google Calendar is not configured for bookings");
  }
}

function getConfig() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_BOOKING_CALENDAR_ID;
  if (!email || !key || !calendarId) return null;
  return { email, key, calendarId };
}

export function isMockCalendar(): boolean {
  if (process.env.BOOKING_CALENDAR_MOCK === "1") return true;
  return !getConfig() && process.env.NODE_ENV !== "production";
}

let client: calendar_v3.Calendar | null = null;

function getClient(): { calendar: calendar_v3.Calendar; calendarId: string } {
  const config = getConfig();
  if (!config) throw new CalendarNotConfiguredError();
  if (!client) {
    const auth = new google.auth.JWT({
      email: config.email,
      key: config.key,
      scopes: ["https://www.googleapis.com/auth/calendar.events"],
    });
    client = google.calendar({ version: "v3", auth });
  }
  return { calendar: client, calendarId: config.calendarId };
}

async function listGoogleBlocks(start: string, end: string): Promise<CalendarBlock[]> {
  const { calendar, calendarId } = getClient();
  const blocks: CalendarBlock[] = [];
  let pageToken: string | undefined;
  const now = Date.now();

  do {
    const res = await calendar.events.list({
      calendarId,
      timeMin: `${start}T00:00:00Z`,
      // Timed events covering the last night end the following morning.
      timeMax: `${addDays(end, 1)}T00:00:00Z`,
      singleEvents: true,
      showDeleted: false,
      maxResults: 2500,
      pageToken,
    });
    for (const event of res.data.items ?? []) {
      const block = eventToBlock(event, TOTAL_ROOMS, now);
      if (block) blocks.push(block);
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return blocks;
}

function icalFeedUrls(): string[] {
  return (process.env.BLOCKING_ICAL_URLS ?? "")
    .split(/[\s,]+/)
    .filter((u) => u.startsWith("http"));
}

async function listICalBlocks(url: string): Promise<CalendarBlock[]> {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    // Log only the host: these URLs contain private access tokens.
    throw new Error(`iCal fetch failed for ${new URL(url).host}: ${res.status}`);
  }
  return parseICalBlocks(await res.text(), TOTAL_ROOMS);
}

/** Sample bookings relative to today so the widget can be exercised locally. */
function mockBlocks(): CalendarBlock[] {
  const today = new Date().toISOString().slice(0, 10);
  const span = (from: number, nights: number, roomCount: number): CalendarBlock => ({
    startNight: addDays(today, from),
    endNight: addDays(today, from + nights),
    rooms: roomCount,
  });
  return [
    span(3, 3, 2), // 2 rooms taken → only "1 Room" bookable
    span(10, 4, TOTAL_ROOMS), // whole house (e.g. Airbnb)
    span(18, 2, 1), // 1 room taken → "Entire House" not bookable
    span(19, 1, 1), // overlaps → that night has 1 free
  ];
}

/**
 * All blocks touching nights [start, end) from Google Calendar plus the OTA
 * iCal feeds (Airbnb, VRBO, Booking.com). Throws if any source fails:
 * availability must never silently over-report.
 */
export async function listBlocks(start: string, end: string): Promise<CalendarBlock[]> {
  if (isMockCalendar()) return mockBlocks();
  const results = await Promise.all([
    listGoogleBlocks(start, end),
    ...icalFeedUrls().map(listICalBlocks),
  ]);
  return results.flat();
}
