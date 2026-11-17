# Unstyled pages after a deploy (stale HTML, missing CSS)

## What happened

On 2026-11-11 19:49 UTC a visitor in Accra (mobile) got a page whose HTML came
from the 2026-11-07 build. It asked for
`/_next/static/chunks/49afc1fd51fc3b88.css`, which the live deploy
(`6af3b6b0`) no longer had, so the CSS 404'd and the page showed unstyled.
Between the 7 Nov build and that visit there were nine production deploys.

## Why it can happen

Next.js names every CSS/JS file after a hash of the build. A Netlify deploy
serves only its own files, so the moment a new deploy goes live, every file
name the previous build used is a 404 on `aracuya.com`. Any copy of an older
page that is still around somewhere, and asks for its files after the deploy,
breaks.

There is more than one place such a copy can live:

- **The visitor's browser.** Pages are sent with
  `Cache-Control: public, max-age=0, must-revalidate`. Browsers keep that HTML
  and reuse it *without asking the server* on back/forward navigation and when a
  mobile browser restores a tab it had unloaded. If the CSS is no longer in the
  browser's cache (mobile caches are small), it is fetched, and 404s.
- **Netlify's CDN.** The Next.js plugin caches each page in Netlify's edge and
  durable caches for a year (`s-maxage=31536000, stale-while-revalidate=31536000,
  durable`). Netlify says every deploy invalidates these, and on 2026-11-17 the
  durable cache did refetch a 3-day-old copy of `/contact` instead of serving it
  (`cache-status: "Netlify Durable"; fwd=stale`). So the CDN is unlikely to be
  the source, but nothing in our setup *guaranteed* it.
- Any proxy between the visitor and Netlify (`public` lets them store it).

Which of these served the 7 Nov page on 11 Nov is not proven. The way to tell:
if rr-edge-log has an Aracuya page view at 19:49 from that visitor, Netlify
served the HTML (CDN); if it has none, the browser reused its own copy. The
fix below does not depend on the answer.

## The fix: Netlify skew protection

`netlify.toml` sets `NETLIFY_NEXT_SKEW_PROTECTION = "true"` for builds. With it
the Next.js plugin builds with `NEXT_DEPLOYMENT_ID` = the Netlify deploy id, so
every page asks for its files as
`/_next/static/chunks/<hash>.css?dpl=<deploy id>`, and Netlify's CDN serves a
request carrying `dpl` from **that** deploy, which Netlify keeps. A page from
any earlier deploy, wherever it was cached, gets its own CSS and JS.

Limits:

- Only pages built **after** this ships carry `?dpl=`. Copies of older pages
  can still break once more; from the first deploy after this on, they can't.
- Old files are reachable as long as Netlify keeps the old deploy.
- Two font preload links have no `?dpl=`. Fonts are content-hashed and have not
  changed, so this can at worst give a fallback font, never an unstyled page.
- Client `fetch` calls to `/api/*` (booking, availability) still go to the
  current deploy, as they do today.

## How to check

- `npx vitest run` — `src/skew-protection.test.ts` fails if netlify.toml stops
  enabling it, or if the plugin stops honouring the variable.
- After a deploy: the build log says
  `Setting up Next.js Skew Protection due to NETLIFY_NEXT_SKEW_PROTECTION=true`,
  and `curl -s https://aracuya.com/ | grep -o '_next/static/chunks/[^"]*\.css[^"]*'`
  shows `?dpl=<deploy id>`.
- Then, after the next deploy, the CSS URL from the previous deploy's HTML
  (with its `?dpl=`) still returns 200.
