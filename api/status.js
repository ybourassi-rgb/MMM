// /api/status.js
export const config = { runtime: 'edge' };

function headers() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  };
}

export default async function handler() {
  const hasOpenAIKey =
    !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

  // Upstash (facultatif)
  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  const hasUpstashKV = !!(restUrl && restToken);

  const now = new Date();
  const serverNowISO = now.toISOString();
  const todayFr = now.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // 👉 Feed "garanti" : si tu veux, remplace par tes vraies URLs ensuite.
  const feed = [
    {
      id: 'bmw-320d-2019',
      type: 'auto',
      title: 'BMW 320d 2019 • 92 000 km — 17 900€',
      price: 17900,
      url: 'https://www.ebay.fr/',
      updatedAtISO: serverNowISO,
      source: 'demo'
    },
    {
      id: 'studio-gueliz-34m2',
      type: 'immo',
      title: 'Studio Gueliz • 34 m² — 460 000 MAD',
      price: 460000,
      url: 'https://www.booking.com/',
      updatedAtISO: serverNowISO,
      source: 'demo'
    }
  ];

  const body = {
    ok: true,
    status: 'online',
    hasOpenAIKey,
    hasUpstashKV,
    env: process.env.VERCEL_ENV || 'unknown',
    ts: Date.now(),
    serverNowISO,
    todayFr,
    feed
  };

  return new Response(JSON.stringify(body), { status: 200, headers: headers() });
}
