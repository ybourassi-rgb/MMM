import { Redis } from "@upstash/redis";

// petite fonction utilitaire pour rediriger proprement
function safeRedirect(res, url) {
  res.writeHead(302, { Location: url });
  res.end();
}

export default async function handler(req, res) {
  try {
    // --- METHOD CHECK ---
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ ok: false, error: "Use GET" });
    }

    // --- URL PARAM CHECK ---
    const raw = req.query.url;
    if (!raw) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing url" });
    }

    // --- TRY TO NORMALIZE URL ---
    let target;
    try {
      const normalized = Array.isArray(raw) ? raw[0] : raw;

      try {
        // direct
        target = new URL(normalized).toString();
      } catch {
        // try decode first
        target = new URL(
          decodeURIComponent(normalized)
        ).toString();
      }
    } catch (err) {
      console.error("❌ URL invalid:", err.message);
      return safeRedirect(res, "https://google.com"); // fallback safe
    }

    // --- BUILD WITH UTM ---
    let finalUrl = target;
    try {
      const u = new URL(target);
      u.searchParams.set("utm_source", "MMY");
      u.searchParams.set("utm_medium", "telegram");
      u.searchParams.set("utm_campaign", "MMY_DEALS");
      finalUrl = u.toString();
    } catch (e) {
      console.warn("⚠️ Failed UTM, redirecting raw");
      finalUrl = target;
    }

    // --- REDIS INIT SAFE ---
    let redis = null;
    try {
      const url =
        process.env.UPSTASH_REDIS_REST_URL ||
        process.env.UPSTASH_REDIS_URL ||
        process.env.UPSTASH_REST_URL;

      const token =
        process.env.UPSTASH_REDIS_REST_TOKEN ||
        process.env.UPSTASH_REDIS_TOKEN ||
        process.env.UPSTASH_REST_TOKEN;

      if (url && token) {
        redis = new Redis({ url, token });
      }
    } catch (e) {
      console.warn("⚠️ Redis init error:", e.message);
    }

    // --- TRACK CLICK (NON BLOCKING) ---
    if (redis) {
      redis
        .lpush(
          "mmy:clicks",
          JSON.stringify({
            ts: Date.now(),
            url: finalUrl,
            ua: req.headers["user-agent"] || "",
          })
        )
        .catch((err) =>
          console.warn("⚠️ Redis push error:", err.message)
        );
    }

    console.log("🔀 Redirect →", finalUrl);
    return safeRedirect(res, finalUrl);
  } catch (fatal) {
    console.error("🔥 FATAL REDIRECT ERROR:", fatal);
    return safeRedirect(res, "https://google.com");
  }
}
