import { Redis } from "@upstash/redis";

// ✅ on accepte les 2 noms d'env (Vercel / Railway)
const url =
  process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL;
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN;

if (!url || !token) {
  console.warn("[redis] Upstash env missing", {
    hasUrl: !!url,
    hasToken: !!token,
  });
}

const redis = new Redis({ url, token });

/**
 * Sauvegarde un deal canonique
 * => push dans deals:all + deals:{category}
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

  // liste globale lue par /api/feed
  await redis.lpush("deals:all", payload);
  await redis.ltrim("deals:all", 0, 300);

  // listes par catégorie
  if (item.category) {
    const key = `deals:${String(item.category).toLowerCase()}`;
    await redis.lpush(key, payload);
    await redis.ltrim(key, 0, 200);
  }

  return item;
}

/**
 * Anti-doublon global (news + deals)
 * key: posted:{url}
 */
export async function hasBeenPosted(link) {
  if (!link) return false;
  const key = `posted:${link}`;
  const v = await redis.get(key);
  return !!v;
}

/**
 * Marquer comme publié (TTL 7 jours)
 */
export async function markPosted(link) {
  if (!link) return false;
  const key = `posted:${link}`;
  await redis.set(key, "1", { ex: 60 * 60 * 24 * 7 });
  return true;
}

/**
 * Logger “secondaire” (optionnel)
 * Tu peux l'utiliser si tu veux garder une trace brute
 */
export default async function saveLog(obj) {
  try {
    const payload = JSON.stringify({
      ...obj,
      ts: Date.now(),
    });
    await redis.lpush("logs:agent", payload);
    await redis.ltrim("logs:agent", 0, 500);
  } catch (e) {
    console.warn("[saveLog] error", e?.message);
  }
}
