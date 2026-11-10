// Booking emails via Resend (server-only).
//
// Env:
//   RESEND_API_KEY
//   BOOKING_NOTIFY_EMAIL  who hears about new bookings (default harrison@riehle.co)
//   BOOKING_EMAIL_FROM    optional sender on a domain verified in Resend
//
// Owner notifications only. Guest emails (and later WhatsApp) are sent by GHL
// workflows triggered from ghl-booking.ts.

import { Resend } from "resend";
import type { BookingProps } from "./calendar";

const TEST_SENDER = "Aracuya Bookings <onboarding@resend.dev>";

function formatDate(date: string): string {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function summaryLines(p: BookingProps, paidLabel: string): string[] {
  return [
    `Booking: ${p.bookingId}`,
    `Stay: ${formatDate(p.checkIn)} → ${formatDate(p.checkOut)}`,
    `Rooms: ${p.roomsLabel}`,
    `Guests: ${p.guests}`,
    `Total: GH₵${Number(p.totalGhs).toLocaleString("en-US")} (paid ${paidLabel})`,
  ];
}

async function send(to: string, subject: string, text: string, from: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[booking-email] RESEND_API_KEY not set; skipped:", subject);
    return;
  }
  const { error } = await new Resend(key).emails.send({ from, to, subject, text });
  if (error) console.error("[booking-email] send failed:", subject, error);
}

export async function sendBookingEmails(p: BookingProps, paidLabel: string, testMode: boolean) {
  const owner = process.env.BOOKING_NOTIFY_EMAIL ?? "harrison@riehle.co";
  const from = process.env.BOOKING_EMAIL_FROM ?? TEST_SENDER;
  const prefix = testMode ? "[TEST] " : "";

  await send(
    owner,
    `${prefix}New booking: ${p.roomsLabel}, ${formatDate(p.checkIn)} (${p.guestName})`,
    [
      ...summaryLines(p, paidLabel),
      "",
      `Guest: ${p.guestName}`,
      `Email: ${p.guestEmail}`,
      `Phone: ${p.guestPhone}`,
      ...(p.referral ? [`Referral: ${p.referral}`] : []),
      `Payment ref: ${p.paymentRef}`,
      "",
      "The dates are blocked on the Aracuya Villas Google Calendar.",
    ].join("\n"),
    from
  );
}

/** Something needs a human: e.g. a guest paid but their hold had vanished. */
export async function sendOwnerAlert(subject: string, lines: string[]) {
  const owner = process.env.BOOKING_NOTIFY_EMAIL ?? "harrison@riehle.co";
  await send(owner, `ACTION NEEDED: ${subject}`, lines.join("\n"), process.env.BOOKING_EMAIL_FROM ?? TEST_SENDER);
}
