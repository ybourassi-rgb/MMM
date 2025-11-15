// /api/redirect.js

export default async function handler(req, res) {
  try {
    // --- METHOD CHECK ---
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "Use GET" });
    }

    // --- URL PARAM CHECK ---
    const raw = req.query.url;
    if (!raw) {
      return res.status(400).json({ ok: false, error: "Missing url" });
    }

    // --- NORMALISATION DE L'URL ---
    let target;
    try {
      const normalized = Array.isArray(raw) ? raw[0] : raw;

      try {
        // direct
        target = new URL(normalized).toString();
      } catch {
        // essai avec decodeURIComponent d'abord
        target = new URL(decodeURIComponent(normalized)).toString();
      }
    } catch (err) {
      console.error("❌ URL invalid:", err?.message || err);
      // on redirige quand même vers un truc safe
      return res.redirect(302, "https://google.com");
    }

    // --- AJOUT DES PARAMS UTM (facultatif mais propre) ---
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

    // --- TRACKING REDIS : FIRE & FORGET (NE BLOQUE PAS LA RÉPONSE) ---
    ;(async () => {
      try {
        const { Redis } = await import("@upstash/redis");

        const url =
          process.env.UPSTASH_REDIS_REST_URL ||
          process.env.UPSTASH_REDIS_URL ||
          process.env.UPSTASH_REST_URL;

        const token =
          process.env.UPSTASH_REDIS_REST_TOKEN ||
          process.env.UPSTASH_REDIS_TOKEN ||
          process.env.UPSTASH_REST_TOKEN;

        if (!url || !token) {
          console.warn("⚠️ No Redis credentials, skip tracking");
          return;
        }

        const redis = new Redis({ url, token });

        // on push le clic
        await redis.lpush(
          "mmy:clicks",
          JSON.stringify({
            ts: Date.now(),
            url: finalUrl,
            ua: req.headers["user-agent"] || "",
          })
        );

        // on garde seulement les 1000 derniers pour ne pas exploser la liste
        await redis.ltrim("mmy:clicks", 0, 999);
      } catch (err) {
        console.warn("⚠️ Redirect Redis error:", err?.message || err);
      }
    })();

    console.log("🔀 Redirect →", finalUrl);

    // 👉 TRÈS IMPORTANT : on renvoie la réponse tout de suite
    return res.redirect(302, finalUrl);
  } catch (fatal) {
    console.error("🔥 FATAL REDIRECT ERROR:", fatal);
    return res.redirect(302, "https://google.com");
  }
}
