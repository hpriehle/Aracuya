// Tell Abeiku (the partner system) about a paid booking that came through a
// partner ref link, so the partner can be credited. Contract agreed with the
// abeiku desk on 2026-11-14; Abeiku is idempotent on booking_ref + event.
//
// Never throws and never waits more than 5 seconds: a booking must not depend
// on Abeiku being up.

import type Stripe from "stripe";

const DEFAULT_URL = "https://abeiku.com/api/public/referral/aracuya/booking";
const TIMEOUT_MS = 5_000;

export interface ReferralReport {
  event: "paid";
  booking_ref: string;
  ref_code: string;
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
}

const num = (v: string | undefined) => {
  const n = Number(v);
  return v && Number.isFinite(n) ? n : null;
};

/** The report for a paid session, or null if it has no ref code or booking. */
export function buildReferralReport(
  session: Stripe.Checkout.Session,
  paidAt: Date = new Date()
): ReferralReport | null {
  const m = session.metadata ?? {};
  if (!m.refCode || !m.bookingId) return null;
  const amount = (session.amount_total ?? 0) / 100;
  return {
    event: "paid",
    booking_ref: m.bookingId,
    ref_code: m.refCode,
    check_in: m.checkIn || null,
    check_out: m.checkOut || null,
    nights: num(m.nights),
    room_total_usd: amount,
    total_ghs: num(m.totalGhs),
    ghs_per_usd: num(m.ghsPerUsd),
    amount_paid: amount,
    currency: session.currency ?? "usd",
    paid_at: paidAt.toISOString(),
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
      const text = await res.text().catch(() => "");
      console.error("[referral] Abeiku report failed", report.booking_ref, res.status, text.slice(0, 300));
    }
  } catch (err) {
    console.error("[referral] Abeiku report failed", session.metadata?.bookingId, err);
  }
}
