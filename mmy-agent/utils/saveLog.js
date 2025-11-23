// mmy-agent/utils/saveLog.js
import { Redis } from "@upstash/redis";

// ✅ on accepte les 2 noms, comme /api/feed
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
 * Sauvegarde un deal dans Redis (liste canonique + listes par catégories)
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

  // ✅ liste globale lue par /api/feed
  await redis.lpush("deals:all", payload);
  await redis.ltrim("deals:all", 0, 300);

  // ✅ listes par catégorie
  if (item.category) {
    const key = `deals:${String(item.category).toLowerCase()}`;
    await redis.lpush(key, payload);
    await redis.ltrim(key, 0, 200);
  }

  return item;
}

// --- anti-doublon via Redis ---
const POSTED_KEY = "posted:links";

/**
 * Check si un lien a déjà été posté
 */
export async function hasBeenPosted(link) {
  if (!link) return false;
  const v = await redis.sismember(POSTED_KEY, link);
  return !!v;
}

/**
 * Marque un lien comme déjà posté
 */
export async function markPosted(link) {
  if (!link) return;
  await redis.sadd(POSTED_KEY, link);
}

/**
 * Default export pour matcher:
 * import saveLog from "./utils/saveLog.js"
 */
export default async function saveLog(deal) {
  return saveDeal(deal);
}
