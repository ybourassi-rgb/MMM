// api/affiliation_stats.js
import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  try {
    // Autoriser uniquement GET
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ ok: false, error: "Méthode non autorisée, utilise GET" });
    }

    // Init Redis avec toutes les variantes possibles de tes variables
    const url =
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_URL ||
      process.env.UPSTASH_REST_URL;

    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.UPSTASH_REDIS_TOKEN ||
      process.env.UPSTASH_REST_TOKEN;

    if (!url || !token) {
      return res.status(200).json({
        ok: true,
        total: 0,
        byDomain: {},
        message:
          "Redis non configuré, aucun tracking de clics pour l’instant (mais la route répond bien)",
      });
    }

    const redis = new Redis({ url, token });

    // On lit les 500 derniers clics max pour ne pas exploser la fonction
    const raw = await redis.lrange("mmy:clicks", 0, 499);

    const clicks = raw
      .map((item) => {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Agrégation par domaine
    const byDomain = {};
    for (const c of clicks) {
      try {
        const u = new URL(c.url);
        const domain = u.hostname.replace(/^www\./, "");
        if (!byDomain[domain]) byDomain[domain] = 0;
        byDomain[domain] += 1;
      } catch {
        // ignore URL foireuse
      }
    }

    return res.status(200).json({
      ok: true,
      total: clicks.length,
      byDomain,
    });
  } catch (err) {
    console.error("🔥 Erreur /api/affiliation_stats:", err);
    return res.status(500).json({ ok: false, error: "Erreur interne API" });
  }
}
