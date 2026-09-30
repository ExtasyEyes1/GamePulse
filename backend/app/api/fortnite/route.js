import { NextResponse } from 'next/server';

const ACCOUNT_TYPES = new Set(['epic', 'psn', 'xbl']);
const rateLimit = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

function corsHeaders(request) {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:8000';
  const origin = request.headers.get('origin');
  const headers = new Headers({ Vary: 'Origin' });
  if (origin === allowedOrigin) headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request) {
  const headers = corsHeaders(request);
  const json = (body, status = 200) => NextResponse.json(body, { status, headers });
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get('name') || '').trim();
  const accountType = (searchParams.get('accountType') || 'epic').toLowerCase();
  if (!name || name.length > 80 || /[\u0000-\u001f]/.test(name) || !ACCOUNT_TYPES.has(accountType)) {
    return json({ error: 'Enter a valid Fortnite display name and platform.' }, 400);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const bucket = rateLimit.get(ip) || { start: now, count: 0 };
  if (now - bucket.start > WINDOW_MS) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1;
  rateLimit.set(ip, bucket);
  if (bucket.count > MAX_REQUESTS) return json({ error: 'Too many profile lookups. Wait a minute and try again.' }, 429);

  const apiKey = process.env.FORTNITE_API_KEY;
  if (!apiKey) return json({ error: 'Fortnite API key is not configured on the server.' }, 503);

  const endpoint = `https://fortnite-api.com/v2/stats/br/v2?name=${encodeURIComponent(name)}&accountType=${accountType}`;
  try {
    const upstream = await fetch(endpoint, {
      headers: { Authorization: apiKey, Accept: 'application/json' },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(20_000),
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok || payload?.status !== 200) {
      const status = [401, 403, 404, 429].includes(upstream.status) ? upstream.status : 502;
      const message = status === 401 ? 'Fortnite API rejected the API key.' : status === 403 ? 'This Fortnite profile cannot be accessed.' : status === 404 ? 'Fortnite profile was not found or its statistics are private.' : status === 429 ? 'Fortnite API rate limit reached. Try again shortly.' : 'Fortnite API could not return this profile.';
      return json({ error: message }, status);
    }
    return json(payload, 200);
  } catch (error) {
    console.error('Fortnite API upstream request failed:', error?.cause?.code || error?.name || 'unknown');
    return json({ error: 'Could not connect to Fortnite API. Try again later.' }, 502);
  }
}
