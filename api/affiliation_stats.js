// /api/affiliation_stats.js
import { Redis } from "@upstash/redis";

// Utilise la config Upstash (URL + TOKEN) depuis les variables d'environnement
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ ok: false, error: "Méthode non autorisée, utilise GET" });
    }

    // Nouveau stockage : hash "affiliate_clicks"
    // Chaque clé = "platform:product" (ex: "amazon:B09XYZ1234")
    const data = await redis.hgetall("affiliate_clicks");

    const items = [];

    if (data) {
      for (const [key, value] of Object.entries(data)) {
        const [platform, product] = String(key).split(":");
        items.push({
          key,                           // ex: "amazon:B09XYZ1234"
          platform: platform || "unknown",
          product: product || "",
          clicks: Number(value) || 0,    // nombre de clics
        });
      }
    }

    // Tri par nombre de clics décroissant
    items.sort((a, b) => b.clicks - a.clicks);

    return res.status(200).json({
      ok: true,
      items,
    });
  } catch (err) {
    console.error("🔥 Erreur /api/affiliation_stats:", err);
    return res
      .status(500)
      .json({ ok: false, error: err.message || "Erreur interne" });
  }
}
