// pages/api/track.js
import { Redis } from "@upstash/redis";
import { buildAffiliateRedirect } from "../../lib/affiliations";

// Client Redis (Upstash) – si pas configuré, on restera en mode "no-op"
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  const { url, platform, product, redirect } = req.query;

  // 🟦 MODE 1 : génération de lien affilié → ?url=...
  if (url) {
    try {
      const finalLink = buildAffiliateRedirect(url, {
        source: "dashboard",
        campaign: "amazon-dashboard",
      });

      return res.status(200).json({
        ok: true,
        link: finalLink, // ton composant lit data.link
        original: url,
      });
    } catch (e) {
      console.error("track generate error:", e);
      return res.status(500).json({
        ok: false,
        error: e.message || "internal-error",
      });
    }
  }

  // 🟩 MODE 2 : clic tracké → ?platform=...&product=...&redirect=...
  if (platform && redirect) {
    const redirectUrl = decodeURIComponent(redirect);

    // Incrément du compteur Redis (non bloquant)
    if (redis) {
      try {
        const key = `clicks:${platform}:${product || "unknown"}`;
        await redis.incr(key);
      } catch (e) {
        console.error("Redis track error:", e);
        // on ne bloque pas la redirection pour ça
      }
    }

    // Redirection vers le lien affilié final
    res.writeHead(302, { Location: redirectUrl });
    return res.end();
  }

  // Si aucun des 2 modes ne matche
  return res.status(400).json({
    ok: false,
    error: "Missing ?url= or ?platform=&redirect= parameters",
  });
}
