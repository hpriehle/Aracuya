// Server-side quotes: the price a guest is charged comes from src/data/rooms.ts,
// never from the browser.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rooms } from "@/data/rooms";
import { MAX_DAYS_AHEAD, QuoteError, getGhsPerUsd, ghsToUsdCents, quote } from "./pricing";

const TODAY = "2027-03-10";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("quote", () => {
  it.each([
    [1, 700],
    [2, 1350],
    [3, 2000],
  ])("%i room(s) cost GH₵%i a night", (n, price) => {
    const q = quote(n, "2027-03-15", "2027-03-16");
    expect(q).toMatchObject({ nights: 1, nightlyGhs: price, totalGhs: price });
    expect(q.tier.rooms).toBe(n);
  });

  it("the whole house sleeps 6", () => {
    expect(rooms[0].occupancy * rooms[0].totalRooms).toBe(6);
  });

  it("total = nightly price × nights", () => {
    expect(quote(2, "2027-03-15", "2027-03-19")).toMatchObject({ nights: 4, totalGhs: 5400 });
  });

  it("counts nights across a month end and a leap day", () => {
    expect(quote(1, "2028-02-27", "2028-03-02").nights).toBe(4);
    expect(quote(1, "2027-03-30", "2027-04-02").nights).toBe(3);
  });

  it.each([0, 4, "1", 1.5, null, undefined])("rejects room count %s", (n) => {
    expect(() => quote(n, "2027-03-15", "2027-03-16")).toThrow(QuoteError);
  });

  it.each([
    ["2027-3-15", "2027-03-16"],
    ["2027-02-30", "2027-03-02"],
    ["2027-03-15", undefined],
    [20270315, "2027-03-16"],
  ])("rejects bad dates %s → %s", (inDate, outDate) => {
    expect(() => quote(1, inDate, outDate)).toThrow(QuoteError);
  });

  it("check-in today is fine; yesterday is not", () => {
    expect(quote(1, TODAY, "2027-03-11").nights).toBe(1);
    expect(() => quote(1, "2027-03-09", "2027-03-11")).toThrow("past");
  });

  it("check-out must be after check-in", () => {
    expect(() => quote(1, "2027-03-15", "2027-03-15")).toThrow("after check-in");
    expect(() => quote(1, "2027-03-15", "2027-03-14")).toThrow("after check-in");
  });

  it("allows 30 nights, not 31", () => {
    expect(quote(3, "2027-04-01", "2027-05-01")).toMatchObject({ nights: 30, totalGhs: 60000 });
    expect(() => quote(3, "2027-04-01", "2027-05-02")).toThrow("30 nights");
  });

  it(`books up to ${MAX_DAYS_AHEAD} days ahead, not one more`, () => {
    // 2027-03-10 + 548 days = 2028-09-08 (2028 is a leap year)
    expect(quote(1, "2028-09-08", "2028-09-09").nights).toBe(1);
    expect(() => quote(1, "2028-09-09", "2028-09-10")).toThrow("too far ahead");
  });
});

describe("USD conversion", () => {
  const rateResponse = (rates: unknown, status = 200) =>
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ rates }), { status })));

  it("reads GHS per USD from the rate feed", async () => {
    rateResponse({ GHS: 11.716 });
    expect(await getGhsPerUsd()).toBe(11.716);
  });

  it.each([
    [{ GHS: 4.99 }],
    [{ GHS: 50.01 }],
    [{ GHS: 0 }],
    [{}],
    [undefined],
  ])("refuses an implausible rate %j instead of mischarging", async (rates) => {
    rateResponse(rates);
    await expect(getGhsPerUsd()).rejects.toThrow("Implausible");
  });

  it("throws when the rate feed is down", async () => {
    rateResponse({ GHS: 11 }, 503);
    await expect(getGhsPerUsd()).rejects.toThrow("503");
  });

  it("converts to USD cents, always rounding up", () => {
    expect(ghsToUsdCents(700, 11.716)).toBe(5975); // 59.7473… → $59.75
    expect(ghsToUsdCents(1350, 13.5)).toBe(10000); // exact stays exact
    expect(ghsToUsdCents(2000, 15)).toBe(13334); // 133.333… → $133.34
  });
});
