// mmy-agent/utils/saveLog.js
import { Redis } from "@upstash/redis";

// ✅ on accepte les 2 noms d'env
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
 * Sauvegarde un deal dans Redis (canonique)
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

/**
 * Anti-doublon global (news + deals)
 * On stocke les liens déjà postés dans un SET.
 */
export async function hasBeenPosted(link) {
  if (!link) return false;
  try {
    const r = await redis.sismember("posted:links", link);
    return !!r;
  } catch (e) {
    console.warn("[hasBeenPosted] err", e?.message);
    return false;
  }
}

/**
 * Marque un lien comme posté.
 * On garde le set propre avec un TTL (optionnel).
 */
export async function markPosted(link) {
  if (!link) return false;
  try {
    await redis.sadd("posted:links", link);
    // TTL 30 jours sur le set (si pas déjà défini)
    const ttl = await redis.ttl("posted:links");
    if (ttl < 0) {
      await redis.expire("posted:links", 60 * 60 * 24 * 30);
    }
    return true;
  } catch (e) {
    console.warn("[markPosted] err", e?.message);
    return false;
  }
}
