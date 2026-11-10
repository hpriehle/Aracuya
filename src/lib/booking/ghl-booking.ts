// Website bookings → GoHighLevel. Every guest who starts checkout becomes (or
// updates) a GHL contact with their email and WhatsApp number, and the booking
// is written to the contact's "Booking …" custom fields so GHL workflows can
// send the emails and, later, WhatsApp messages (confirmation, arrival
// instructions, follow-ups).
//
// Tags (use them as workflow triggers):
//   website booking started    guest reached payment (removed once confirmed)
//   website booking confirmed  paid; removed and re-added on every booking so
//                              "tag added" fires again for returning guests
//
// Test payments (Stripe test mode, MoMo sandbox) are skipped unless
// GHL_SYNC_TEST_BOOKINGS=on, and are then tagged "test booking".
// Never throws: a GHL outage must not break a booking.

import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import { ghlConfigured, ghlRequest } from "@/lib/ghl";
import { eachNight } from "./availability";
import type { BookingProps } from "./calendar";

export const TAG_STARTED = "website booking started";
export const TAG_CONFIRMED = "website booking confirmed";
const TAG_TEST = "test booking";

interface Booking {
  bookingId: string;
  roomsLabel: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number | string;
  totalGhs: number | string;
}

function shouldSync(testPayment: boolean): boolean {
  if (!ghlConfigured()) return false;
  return !testPayment || process.env.GHL_SYNC_TEST_BOOKINGS === "on";
}

function e164(phone: string): string | undefined {
  return parsePhoneNumberFromString(phone)?.number ?? (phone.trim() || undefined);
}

/** Field key (e.g. "contact.booking_id") → id, read once per server instance. */
let fieldIds: Promise<Map<string, string>> | null = null;
function getFieldIds(): Promise<Map<string, string>> {
  fieldIds ??= (async () => {
    const data = (await ghlRequest(
      "GET",
      `/locations/${process.env.GHL_LOCATION_ID}/customFields?model=contact`
    )) as { customFields?: { id: string; fieldKey: string }[] };
    return new Map((data.customFields ?? []).map((f) => [f.fieldKey, f.id]));
  })().catch((err) => {
    fieldIds = null;
    throw err;
  });
  return fieldIds;
}

async function upsert(b: Booking, status: string, extra: Record<string, string>, tags: string[]) {
  const ids = await getFieldIds();
  const values: Record<string, string | number> = {
    "contact.booking_id": b.bookingId,
    "contact.booking_status": status,
    "contact.booking_checkin": b.checkIn,
    "contact.booking_checkout": b.checkOut,
    "contact.booking_rooms": b.roomsLabel,
    "contact.booking_nights": eachNight(b.checkIn, b.checkOut).length,
    "contact.booking_guests": Number(b.guests),
    "contact.booking_total": `GH₵${Number(b.totalGhs).toLocaleString("en-US")}`,
    ...extra,
  };
  const customFields = Object.entries(values)
    .filter(([key]) => ids.has(key))
    .map(([key, value]) => ({ id: ids.get(key), field_value: value }));

  const [firstName, ...rest] = b.guestName.trim().split(/\s+/);
  const data = (await ghlRequest("POST", "/contacts/upsert", {
    locationId: process.env.GHL_LOCATION_ID,
    firstName,
    lastName: rest.join(" ") || undefined,
    name: b.guestName.trim(),
    email: b.guestEmail.trim(),
    phone: e164(b.guestPhone),
    source: "Aracuya website booking",
    tags,
    customFields,
  })) as { contact?: { id?: string } };
  const id = data.contact?.id;
  if (!id) throw new Error("GHL upsert returned no contact id");
  return id;
}

/** Guest reached payment: save them, so unfinished bookings can be followed up. */
export async function ghlBookingStarted(b: Booking, testPayment: boolean): Promise<void> {
  if (!shouldSync(testPayment)) return;
  try {
    await upsert(b, "checkout started", {}, testPayment ? [TAG_STARTED, TAG_TEST] : [TAG_STARTED]);
  } catch (err) {
    console.error("[ghl] booking started", b.bookingId, err);
  }
}

/** Paid and confirmed: fill the booking fields and fire the confirmation workflow. */
export async function ghlBookingConfirmed(
  p: BookingProps,
  paidLabel: string,
  testPayment: boolean
): Promise<void> {
  if (!shouldSync(testPayment)) return;
  try {
    const b: Booking = {
      bookingId: p.bookingId,
      roomsLabel: p.roomsLabel,
      checkIn: p.checkIn,
      checkOut: p.checkOut,
      guestName: p.guestName,
      guestEmail: p.guestEmail,
      guestPhone: p.guestPhone,
      guests: p.guests,
      totalGhs: p.totalGhs,
    };
    const id = await upsert(b, "confirmed", { "contact.booking_payment": paidLabel }, testPayment ? [TAG_TEST] : []);
    // Re-add the trigger tag so the workflow runs for returning guests too.
    await ghlRequest("DELETE", `/contacts/${id}/tags`, { tags: [TAG_CONFIRMED, TAG_STARTED] });
    await ghlRequest("POST", `/contacts/${id}/tags`, { tags: [TAG_CONFIRMED] });
    await ghlRequest("POST", `/contacts/${id}/notes`, {
      body: [
        `Booking ${b.bookingId} confirmed (aracuya.com)`,
        `${b.roomsLabel}, ${b.checkIn} to ${b.checkOut} (${eachNight(b.checkIn, b.checkOut).length} nights), ${b.guests} guests`,
        `Paid: ${paidLabel}`,
      ].join("\n"),
    });
  } catch (err) {
    console.error("[ghl] booking confirmed", p.bookingId, err);
  }
}
