// api/affiliation_stats.js
import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ ok: false, error: "Méthode non autorisée, utilise GET" });
    }

    const url =
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_URL ||
      process.env.UPSTASH_REST_URL;

    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.UPSTASH_REDIS_TOKEN ||
      process.env.UPSTASH_REST_TOKEN;

    // Si pas de Redis → on renvoie simplement des stats vides
    if (!url || !token) {
      return res.status(200).json({
        ok: true,
        total: 0,
        byDomain: {},
        message:
          "Redis non configuré (normal si tu n'as pas encore de variables Redis)",
      });
    }

    const redis = new Redis({ url, token });

    const raw = await redis.lrange("mmy:clicks", 0, 499);

    const clicks = raw
      .map((i) => {
        try {
          return JSON.parse(i);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const byDomain = {};
    for (const c of clicks) {
      try {
        const u = new URL(c.url);
        const domain = u.hostname.replace(/^www\./, "");
        if (!byDomain[domain]) byDomain[domain] = 0;
        byDomain[domain]++;
      } catch {}
    }

    return res.status(200).json({
      ok: true,
      total: clicks.length,
      byDomain,
    });
  } catch (err) {
    console.error("🔥 Erreur /api/affiliation_stats:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
