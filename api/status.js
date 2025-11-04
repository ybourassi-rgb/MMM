export const config = { runtime: "edge" };

export default async function handler() {
  const headers = {
    "Cache-Control":"no-store","Pragma":"no-cache","Expires":"0",
    "CDN-Cache-Control":"no-store","Vercel-CDN-Cache-Control":"no-store",
    "Content-Type":"application/json; charset=utf-8"
  };

  const hasOpenAI = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10);
  const hasKV = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  return new Response(JSON.stringify({
    ok:true, status:"online", env: process.env.VERCEL_ENV || "unknown",
    hasOpenAIKey: hasOpenAI, hasUpstashKV: hasKV, ts: Date.now()
  }), { status:200, headers });
}
