import { Redis } from "@upstash/redis";

// ✅ on accepte les 2 noms, comme /api/feed
const url =
  process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL;
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN;

if (!url || !token) {
  console.warn("[saveDeal] Upstash env missing", {
    hasUrl: !!url,
    hasToken: !!token,
  });
}

const redis = new Redis({ url, token });

export async function saveDeal(deal) {
  const id =
    deal.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const item = {
    ...deal,
    id,
    ts: Date.now(),
  };

  const payload = JSON.stringify(item);

  // ✅ liste globale lue par /api/feed
  await redis.lpush("deals:all", payload);
  await redis.ltrim("deals:all", 0, 300);

  // ✅ listes par catégorie (+ trim anti-bombe)
  if (item.category) {
    const key = `deals:${String(item.category).toLowerCase()}`;
    await redis.lpush(key, payload);
    await redis.ltrim(key, 0, 200);
  }

  return item;
}
