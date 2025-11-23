// mmy-agent/utils/saveLog.js
import { Redis } from "@upstash/redis";

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

function hashKey(link) {
  return "posted:" + Buffer.from(link).toString("base64");
}

export async function hasBeenPosted(link) {
  if (!link) return false;
  const key = hashKey(link);
  const v = await redis.get(key);
  return v === "1";
}

export async function markPosted(link) {
  if (!link) return;
  const key = hashKey(link);
  // TTL 30 jours pour éviter explosion
  await redis.set(key, "1", { ex: 60 * 60 * 24 * 30 });
}

export async function saveDeal(deal) {
  const id =
    deal.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const item = { ...deal, id, ts: Date.now() };
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

// pour compat avec ton import "saveLog"
export default async function saveLog(deal) {
  return saveDeal(deal);
}
