// Google Calendar access for bookings (server-only).
//
// Auth: a Google service account that the Aracuya calendar is shared with
// ("Make changes and see all event details"). Env:
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
//   BOOKING_CALENDAR_WRITES=on|off
//                         Whether holds/bookings are written to the real calendar.
//                         Default: on only when Stripe uses a live key, so test
//                         payments never block real dates. When off, writes go to
//                         an in-memory calendar that availability still reads.

import { randomUUID } from "node:crypto";
import { google, type calendar_v3 } from "googleapis";
import { rooms } from "@/data/rooms";
import {
  addDays,
  eventToBlock,
  parseICalBlocks,
  rangeFits,
  nightlyFreeRooms,
  type CalendarBlock,
} from "./availability";

export const TOTAL_ROOMS = rooms[0].totalRooms;

export class CalendarNotConfiguredError extends Error {
  constructor() {
    super("Google Calendar is not configured for bookings");
  }
}

export class SoldOutError extends Error {
  constructor() {
    super("Those dates were just booked by someone else");
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

/** Whether holds and bookings go to the real Google Calendar. */
export function calendarWritesEnabled(): boolean {
  if (isMockCalendar()) return false;
  const flag = process.env.BOOKING_CALENDAR_WRITES;
  if (flag === "on") return true;
  if (flag === "off") return false;
  return process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ?? false;
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

// ---------------------------------------------------------------------------
// In-memory calendar, used for writes when real writes are disabled.
// Per server instance only — good enough for local testing.

// Kept on globalThis: Next bundles route handlers and pages separately, so a
// module-level Map would give the API and the confirmation page different copies.
const memoryStore = globalThis as typeof globalThis & {
  __aracuyaMemoryEvents?: Map<string, calendar_v3.Schema$Event>;
};
const memoryEvents = (memoryStore.__aracuyaMemoryEvents ??= new Map());

function memoryEventsInRange(start: string, end: string): calendar_v3.Schema$Event[] {
  return [...memoryEvents.values()].filter(
    (e) => (e.start?.date ?? "") < end && (e.end?.date ?? "") > start
  );
}

// ---------------------------------------------------------------------------
// Reading

async function listGoogleEvents(start: string, end: string): Promise<calendar_v3.Schema$Event[]> {
  if (isMockCalendar()) return [];
  const { calendar, calendarId } = getClient();
  const events: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;

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
    events.push(...(res.data.items ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return events;
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
 * All blocks touching nights [start, end) from Google Calendar, the OTA iCal
 * feeds (Airbnb, VRBO, Booking.com) and any in-memory test bookings.
 * `ignore` drops specific calendar events (used by the hold race check).
 * Throws if any source fails: availability must never silently over-report.
 */
export async function listBlocks(
  start: string,
  end: string,
  ignore?: (event: calendar_v3.Schema$Event) => boolean
): Promise<CalendarBlock[]> {
  const now = Date.now();
  const toBlocks = (events: calendar_v3.Schema$Event[]) =>
    events
      .filter((e) => !ignore?.(e))
      .map((e) => eventToBlock(e, TOTAL_ROOMS, now))
      .filter((b): b is CalendarBlock => b !== null);

  const [googleEvents, ...feeds] = await Promise.all([
    listGoogleEvents(start, end),
    ...icalFeedUrls().map(listICalBlocks),
  ]);
  return [
    ...(isMockCalendar() ? mockBlocks() : []),
    ...toBlocks(googleEvents),
    ...toBlocks(memoryEventsInRange(start, end)),
    ...feeds.flat(),
  ];
}

export async function getFreeRooms(start: string, end: string) {
  return nightlyFreeRooms(await listBlocks(start, end), start, end, TOTAL_ROOMS);
}

// ---------------------------------------------------------------------------
// Writing: holds → confirmed bookings

export interface BookingDetails {
  bookingId: string;
  rooms: number;
  roomsLabel: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  totalGhs: number;
  provider: "stripe" | "momo";
  referral?: string;
}

export type BookingProps = Record<string, string>;

function bookingDescription(d: BookingDetails, extra: string[] = []): string {
  return [
    `Booking ${d.bookingId} (booked on aracuya.com)`,
    `Guest: ${d.guestName}`,
    `Email: ${d.guestEmail}`,
    `Phone: ${d.guestPhone}`,
    `Guests: ${d.guests}`,
    `Rooms: ${d.roomsLabel}`,
    `Total: GH₵${d.totalGhs.toLocaleString("en-US")}`,
    `Payment: ${d.provider === "stripe" ? "card (Stripe)" : "MTN MoMo"}`,
    ...(d.referral ? [`Referral: ${d.referral}`] : []),
    ...extra,
  ].join("\n");
}

async function insertEvent(event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
  if (!calendarWritesEnabled()) {
    const stored = { ...event, id: randomUUID().replace(/-/g, ""), created: new Date().toISOString() };
    memoryEvents.set(stored.id, stored);
    return stored;
  }
  const { calendar, calendarId } = getClient();
  const res = await calendar.events.insert({ calendarId, requestBody: event });
  return res.data;
}

export async function getEvent(eventId: string): Promise<calendar_v3.Schema$Event | null> {
  if (!calendarWritesEnabled()) return memoryEvents.get(eventId) ?? null;
  const { calendar, calendarId } = getClient();
  try {
    const res = await calendar.events.get({ calendarId, eventId });
    return res.data.status === "cancelled" ? null : res.data;
  } catch (err) {
    if ((err as { code?: number }).code === 404 || (err as { code?: number }).code === 410) {
      return null;
    }
    throw err;
  }
}

async function patchEvent(eventId: string, patch: calendar_v3.Schema$Event): Promise<void> {
  if (!calendarWritesEnabled()) {
    const current = memoryEvents.get(eventId);
    if (current) memoryEvents.set(eventId, { ...current, ...patch });
    return;
  }
  const { calendar, calendarId } = getClient();
  await calendar.events.patch({ calendarId, eventId, requestBody: patch });
}

async function deleteEvent(eventId: string): Promise<void> {
  if (!calendarWritesEnabled()) {
    memoryEvents.delete(eventId);
    return;
  }
  const { calendar, calendarId } = getClient();
  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code !== 404 && code !== 410) throw err;
  }
}

/**
 * Block the dates while the guest pays. Inserts a hold, then re-checks
 * availability counting only events that existed before it; if two guests
 * raced for the last room, the later hold is removed and SoldOutError thrown.
 */
export async function createHold(d: BookingDetails, holdMinutes: number): Promise<string> {
  const expiresAt = new Date(Date.now() + holdMinutes * 60_000).toISOString();
  const props: BookingProps = {
    source: "aracuya-site",
    bookingId: d.bookingId,
    rooms: String(d.rooms),
    status: "hold",
    expiresAt,
    provider: d.provider,
    checkIn: d.checkIn,
    checkOut: d.checkOut,
    totalGhs: String(d.totalGhs),
    guestName: d.guestName.slice(0, 200),
    guestEmail: d.guestEmail.slice(0, 200),
    guestPhone: d.guestPhone.slice(0, 50),
    guests: String(d.guests),
    roomsLabel: d.roomsLabel,
    ...(d.referral ? { referral: d.referral.slice(0, 60) } : {}),
  };

  const hold = await insertEvent({
    summary: `HOLD · ${d.roomsLabel} · ${d.guestName} (awaiting payment)`,
    description: bookingDescription(d, [`Hold expires: ${expiresAt}`]),
    start: { date: d.checkIn },
    end: { date: d.checkOut },
    transparency: "opaque",
    colorId: "5", // yellow: pending
    extendedProperties: { private: props },
  });
  const holdId = hold.id!;
  const holdCreated = hold.created ?? new Date().toISOString();

  // Ignore our own hold and any hold placed after ours.
  const isLaterOrSelf = (e: calendar_v3.Schema$Event) => {
    if (e.id === holdId) return true;
    if (e.extendedProperties?.private?.status !== "hold") return false;
    const created = e.created ?? "";
    return created > holdCreated || (created === holdCreated && (e.id ?? "") > holdId);
  };

  try {
    const blocks = await listBlocks(d.checkIn, d.checkOut, isLaterOrSelf);
    const free = nightlyFreeRooms(blocks, d.checkIn, d.checkOut, TOTAL_ROOMS);
    if (!rangeFits(free, d.checkIn, d.checkOut, d.rooms)) {
      await deleteEvent(holdId);
      throw new SoldOutError();
    }
  } catch (err) {
    if (!(err instanceof SoldOutError)) await deleteEvent(holdId).catch(() => {});
    throw err;
  }
  return holdId;
}

export async function attachPaymentRef(eventId: string, paymentRef: string): Promise<void> {
  const event = await getEvent(eventId);
  if (!event) return;
  await patchEvent(eventId, {
    extendedProperties: { private: { ...event.extendedProperties?.private, paymentRef } },
  });
}

/**
 * Turn a hold into a confirmed booking. Idempotent: returns `false` if the
 * event was already confirmed (so callers only send emails once).
 * Throws if the hold no longer exists.
 */
export async function confirmBooking(
  eventId: string,
  payment: { paymentRef: string; paidLabel: string }
): Promise<{ newlyConfirmed: boolean; props: BookingProps }> {
  const event = await getEvent(eventId);
  if (!event) throw new Error(`Booking event ${eventId} not found`);
  const props = { ...(event.extendedProperties?.private ?? {}) } as BookingProps;
  if (props.status === "confirmed") return { newlyConfirmed: false, props };

  const next: BookingProps = {
    ...props,
    status: "confirmed",
    expiresAt: "",
    paymentRef: payment.paymentRef,
    paid: payment.paidLabel,
  };
  await patchEvent(eventId, {
    summary: `Aracuya · ${props.roomsLabel} · ${props.guestName} (paid ${payment.paidLabel})`,
    description: (event.description ?? "")
      .split("\n")
      .filter((line) => !line.startsWith("Hold expires:"))
      .concat(`Paid: ${payment.paidLabel} (${payment.paymentRef})`)
      .join("\n"),
    colorId: "10", // green: paid
    extendedProperties: { private: next },
  });
  return { newlyConfirmed: true, props: next };
}

/** Remove an unpaid hold. Never touches confirmed bookings. */
export async function releaseHold(eventId: string): Promise<void> {
  const event = await getEvent(eventId);
  if (event?.extendedProperties?.private?.status === "hold") await deleteEvent(eventId);
}
