// mmy-agent/utils/saveLog.js
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_URL;
const token = process.env.UPSTASH_REDIS_TOKEN;

let redis = null;

if (url && token) {
  redis = new Redis({ url, token });
  console.log("✅ Redis initialisé pour MMY Agent");
} else {
  console.warn(
    "⚠️ UPSTASH_REDIS_URL ou UPSTASH_REDIS_TOKEN manquant → Redis désactivé"
  );
}

/**
 * Vérifie si un lien a déjà été publié.
 * Retourne true / false.
 */
export async function hasBeenPosted(link) {
  if (!redis) return false;

  try {
    const result = await redis.sismember("mmy:posted_links", link);
    return result === 1 || result === true;
  } catch (err) {
    console.error("Erreur hasBeenPosted Redis:", err.message);
    return false;
  }
}

/**
 * Marque un lien comme publié dans l'ensemble Redis.
 */
export async function markPosted(link) {
  if (!redis) return;

  try {
    await redis.sadd("mmy:posted_links", link);
  } catch (err) {
    console.error("Erreur markPosted Redis:", err.message);
  }
}

/**
 * Sauvegarde un log dans Redis (et log console en fallback).
 */
export default async function saveLog(data) {
  const payload = {
    ...data,
    ts: Date.now(),
  };

  // Toujours loguer en console
  console.log("📝 Log:", payload);

  if (!redis) return;

  try {
    await redis.lpush("mmy:logs", JSON.stringify(payload));
  } catch (err) {
    console.error("Erreur saveLog Redis:", err.message);
  }
}
