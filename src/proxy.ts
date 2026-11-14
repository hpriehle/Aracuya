// Runs only for requests carrying ?ref=CODE (see matcher): remember the
// partner's code in a 30-day first-party cookie. A later ?ref overwrites it.

import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE, REF_MAX_AGE_SECONDS, parseRefCode } from "@/lib/referral";

export function proxy(request: NextRequest) {
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
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api/|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)",
      has: [{ type: "query", key: "ref" }],
    },
  ],
};
