import { NextResponse } from 'next/server';

const GAMES = {
  valorant: { slug: 'valorant', platforms: ['riot'] },
  apex: { slug: 'apex', platforms: ['origin', 'psn', 'xbl'] },
  fortnite: { slug: 'fortnite', platforms: ['epic'] },
  'overwatch-2': { slug: 'overwatch', platforms: ['battlenet'] },
  'rocket-league': { slug: 'rocket-league', platforms: ['epic', 'steam', 'psn', 'xbl'] },
  'rainbow-six': { slug: 'r6siege', platforms: ['ubi', 'psn', 'xbl'] },
  'call-of-duty': { slug: 'call-of-duty', platforms: ['battle', 'psn', 'xbl', 'steam'] },
};
const rateLimit = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

function corsHeaders(request) {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:8000';
  const origin = request.headers.get('origin');
  const headers = new Headers({ 'Vary': 'Origin' });
  if (origin === allowedOrigin) headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request, { params }) {
  const headers = corsHeaders(request);
  const { game } = await params;
  const { searchParams } = new URL(request.url);
  const platform = (searchParams.get('platform') || '').toLowerCase();
  const name = (searchParams.get('name') || '').trim();
  const tag = (searchParams.get('tag') || '').trim();

  const json = (body, status = 200) => NextResponse.json(body, { status, headers });
  const gameConfig = GAMES[game];
  if (!gameConfig || !gameConfig.platforms.includes(platform)) {
    return json({ error: 'Unsupported game or platform.' }, 400);
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const bucket = rateLimit.get(ip) || { start: now, count: 0 };
  if (now - bucket.start > WINDOW_MS) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1;
  rateLimit.set(ip, bucket);
  if (bucket.count > MAX_REQUESTS) return json({ error: 'Too many profile lookups. Wait a minute and try again.' }, 429);
  if (!name || name.length > 80 || /[\u0000-\u001f]/.test(name) || tag.length > 32) {
    return json({ error: 'Enter a valid player name and tag.' }, 400);
  }
  if (game === 'valorant' && !tag) {
    return json({ error: 'Valorant requires both Riot ID name and tag.' }, 400);
  }
  const apiKey = process.env.TRN_API_KEY;
  if (!apiKey) return json({ error: 'Tracker API key is not configured on the server.' }, 503);

  const identifier = game === 'valorant' ? `${name}#${tag}` : name;
  const endpoint = `https://public-api.tracker.gg/v2/${gameConfig.slug}/standard/profile/${platform}/${encodeURIComponent(identifier)}`;
  try {
    const upstream = await fetch(endpoint, {
      headers: { 'TRN-Api-Key': apiKey, Accept: 'application/json' },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(20000),
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const status = [401, 403, 404, 429].includes(upstream.status) ? upstream.status : 502;
      const message = status === 401 ? 'Tracker.gg rejected the API key. Check TRN_API_KEY.' : status === 403 ? 'This Tracker.gg API key does not have access to this game or endpoint.' : status === 404 ? 'Player profile was not found.' : status === 429 ? 'Tracker rate limit reached. Try again shortly.' : 'Tracker.gg could not return this profile.';
      return json({ error: message }, status);
    }
    return json(payload, 200);
  } catch (error) {
    console.error('Tracker.gg upstream request failed:', error?.cause?.code || error?.name || 'unknown');
    return json({ error: 'Could not connect to Tracker.gg. Try again later.' }, 502);
  }
}
