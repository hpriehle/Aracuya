import { describe, expect, it } from "vitest";
import { startMonth } from "./Calendar";

const nov2026 = new Date(2026, 10, 19);

describe("startMonth", () => {
  it("opens on the current month by default", () => {
    expect(startMonth(undefined, nov2026)).toEqual({ year: 2026, month: 10 });
  });
  it("opens on the given month when it is ahead", () => {
    expect(startMonth("2026-12", nov2026)).toEqual({ year: 2026, month: 11 });
  });
  it("falls back to the current month once the given month has passed", () => {
    expect(startMonth("2026-12", new Date(2027, 0, 5))).toEqual({ year: 2027, month: 0 });
  });
});
