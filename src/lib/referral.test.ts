// ?ref=CODE on any page → aracuya_ref cookie for 30 days.

import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "@/proxy";
import { REF_COOKIE, parseRefCode } from "@/lib/referral";

function visit(url: string) {
  return proxy(new NextRequest(url)).cookies.get(REF_COOKIE);
}

describe("parseRefCode", () => {
  it("keeps valid codes as given", () => {
    expect(parseRefCode("Kofi-Tours-1")).toBe("Kofi-Tours-1");
    expect(parseRefCode("a".repeat(40))).toBe("a".repeat(40));
  });
  it("rejects bad codes", () => {
    for (const bad of ["", "a".repeat(41), "kofi tours", "kofi_tours", "<script>", "é", null, undefined]) {
      expect(parseRefCode(bad)).toBeNull();
    }
  });
});

describe("proxy", () => {
  it("sets a 30-day first-party cookie from ?ref", () => {
    const c = visit("https://aracuya.com/nzulezu?ref=Carmens-Travels");
    expect(c?.value).toBe("Carmens-Travels");
    expect(c?.maxAge).toBe(30 * 24 * 60 * 60);
    expect(c?.path).toBe("/");
    expect(c?.sameSite).toBe("lax");
    expect(c?.httpOnly).toBe(true);
    expect(c?.secure).toBe(true);
  });

  it("a later ?ref overwrites the cookie", () => {
    const req = new NextRequest("https://aracuya.com/?ref=NEW-1", { headers: { cookie: `${REF_COOKIE}=OLD` } });
    expect(proxy(req).cookies.get(REF_COOKIE)?.value).toBe("NEW-1");
  });

  it("ignores invalid codes and leaves an existing cookie alone", () => {
    expect(visit("https://aracuya.com/?ref=not%20valid")).toBeUndefined();
    expect(visit(`https://aracuya.com/?ref=${"x".repeat(41)}`)).toBeUndefined();
  });

  it("only runs on page requests that carry ?ref", () => {
    expect(config.matcher[0].has).toEqual([{ type: "query", key: "ref" }]);
    const re = new RegExp(`^${config.matcher[0].source}$`);
    expect(re.test("/")).toBe(true);
    expect(re.test("/rooms/villa")).toBe(true);
    expect(re.test("/api/booking")).toBe(false);
    expect(re.test("/_next/static/x.js")).toBe(false);
    expect(re.test("/icon.png")).toBe(false);
  });
});
