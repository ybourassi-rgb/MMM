import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    const url =
      process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN;

    console.log("[feed] redis url?", !!url, "token?", !!token);

    if (!url || !token) {
      return json(
        { ok: false, error: "Upstash env missing", hasUrl: !!url, hasToken: !!token },
        500
      );
    }

    const redis = new Redis({ url, token });

    const raw = await redis.lrange("deals:all", 0, 50);
    const items = (raw || [])
      .map((x) => { try { return JSON.parse(x); } catch { return null; } })
      .filter(Boolean);

    return json({ items, cursor: null });
  } catch (e) {
    console.error("[feed error]", e);
    return json({ items: [], cursor: null });
  }
}
