import { describe, expect, it } from "vitest";
import { isChristmasSeason } from "./navigation";

describe("Christmas header strip", () => {
  it("shows through 3 Jan 2027", () => {
    expect(isChristmasSeason(new Date("2026-11-27T12:00:00Z"))).toBe(true);
    expect(isChristmasSeason(new Date("2027-01-03T23:59:59Z"))).toBe(true);
  });

  it("hides itself from 4 Jan 2027", () => {
    expect(isChristmasSeason(new Date("2027-01-04T00:00:00Z"))).toBe(false);
    expect(isChristmasSeason(new Date("2027-02-01T00:00:00Z"))).toBe(false);
  });
});
