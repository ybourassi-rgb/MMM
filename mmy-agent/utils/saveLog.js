import { Redis } from "@upstash/redis";

// Accepte les 2 conventions d'env
const url =
  process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL;
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN;

if (!url || !token) {
  console.warn("[saveLog] Upstash env missing", {
    hasUrl: !!url,
    hasToken: !!token,
  });
}

const redis = new Redis({ url, token });

/**
 * Sauvegarde un deal canonique dans Redis
 * - deals:all (global)
 * - deals:<category> (par catégorie)
 */
export async function saveDeal(deal) {
  const id =
    deal.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const item = {
    ...deal,
    id,
    ts: Date.now(),
  };

  const payload = JSON.stringify(item);

  await redis.lpush("deals:all", payload);
  await redis.ltrim("deals:all", 0, 300);

  if (item.category) {
    const key = `deals:${String(item.category).toLowerCase()}`;
    await redis.lpush(key, payload);
    await redis.ltrim(key, 0, 200);
  }

  return item;
}

/**
 * Anti-doublon global
 * stocke les liens déjà publiés dans un SET
 */
export async function hasBeenPosted(link) {
  if (!link) return false;
  try {
    return await redis.sismember("posted:links", link);
  } catch (e) {
    console.warn("[hasBeenPosted] redis error", e);
    return false;
  }
}

export async function markPosted(link) {
  if (!link) return;
  try {
    await redis.sadd("posted:links", link);

    // optionnel: garder le set “propre”
    const size = await redis.scard("posted:links");
    if (size > 5000) {
      // pas parfait mais évite l’explosion
      await redis.del("posted:links");
    }
  } catch (e) {
    console.warn("[markPosted] redis error", e);
  }
}
