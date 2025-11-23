import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function saveDeal(deal) {
  const id = deal.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const item = { ...deal, id, ts: Date.now() };

  // liste globale
  await redis.lpush("deals:all", JSON.stringify(item));

  // sets par catégorie
  if (item.category) {
    await redis.lpush(`deals:${item.category.toLowerCase()}`, JSON.stringify(item));
  }

  // garde un max (évite explosion)
  await redis.ltrim("deals:all", 0, 300);

  return item;
}
