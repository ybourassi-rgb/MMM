// api/redirect.js
import { Redis } from "@upstash/redis";

const url =
  process.env.UPSTASH_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.UPSTASH_REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
if (url && token) {
  redis = new Redis({ url, token });
  console.log("✅ Redirect: Redis initialisé");
} else {
  console.warn("⚠️ Redirect: Redis non configuré, pas de tracking");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  const target = req.query.url;
  const src = req.query.src || "tg";
  const tag = req.query.tag || "mmy";

  if (!target) {
    return res.status(400).json({ ok: false, error: "Missing url" });
  }

  try {
    const urlObj = new URL(target);

    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Invalid protocol");
    }

    if (redis) {
      await redis.lpush(
        "mmy:clicks",
        JSON.stringify({
          ts: Date.now(),
          url: target,
          src,
          tag,
        })
      );
    }

    return res.redirect(302, urlObj.toString());
  } catch (e) {
    console.error("Redirect error:", e.message);
    return res.status(400).json({ ok: false, error: "Invalid URL" });
  }
}
