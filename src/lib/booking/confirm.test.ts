// A paid booking with a ref code is reported to Abeiku, and Abeiku being down
// never stops the booking from confirming.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const confirmBooking = vi.fn();
const ghlBookingConfirmed = vi.fn(async () => {});
const sendBookingEmails = vi.fn(async () => {});

vi.mock("./calendar", () => ({ confirmBooking, getEvent: vi.fn(), releaseHold: vi.fn() }));
vi.mock("./email", () => ({ sendBookingEmails, sendOwnerAlert: vi.fn(async () => {}) }));
vi.mock("./ghl-booking", () => ({ ghlBookingConfirmed }));
vi.mock("@/lib/payments/stripe", () => ({ isStripeTestMode: () => true }));
vi.mock("@/lib/payments/momo", () => ({}));

const { finalizeStripeSession } = await import("./confirm");

const PROPS = { bookingId: "ARC-1A2B3C4D", status: "confirmed" };

function session(meta: Record<string, string> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_test_1",
    payment_status: "paid",
    payment_intent: "pi_1",
    amount_total: 5975,
    currency: "usd",
    metadata: {
      bookingId: "ARC-1A2B3C4D",
      eventId: "evt_1",
      checkIn: "2027-03-15",
      checkOut: "2027-03-16",
      nights: "1",
      totalGhs: "700",
      ghsPerUsd: "11.716",
      refCode: "Carmens-Travels",
      ...meta,
    },
  } as unknown as Stripe.Checkout.Session;
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  confirmBooking.mockResolvedValue({ newlyConfirmed: true, props: PROPS });
  process.env.ABEIKU_REFERRAL_SECRET = "test-secret";
  delete process.env.ABEIKU_REFERRAL_URL;
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("finalizeStripeSession → Abeiku", () => {
  it("POSTs the agreed report when it confirms a paid booking with a ref code", async () => {
    expect(await finalizeStripeSession(session())).toEqual(PROPS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://abeiku.com/api/public/referral/aracuya/booking");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-secret");
    expect(init.headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      event: "paid",
      booking_ref: "ARC-1A2B3C4D",
      ref_code: "Carmens-Travels",
      check_in: "2027-03-15",
      check_out: "2027-03-16",
      nights: 1,
      room_total_usd: 59.75,
      total_ghs: 700,
      ghs_per_usd: 11.716,
      amount_paid: 59.75,
      currency: "usd",
      paid_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    expect(ghlBookingConfirmed).toHaveBeenCalled();
    expect(sendBookingEmails).toHaveBeenCalled();
  });

  it("uses ABEIKU_REFERRAL_URL when set", async () => {
    process.env.ABEIKU_REFERRAL_URL = "http://localhost:4000/hook";
    await finalizeStripeSession(session());
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:4000/hook");
  });

  it("does not report on the second call (already confirmed)", async () => {
    confirmBooking.mockResolvedValue({ newlyConfirmed: false, props: PROPS });
    expect(await finalizeStripeSession(session())).toEqual(PROPS);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not report without a ref code", async () => {
    await finalizeStripeSession(session({ refCode: "" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips silently when ABEIKU_REFERRAL_SECRET is unset", async () => {
    delete process.env.ABEIKU_REFERRAL_SECRET;
    expect(await finalizeStripeSession(session())).toEqual(PROPS);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("does not report unpaid sessions", async () => {
    await finalizeStripeSession({ ...session(), payment_status: "unpaid" } as Stripe.Checkout.Session);
    expect(confirmBooking).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Abeiku down (network error): booking still confirms, error logged", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect(await finalizeStripeSession(session())).toEqual(PROPS);
    expect(sendBookingEmails).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("[referral] Abeiku report failed", "ARC-1A2B3C4D", expect.any(TypeError));
  });

  it("Abeiku returns 500: booking still confirms, error logged", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
    expect(await finalizeStripeSession(session())).toEqual(PROPS);
    expect(console.error).toHaveBeenCalledWith("[referral] Abeiku report failed", "ARC-1A2B3C4D", 500, "boom");
  });

  it("Abeiku hangs: gives up after 5s and the booking still confirms", async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason)))
    );
    const t0 = Date.now();
    expect(await finalizeStripeSession(session())).toEqual(PROPS);
    const took = Date.now() - t0;
    expect(took).toBeGreaterThanOrEqual(4900);
    expect(took).toBeLessThan(6500);
    expect(console.error).toHaveBeenCalled();
  }, 10_000);
});
