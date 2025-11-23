// app/api/feed/route.js
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN,
});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  try {
    // Exemple: tu lis ta liste deals canonique
    const items = (await redis.lrange("deals:all", 0, 50)) || [];

    return json({
      ok: true,
      items,
      cursor: null, // si tu utilises pagination plus tard
    });
  } catch (e) {
    console.error("[api/feed]", e);
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
