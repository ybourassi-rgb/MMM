import { Redis } from "@upstash/redis";

export const runtime = "nodejs"; 
// important : Upstash SDK + fetch OK en node runtime

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category"); // optional
    const limit = Number(searchParams.get("limit") || 20);
    const cursor = searchParams.get("cursor"); // optional pour pagination simple

    // clé cible
    const key = category
      ? `deals:${category.toLowerCase()}`
      : "deals:all";

    // Pagination simple par offset
    const offset = cursor ? Number(cursor) : 0;
    const raw = await redis.lrange(key, offset, offset + limit - 1);

    const items = raw
      .map((x) => {
        try {
          return JSON.parse(x);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Nouveau cursor (offset suivant)
    const nextCursor = offset + items.length;

    return Response.json({
      items,
      cursor: items.length ? String(nextCursor) : null,
    });
  } catch (e) {
    console.error("feed error", e);
    return Response.json({ items: [], cursor: null }, { status: 200 });
  }
}
