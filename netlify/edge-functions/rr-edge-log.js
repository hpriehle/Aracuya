// Netlify Edge Function, copied from local-website-engine ops/edge-log/netlify-edge.js.
// The Netlify-side door of rr-edge-log (README.md): for each HTML page served,
// send the request's facts to the Worker's /ingest, which classifies the user
// agent and writes the rr_pageviews row. AI crawlers don't run JavaScript, so
// the browser tracker never sees them; this does.
//
// Site env (netlify env:set, edge functions scope): RR_SLUG = the hub slug,
// RR_EDGE_LOG_TOKEN = the Worker's INGEST_TOKEN. Without either it does nothing.
// The response is returned untouched, and the log is sent after it with
// waitUntil, so a slow or failed log never delays or breaks a page.
const ENDPOINT = 'https://rr-edge-log.hpriehle.workers.dev/ingest';

export default async (request, context) => {
  const res = await context.next();
  const slug = Netlify.env.get('RR_SLUG'), token = Netlify.env.get('RR_EDGE_LOG_TOKEN');
  const type = res.headers.get('content-type') ?? '';
  if (!slug || !token || request.method !== 'GET' || res.status !== 200 || !type.startsWith('text/html')) return res;
  const url = new URL(request.url);
  const send = fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug,
      path: url.pathname,
      host: url.hostname,
      referer: request.headers.get('referer') ?? '',
      ua: request.headers.get('user-agent') ?? '',
      utmSource: url.searchParams.get('utm_source') ?? '',
      country: context.geo?.country?.code ?? '',
    }),
  }).catch(() => {});
  // waitUntil sends after the page; without it an unawaited fetch can be cut
  // off when the response ends, so wait, but never more than 300 ms.
  if (typeof context.waitUntil === 'function') context.waitUntil(send);
  else await Promise.race([send, new Promise((r) => setTimeout(r, 300))]);
  return res;
};

// Pages only: skip the function bundle, assets and the tracker's own proxy.
export const config = {
  path: '/*',
  excludedPath: ['/api/*', '/.netlify/*', '/_next/*', '/*.js', '/*.css', '/*.png', '/*.jpg', '/*.jpeg', '/*.webp', '/*.avif', '/*.svg', '/*.ico', '/*.woff2', '/*.xml', '/*.txt', '/*.json'],
};
