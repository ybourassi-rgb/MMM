import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_URL;
const token = process.env.UPSTASH_REDIS_TOKEN;

let redis = null;
if (url && token) {
  redis = new Redis({ url, token });
} else {
  console.warn("⚠️ UPSTASH_REDIS_URL ou UPSTASH_REDIS_TOKEN manquant → Redis désactivé");
}

// ✅ Fonction pour savoir si un lien a déjà été publié
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

// ✅ Marquer un lien comme publié
export async function markPosted(link) {
  if (!redis) return;
  try {
    await redis.sadd("mmy:posted_links", link);
  } catch (err) {
    console.error("Erreur markPosted Redis:", err.message);
  }
}

// ✅ Sauvegarder un log dans Redis (liste)
export default async function saveLog(data) {
  if (!redis) {
    console.log("📝 Log (non persisté Redis):", {
      ...data,
      ts: Date.now(),
    });
    return;
  }

  try {
    await redis.lpush(
      "mmy:logs",
      JSON.stringify({
        ...data,
        ts: Date.now(),
      })
    );
  } catch (err) {
    console.error("Erreur saveLog Redis:", err.message);
  }
}
