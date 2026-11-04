// POST /api/collect — the Siteboard visitor tracker's batches (public/rr.js),
// forwarded to the hub with HUB_INGEST_TOKEN. The browser never holds a token or
// talks to the hub directly, and sendBeacon on pagehide only fires same-origin.
// We pass the visitor's IP so the hub can turn it into a daily one-way hash; the
// hub stores no address.
//
// A port of sovietdefectors' Netlify function (itself a port of the engine's
// sites/foundation/functions/api/collect.js), as a Next route handler:
//  - geo comes from Netlify's base64 x-nf-geo header (no request.cf here), and the
//    IP from x-nf-client-connection-ip;
//  - the forward is awaited before the 204, because there is no waitUntil and an
//    early return can kill it in flight. sendBeacon never waits for the response.
//  - every outcome answers 204, deliberately, so a tracker cannot read whether it
//    was recorded. To debug, read the hub's [collect] log, not this status.
export const dynamic = 'force-dynamic';

const DEFAULT_COLLECT = 'https://hub.clntacq.com/api/collect';
// rrweb's first chunk carries the full DOM snapshot (118–255 KB measured on
// sovietdefectors). 2 MB bounds abuse well inside the hub's 5 MB nginx limit.
const MAX_BODY = 2 * 1024 * 1024;

const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

function geoOf(request: Request) {
  try {
    const raw = request.headers.get('x-nf-geo');
    if (!raw) return { country: '', region: '', city: '' };
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    return {
      country: parsed.country?.code ?? '',
      region: parsed.subdivision?.code ?? '',
      city: parsed.city ?? '',
    };
  } catch {
    return { country: '', region: '', city: '' };
  }
}

export async function POST(request: Request) {
  // Do Not Track and Global Privacy Control: dropped here as well as in the
  // tracker, so a stale script on a cached page cannot override the setting.
  if (request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1') return done();
  if (!process.env.HUB_INGEST_TOKEN) return done();

  const body = await request.text();
  if (!body || body.length > MAX_BODY) return done();

  const geo = geoOf(request);
  try {
    await fetch(process.env.COLLECT_URL || DEFAULT_COLLECT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.HUB_INGEST_TOKEN}`,
        'X-RR-IP': request.headers.get('x-nf-client-connection-ip') ?? '',
        'X-RR-UA': request.headers.get('User-Agent') ?? '',
        'X-RR-Country': geo.country,
        'X-RR-Region': geo.region,
        'X-RR-City': geo.city,
      },
      body,
    });
  } catch (err) {
    console.error('[collect] forward failed', (err as Error).message);
  }
  return done();
}

// The engine's liveness probe sends GET /api/collect and expects 204, not 405.
export async function GET() {
  return done();
}
