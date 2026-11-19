// The Abeiku report: the room total it carries is what partner commission
// (15% for agencies) is worked out from, and a failed report never throws.
// confirm.test.ts covers the report through finalizeStripeSession.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { buildReferralReport, reportReferralBooking } from "./referral-report";

function session(
  meta: Record<string, string> = {},
  extra: Partial<Stripe.Checkout.Session> = {}
): Stripe.Checkout.Session {
  return {
    id: "cs_test_1",
    amount_total: 17071, // 2000 GHS × 1 night at 11.716 → $170.71
    currency: "usd",
    customer_email: "ama@example.com",
    metadata: {
      bookingId: "ARC-1A2B3C4D",
      checkIn: "2027-03-15",
      checkOut: "2027-03-16",
      nights: "1",
      totalGhs: "2000",
      ghsPerUsd: "11.716",
      rooms: "3",
      roomsLabel: "Entire House",
      refCode: "Carmens-Travels",
      ...meta,
    },
    ...extra,
  } as unknown as Stripe.Checkout.Session;
}

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  process.env.ABEIKU_REFERRAL_SECRET = "test-secret";
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildReferralReport", () => {
  it("carries the room total in USD (what was paid) and GH₵, the commission basis", () => {
    const r = buildReferralReport(session(), new Date("2027-03-01T10:00:00Z"))!;
    expect(r).toMatchObject({
      booking_ref: "ARC-1A2B3C4D",
      ref_code: "Carmens-Travels",
      room_total_usd: 170.71,
      amount_paid: 170.71,
      total_ghs: 2000,
      ghs_per_usd: 11.716,
      nights: 1,
      currency: "usd",
      paid_at: "2027-03-01T10:00:00.000Z",
    });
    // 15% agency commission on these totals: $25.61 / GH₵300.
    expect(Math.round(r.room_total_usd * 0.15 * 100) / 100).toBe(25.61);
    expect(r.total_ghs! * 0.15).toBe(300);
  });

  it("multi-night totals pass through untouched", () => {
    const r = buildReferralReport(
      session({ nights: "4", totalGhs: "2800", rooms: "1", roomsLabel: "1 Room" }, { amount_total: 23899 })
    )!;
    expect(r).toMatchObject({ nights: 4, total_ghs: 2800, room_total_usd: 238.99, rooms_count: 1 });
  });

  it("returns null for a session that carries no booking", () => {
    expect(buildReferralReport(session({ bookingId: "" }))).toBeNull();
    expect(buildReferralReport({ metadata: null } as unknown as Stripe.Checkout.Session)).toBeNull();
  });

  it("non-numeric metadata becomes null, never NaN", () => {
    const r = buildReferralReport(session({ totalGhs: "abc", ghsPerUsd: "" }))!;
    expect(r.total_ghs).toBeNull();
    expect(r.ghs_per_usd).toBeNull();
  });

  it("a missing amount reports 0, not NaN", () => {
    expect(buildReferralReport(session({}, { amount_total: null }))!.room_total_usd).toBe(0);
  });
});

describe("reportReferralBooking never breaks a booking", () => {
  it("resolves when fetch throws synchronously", async () => {
    fetchMock.mockImplementation(() => {
      throw new TypeError("boom");
    });
    await expect(reportReferralBooking(session())).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("resolves when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNRESET"));
    await expect(reportReferralBooking(session())).resolves.toBeUndefined();
  });

  it("resolves on a 4xx/5xx and logs only the status", async () => {
    fetchMock.mockResolvedValue(new Response("ama@example.com", { status: 422 }));
    await expect(reportReferralBooking(session())).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith("[referral] Abeiku report failed", "ARC-1A2B3C4D", 422);
  });

  it("does not call Abeiku for a session without a booking", async () => {
    await reportReferralBooking(session({ bookingId: "" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
