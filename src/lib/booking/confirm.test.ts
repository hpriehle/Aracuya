// Every paid booking is reported to Abeiku (ref_code null when there is none),
// and Abeiku being down never stops the booking from confirming.

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
    customer_email: "ama@example.com",
    metadata: {
      bookingId: "ARC-1A2B3C4D",
      eventId: "evt_1",
      checkIn: "2027-03-15",
      checkOut: "2027-03-16",
      nights: "1",
      totalGhs: "700",
      ghsPerUsd: "11.716",
      rooms: "2",
      roomsLabel: "2 Rooms",
      guestName: "Ama Mensah",
      guestPhone: "+233 24 000 0000",
      guests: "3",
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
      guest_name: "Ama Mensah",
      guest_email: "ama@example.com",
      guest_phone: "+233 24 000 0000",
      room: { id: "2", name: "2 Rooms" },
      rooms_count: 2,
      guests: 3,
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

  it("reports a booking without a ref code, with ref_code null", async () => {
    const { refCode: _drop, ...noRef } = session().metadata!;
    await finalizeStripeSession({ ...session(), metadata: noRef } as Stripe.Checkout.Session);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.ref_code).toBeNull();
    expect(body.booking_ref).toBe("ARC-1A2B3C4D");
    expect(body.guest_name).toBe("Ama Mensah");
    expect(body.room).toEqual({ id: "2", name: "2 Rooms" });
  });

  it("an empty ref code is also sent as null", async () => {
    await finalizeStripeSession(session({ refCode: "" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).ref_code).toBeNull();
  });

  it("Entire House: room id 3; email falls back to what the guest typed at Stripe", async () => {
    const s = session({ rooms: "3", roomsLabel: "Entire House" });
    await finalizeStripeSession({
      ...s,
      customer_email: null,
      customer_details: { email: "kofi@example.com" },
    } as unknown as Stripe.Checkout.Session);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.room).toEqual({ id: "3", name: "Entire House" });
    expect(body.rooms_count).toBe(3);
    expect(body.guest_email).toBe("kofi@example.com");
  });

  it("missing guest and room fields are null, never invented", async () => {
    const { rooms, roomsLabel, guestName, guestPhone, guests, ...rest } = session().metadata!;
    void [rooms, roomsLabel, guestName, guestPhone, guests];
    await finalizeStripeSession({ ...session(), customer_email: null, metadata: rest } as Stripe.Checkout.Session);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      guest_name: null,
      guest_email: null,
      guest_phone: null,
      room: null,
      rooms_count: null,
      guests: null,
    });
  });

  it("never logs the guest's email or phone when Abeiku fails", async () => {
    fetchMock.mockResolvedValue(new Response("bad email ama@example.com phone +233 24 000 0000", { status: 422 }));
    await finalizeStripeSession(session());
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).not.toContain("ama@example.com");
    expect(logged).not.toContain("+233");
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
    expect(console.error).toHaveBeenCalledWith("[referral] Abeiku report failed", "ARC-1A2B3C4D", 500);
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
