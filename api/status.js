// /api/status.js
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const hasOpenAI = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10);
  const hasKV = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  return res.status(200).json({
    ok: true,
    status: "online",
    hasOpenAIKey: hasOpenAI,
    hasUpstashKV: hasKV,
    env: process.env.VERCEL_ENV || "unknown",
    ts: Date.now()
  });
}
