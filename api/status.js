// /api/status.js
export const config = { runtime: 'edge' };

function headers() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  };
}

export default async function handler() {
  const env = process.env || {};
  const hasOpenAIKey = !!(
    (env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 10) ||
    (env.MoneyMotorY && env.MoneyMotorY.length > 10) ||
    (env.MMM_Vercel_Key && env.MMM_Vercel_Key.length > 10)
  );

  // Upstash present ? (facultatif)
  const restUrl = env.UPSTASH_REST_URL || env.UPSTASH_REDIS_REST_URL || '';
  const restToken = env.UPSTASH_REST_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || '';
  const hasUpstashKV = !!(restUrl && restToken);

  const now = new Date();
  return new Response(
    JSON.stringify({
      ok: true,
      status: 'online',
      hasOpenAIKey,
      hasUpstashKV,
      env: env.VERCEL_ENV || 'production',
      ts: Date.now(),
      serverNowISO: now.toISOString(),
      todayFr: now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      // ⚠️ plus de feed ici : c'est volontairement vide
      feed: [],
    }),
    { status: 200, headers: headers() }
  );
}
