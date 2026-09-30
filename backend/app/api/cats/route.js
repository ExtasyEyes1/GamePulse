import { NextResponse } from 'next/server';

const rateLimit = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

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
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const bucket = rateLimit.get(ip) || { start: now, count: 0 };
  if (now - bucket.start > WINDOW_MS) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1;
  rateLimit.set(ip, bucket);
  if (bucket.count > MAX_REQUESTS) return json({ error: 'Too many cat requests. Wait a minute and try again.' }, 429);

  const apiKey = process.env.CAT_API_KEY;
  if (!apiKey) return json({ error: 'The Cat API key is not configured on the server.' }, 503);

  try {
    const upstream = await fetch('https://api.thecatapi.com/v1/images/search?limit=1&has_breeds=1', {
      headers: { 'x-api-key': apiKey, Accept: 'application/json' },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(20_000),
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const status = [401, 403, 429].includes(upstream.status) ? upstream.status : 502;
      const message = status === 401 ? 'The Cat API rejected the API key.' : status === 403 ? 'The Cat API did not allow this request.' : status === 429 ? 'The Cat API rate limit reached. Try again shortly.' : 'The Cat API could not return a cat.';
      return json({ error: message }, status);
    }
    const cat = Array.isArray(payload) ? payload[0] : null;
    if (!cat?.url) return json({ error: 'The Cat API returned no cat image.' }, 502);
    const breed = cat.breeds?.[0] || {};
    return json({
      cat: {
        id: cat.id,
        imageUrl: cat.url,
        width: cat.width,
        height: cat.height,
        breed: {
          name: breed.name || null,
          origin: breed.origin || null,
          temperament: breed.temperament || null,
          lifeSpan: breed.life_span || null,
          weight: breed.weight?.metric || null,
          description: breed.description || null,
        },
      },
    });
  } catch (error) {
    console.error('The Cat API upstream request failed:', error?.cause?.code || error?.name || 'unknown');
    return json({ error: 'Could not connect to The Cat API. Try again later.' }, 502);
  }
}
