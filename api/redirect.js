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

    // 🔥 UTILISE LES VRAIES VARIABLES VERCEL :
    const url =
      process.env.UPSTASH_REST_URL ||
      process.env.UPSTASH_REDIS_REST_URL;

    const token =
      process.env.UPSTASH_REST_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN;

    let redis = null;
    if (url && token) {
      redis = new Redis({ url, token });
    } else {
      console.log("⚠️ Redis désactivé — variables manquantes");
    }

    if (redis) {
      redis.lpush(
        "mmy:clicks",
        JSON.stringify({
          ts: Date.now(),
          url: finalUrl,
          ua: req.headers["user-agent"] || "",
        })
      ).catch((err) => console.warn("⚠️ Redis push error:", err.message));
    }

    console.log("🔀 Redirect →", finalUrl);
    return res.redirect(302, finalUrl);

  } catch (fatal) {
    console.error("🔥 FATAL REDIRECT ERROR:", fatal);
    return res.redirect(302, "https://google.com");
  }
}
