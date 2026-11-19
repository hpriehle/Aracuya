// Stripe webhook: real signature verification (signed locally, no network),
// confirm-once on checkout.session.completed, release on expiry, and the
// guest's ref code reaching the Abeiku report.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import Stripe from "stripe";

const confirmBooking = vi.fn();
const releaseHold = vi.fn(async () => {});
const sendBookingEmails = vi.fn(async () => {});
const ghlBookingConfirmed = vi.fn(async () => {});

vi.mock("@/lib/booking/calendar", () => ({ confirmBooking, releaseHold, getEvent: vi.fn() }));
vi.mock("@/lib/booking/email", () => ({ sendBookingEmails, sendOwnerAlert: vi.fn(async () => {}) }));
vi.mock("@/lib/booking/ghl-booking", () => ({ ghlBookingConfirmed }));
vi.mock("@/lib/payments/momo", () => ({}));

const { POST } = await import("./route");

const SECRET = "whsec_test_secret";
const PROPS = { bookingId: "ARC-1A2B3C4D", status: "confirmed" };

function checkoutEvent(type: string, meta: Record<string, string> = {}) {
  return {
    id: "evt_stripe_1",
    object: "event",
    type,
    data: {
      object: {
        id: "cs_test_1",
        object: "checkout.session",
        payment_status: type === "checkout.session.completed" ? "paid" : "unpaid",
        payment_intent: "pi_1",
        amount_total: 5975,
        currency: "usd",
        customer_email: "ama@example.com",
        metadata: {
          bookingId: "ARC-1A2B3C4D",
          eventId: "gcal_evt_1",
          checkIn: "2027-03-15",
          checkOut: "2027-03-16",
          nights: "1",
          totalGhs: "700",
          ghsPerUsd: "11.716",
          rooms: "1",
          roomsLabel: "1 Room",
          refCode: "Carmens-Travels",
          ...meta,
        },
      },
    },
  };
}

function signedRequest(event: object, secret = SECRET, header?: string) {
  const payload = JSON.stringify(event);
  const signature =
    header ?? new Stripe("sk_test_x").webhooks.generateTestHeaderString({ payload, secret });
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    body: payload,
    headers: signature ? { "stripe-signature": signature } : {},
  });
}

const fetchMock = vi.fn();
let calendarConfirmed: boolean;

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  process.env.ABEIKU_REFERRAL_SECRET = "test-secret";
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  // Like the real calendar: the first confirm flips the hold, later ones are no-ops.
  calendarConfirmed = false;
  confirmBooking.mockReset();
  confirmBooking.mockImplementation(async () => {
    const newlyConfirmed = !calendarConfirmed;
    calendarConfirmed = true;
    return { newlyConfirmed, props: PROPS };
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("POST /api/stripe/webhook", () => {
  it("rejects a signature made with the wrong secret, and touches nothing", async () => {
    const res = await POST(signedRequest(checkoutEvent("checkout.session.completed"), "whsec_wrong"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid signature" });
    expect(confirmBooking).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a tampered body", async () => {
    const event = checkoutEvent("checkout.session.completed");
    const header = new Stripe("sk_test_x").webhooks.generateTestHeaderString({
      payload: JSON.stringify(event),
      secret: SECRET,
    });
    event.data.object.amount_total = 1;
    const res = await POST(signedRequest(event, SECRET, header));
    expect(res.status).toBe(400);
    expect(confirmBooking).not.toHaveBeenCalled();
  });

  it("rejects a request without a signature header", async () => {
    const res = await POST(signedRequest(checkoutEvent("checkout.session.completed"), SECRET, ""));
    expect(res.status).toBe(400);
    expect(confirmBooking).not.toHaveBeenCalled();
  });

  it("rejects everything when STRIPE_WEBHOOK_SECRET is unset", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(signedRequest(checkoutEvent("checkout.session.completed")));
    expect(res.status).toBe(400);
    expect(confirmBooking).not.toHaveBeenCalled();
  });

  it("checkout.session.completed confirms the hold, emails and reports the ref code", async () => {
    const res = await POST(signedRequest(checkoutEvent("checkout.session.completed")));
    expect(res.status).toBe(200);
    expect(confirmBooking).toHaveBeenCalledWith("gcal_evt_1", {
      paymentRef: "pi_1",
      paidLabel: "$59.75 USD by card",
    });
    expect(sendBookingEmails).toHaveBeenCalledTimes(1);
    expect(ghlBookingConfirmed).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      booking_ref: "ARC-1A2B3C4D",
      ref_code: "Carmens-Travels",
      room_total_usd: 59.75,
      total_ghs: 700,
    });
  });

  it("a Stripe retry of the same event is a no-op: no second email or report", async () => {
    const event = checkoutEvent("checkout.session.completed");
    expect((await POST(signedRequest(event))).status).toBe(200);
    expect((await POST(signedRequest(event))).status).toBe(200);
    expect(confirmBooking).toHaveBeenCalledTimes(2);
    expect(sendBookingEmails).toHaveBeenCalledTimes(1);
    expect(ghlBookingConfirmed).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a booking without a ref code is still reported, with ref_code null", async () => {
    await POST(signedRequest(checkoutEvent("checkout.session.completed", { refCode: "" })));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).ref_code).toBeNull();
  });

  it("Abeiku being down does not fail the webhook", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await POST(signedRequest(checkoutEvent("checkout.session.completed")));
    expect(res.status).toBe(200);
    expect(sendBookingEmails).toHaveBeenCalledTimes(1);
  });

  it("checkout.session.expired releases the hold and confirms nothing", async () => {
    const res = await POST(signedRequest(checkoutEvent("checkout.session.expired")));
    expect(res.status).toBe(200);
    expect(releaseHold).toHaveBeenCalledWith("gcal_evt_1");
    expect(confirmBooking).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 500 when a handler throws, so Stripe retries", async () => {
    releaseHold.mockRejectedValueOnce(new Error("Google down"));
    const res = await POST(signedRequest(checkoutEvent("checkout.session.expired")));
    expect(res.status).toBe(500);
  });

  it("ignores other event types with 200", async () => {
    const res = await POST(signedRequest(checkoutEvent("payment_intent.succeeded")));
    expect(res.status).toBe(200);
    expect(confirmBooking).not.toHaveBeenCalled();
    expect(releaseHold).not.toHaveBeenCalled();
  });
});
