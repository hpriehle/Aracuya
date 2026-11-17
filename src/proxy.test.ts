// The ?ref click is reported to Abeiku, best effort.
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy, parseCountry } from "@/proxy";

afterEach(() => vi.unstubAllGlobals());

describe("proxy click report", () => {
  it("posts the code to Abeiku and still sets the cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const req = new NextRequest("https://aracuya.com/?ref=carmen-travels", {
      headers: { "user-agent": "UA", "x-nf-client-connection-ip": "1.2.3.4", "x-nf-geo": JSON.stringify({ country: { code: "GH" } }) },
    });
    const res = await proxy(req);
    expect(res.cookies.get("aracuya_ref")?.value).toBe("carmen-travels");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://abeiku.com/api/public/referral/aracuya/visit");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ slug: "carmen-travels", user_agent: "UA", country: "GH" });
    expect(body.ip_hash).toMatch(/^[0-9a-f]{24}$/);
    expect(JSON.stringify(body)).not.toContain("1.2.3.4");
  });

  it("never fails the page when Abeiku errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const res = await proxy(new NextRequest("https://aracuya.com/?ref=carmen-travels"));
    expect(res.cookies.get("aracuya_ref")?.value).toBe("carmen-travels");
  });

  it("does not call Abeiku for an invalid code", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await proxy(new NextRequest("https://aracuya.com/?ref=%3Cscript%3E"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads plain or base64 x-nf-geo", () => {
    const j = JSON.stringify({ country: { code: "US" } });
    expect(parseCountry(j)).toBe("US");
    expect(parseCountry(btoa(j))).toBe("US");
    expect(parseCountry("junk")).toBeNull();
  });
});
