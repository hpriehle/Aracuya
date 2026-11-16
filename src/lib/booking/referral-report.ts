// Tell Abeiku (the partner system) about every paid booking: Abeiku credits
// the partner when there is a ref code and shows all Aracuya bookings on one
// calendar. Contract agreed with the abeiku desk on 2026-11-14 (guest, room
// and no-ref fields added the same day); Abeiku is idempotent on
// booking_ref + event.
//
// The report carries the guest's email and phone. They go to Abeiku only and
// are never logged.
//
// Never throws and never waits more than 5 seconds: a booking must not depend
// on Abeiku being up.

import type Stripe from "stripe";

const DEFAULT_URL = "https://abeiku.com/api/public/referral/aracuya/booking";
const TIMEOUT_MS = 5_000;

export interface ReferralReport {
  event: "paid";
  booking_ref: string;
  /** Partner ref code, or null for a booking that came in without one. */
  ref_code: string | null;
  check_in: string | null;
  check_out: string | null;
  nights: number | null;
  /** Nights only, in USD. Aracuya adds no fees today, so it equals amount_paid. */
  room_total_usd: number;
  total_ghs: number | null;
  ghs_per_usd: number | null;
  amount_paid: number;
  currency: string;
  paid_at: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  /** Aracuya is one listing booked by room count: id is "1", "2" or "3". */
  room: { id: string; name: string } | null;
  rooms_count: number | null;
  guests: number | null;
}

const num = (v: string | undefined) => {
  const n = Number(v);
  return v && Number.isFinite(n) ? n : null;
};

/** The report for a paid session, or null if it carries no booking. */
export function buildReferralReport(
  session: Stripe.Checkout.Session,
  paidAt: Date = new Date()
): ReferralReport | null {
  const m = session.metadata ?? {};
  if (!m.bookingId) return null;
  const amount = (session.amount_total ?? 0) / 100;
  return {
    event: "paid",
    booking_ref: m.bookingId,
    ref_code: m.refCode || null,
    check_in: m.checkIn || null,
    check_out: m.checkOut || null,
    nights: num(m.nights),
    room_total_usd: amount,
    total_ghs: num(m.totalGhs),
    ghs_per_usd: num(m.ghsPerUsd),
    amount_paid: amount,
    currency: session.currency ?? "usd",
    paid_at: paidAt.toISOString(),
    guest_name: m.guestName || null,
    guest_email: session.customer_email || session.customer_details?.email || null,
    guest_phone: m.guestPhone || null,
    room: m.rooms ? { id: m.rooms, name: m.roomsLabel || m.rooms } : null,
    rooms_count: num(m.rooms),
    guests: num(m.guests),
  };
}

export async function reportReferralBooking(session: Stripe.Checkout.Session): Promise<void> {
  try {
    const secret = process.env.ABEIKU_REFERRAL_SECRET;
    if (!secret) return;
    const report = buildReferralReport(session);
    if (!report) return;

    const res = await fetch(process.env.ABEIKU_REFERRAL_URL || DEFAULT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      // Status only: Abeiku's error body could echo the guest's email or phone.
      console.error("[referral] Abeiku report failed", report.booking_ref, res.status);
    }
  } catch (err) {
    console.error("[referral] Abeiku report failed", session.metadata?.bookingId, err);
  }
}
