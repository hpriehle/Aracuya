import type { NextRequest } from "next/server";

/**
 * The origin the guest is actually on. On Netlify, request.nextUrl.origin is
 * the deploy permalink (<hash>--site.netlify.app), not the domain the guest
 * typed, so redirects built from it would move them to another host.
 */
export function siteOrigin(request: NextRequest): string {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim();
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return request.nextUrl.origin;
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return `${local ? "http" : "https"}://${host}`;
}
