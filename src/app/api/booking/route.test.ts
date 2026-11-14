// The aracuya_ref cookie becomes refCode in the Stripe Checkout metadata.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const createSession = vi.fn<(args: { metadata: Record<string, string> }) => Promise<object>>(async () => ({
  id: "cs_test_1",
  url: "https://checkout.stripe.com/x",
}));

vi.mock("@/lib/booking/calendar", async (orig) => ({
  ...(await orig<typeof import("@/lib/booking/calendar")>()),
  getFreeRooms: vi.fn(async () => ({})),
  createHold: vi.fn(async () => "evt_1"),
  attachPaymentRef: vi.fn(async () => {}),
  releaseHold: vi.fn(async () => {}),
}));
vi.mock("@/lib/booking/availability", async (orig) => ({
  ...(await orig<typeof import("@/lib/booking/availability")>()),
  rangeFits: () => true,
}));
vi.mock("@/lib/booking/ghl-booking", () => ({ ghlBookingStarted: vi.fn(async () => {}) }));
vi.mock("@/lib/booking/pricing", async (orig) => ({
  ...(await orig<typeof import("@/lib/booking/pricing")>()),
  getGhsPerUsd: vi.fn(async () => 11.716),
}));
vi.mock("@/lib/payments/stripe", async (orig) => ({
  ...(await orig<typeof import("@/lib/payments/stripe")>()),
  getStripe: () => ({ checkout: { sessions: { create: createSession } } }),
  isStripeTestMode: () => true,
}));

const { POST } = await import("./route");

function day(offset: number) {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}

let ipCounter = 0;
function book(cookie?: string) {
  return POST(
    new NextRequest("https://aracuya.com/api/booking", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nf-client-connection-ip": `10.0.0.${++ipCounter}`,
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify({
        rooms: 1,
        checkIn: day(60),
        checkOut: day(62),
        name: "Test Guest",
        email: "guest@example.com",
        phone: "+233 24 123 4567",
        guests: 2,
        method: "card",
      }),
    })
  );
}

describe("POST /api/booking (card)", () => {
  beforeEach(() => createSession.mockClear());

  it("puts the ref code from the cookie into the Stripe metadata", async () => {
    const res = await book("aracuya_ref=Carmens-Travels");
    expect(res.status).toBe(200);
    const { metadata } = createSession.mock.calls[0][0];
    expect(metadata.refCode).toBe("Carmens-Travels");
    expect(metadata.nights).toBe("2");
    expect(metadata.ghsPerUsd).toBe("11.716");
  });

  it("leaves refCode out without a cookie", async () => {
    await book();
    expect(createSession.mock.calls[0][0].metadata).not.toHaveProperty("refCode");
  });

  it("ignores a tampered cookie", async () => {
    await book("aracuya_ref=%3Cscript%3E");
    expect(createSession.mock.calls[0][0].metadata).not.toHaveProperty("refCode");
  });
});
