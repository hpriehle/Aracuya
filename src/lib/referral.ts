// Partner ref links: aracuya.com/any-page?ref=CODE remembers CODE for 30 days
// in a first-party cookie, so a booking made later can be credited to the
// partner. Edge-safe (used by src/proxy.ts): no Node imports here.

export const REF_COOKIE = "aracuya_ref";
export const REF_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** A valid code as given (case kept), or null. Codes: letters, digits, "-", up to 40. */
export function parseRefCode(raw: string | null | undefined): string | null {
  const code = raw?.trim();
  return code && /^[A-Za-z0-9-]{1,40}$/.test(code) ? code : null;
}
