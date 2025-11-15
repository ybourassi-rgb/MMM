import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "Use GET" });
    }

    const raw = req.query.url;
    if (!raw) {
      return res.status(400).json({ ok: false, error: "Missing url" });
    }

    // --- NORMALISATION URL ---
    let target;
    try {
      const normalized = Array.isArray(raw) ? raw[0] : raw;

      try {
        target = new URL(normalized).toString();
      } catch {
        target = new URL(decodeURIComponent(normalized)).toString();
      }
    } catch (err) {
      console.error("❌ URL invalid:", err.message);
      return res.redirect(302, "https://google.com");
    }

    // --- UTM ---
    let finalUrl = target;
    try {
      const u = new URL(target);
      u.searchParams.set("utm_source", "MMY");
      u.searchParams.set("utm_medium", "telegram");
      u.searchParams.set("utm_campaign", "MMY_DEALS");
      finalUrl = u.toString();
    } catch {
      finalUrl = target;
    }

    // --- UTILISE TES VRAIES VARIABLES VERCEL ---
    const redisUrl =
      process.env.UPSTASH_REST_URL ||
      process.env.UPSTASH_REDIS_REST_URL;

    const redisToken =
      process.env.UPSTASH_REST_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN;

    let redis = null;

    if (redisUrl && redisToken) {
      redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });
    } else {
      console.log("⚠️ Redis désactivé - Variables manquantes");
    }

    // --- PUSH CLICK ---
    if (redis) {
      try {
        await redis.lpush(
          "mmy:clicks",
          JSON.stringify({
            ts: Date.now(),
            url: finalUrl,
            ua: req.headers["user-agent"] || "",
          })
        );
        console.log("📦 Click enregistré !");
      } catch (err) {
        console.error("⚠️ Redis push error:", err.message);
      }
    }

    console.log("🔀 Redirect →", finalUrl);
    return res.redirect(302, finalUrl);

  } catch (fatal) {
    console.error("🔥 FATAL ERROR:", fatal);
    return res.redirect(302, "https://google.com");
  }
}
