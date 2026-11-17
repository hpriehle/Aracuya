// Runs only for requests carrying ?ref=CODE (see matcher): remember the
// partner's code in a 30-day first-party cookie (a later ?ref overwrites it)
// and count the click on the partner's Abeiku dashboard. The click report is
// best effort: it waits at most 2 s and never blocks or fails the page.

import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE, REF_MAX_AGE_SECONDS, parseRefCode } from "@/lib/referral";

const VISIT_URL =
  process.env.ABEIKU_VISIT_URL || "https://abeiku.com/api/public/referral/aracuya/visit";
const VISIT_TIMEOUT_MS = 2000;

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const code = parseRefCode(request.nextUrl.searchParams.get("ref"));
  if (code) {
    response.cookies.set(REF_COOKIE, code, {
      maxAge: REF_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
    });
    await reportVisit(request, code);
  }
  return response;
}

export async function reportVisit(request: NextRequest, code: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VISIT_TIMEOUT_MS);
  try {
    const ip =
      request.headers.get("x-nf-client-connection-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    await fetch(VISIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: code.toLowerCase(),
        ip_hash: await hashIp(ip),
        user_agent: request.headers.get("user-agent"),
        referer: request.headers.get("referer"),
        country: parseCountry(request.headers.get("x-nf-geo")),
      }),
      signal: controller.signal,
    });
  } catch {
    // Abeiku down or slow: the visitor still gets the page and the cookie.
  } finally {
    clearTimeout(timer);
  }
}

async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}|${day}`));
  return Array.from(new Uint8Array(buf))
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Netlify's x-nf-geo is JSON, sometimes base64-encoded. */
export function parseCountry(nfGeo: string | null): string | null {
  if (!nfGeo) return null;
  for (const text of [nfGeo, safeAtob(nfGeo)]) {
    if (!text) continue;
    try {
      const code = JSON.parse(text)?.country?.code;
      if (typeof code === "string") return code;
    } catch {
      // try the next form
    }
  }
  return null;
}

function safeAtob(s: string): string | null {
  try {
    return atob(s);
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    {
      source: "/((?!api/|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)",
      has: [{ type: "query", key: "ref" }],
    },
  ],
};
