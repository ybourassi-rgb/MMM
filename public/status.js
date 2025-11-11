// /api/status.js
export const config = { runtime: 'edge' };

export default async function handler() {
  const hasOpenAIKey =
    !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

  // -> lit les bons noms, et accepte l'ancienne variante "REDIS" en fallback
  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  const hasUpstashKV = !!(restUrl && restToken);

  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  };

  return new Response(
    JSON.stringify({
      ok: true,
      status: 'online',
      hasOpenAIKey,
      hasUpstashKV,
      env: process.env.VERCEL_ENV || 'unknown',
      ts: Date.now(),
    }),
    { status: 200, headers }
  );
}
