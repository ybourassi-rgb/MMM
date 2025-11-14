import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export default async function saveLog(data) {
  try {
    await redis.lpush(
      "mmy:logs",
      JSON.stringify({
        ...data,
        ts: Date.now(),
      })
    );
  } catch (err) {
    console.error("Erreur saveLog Redis", err);
  }
}
