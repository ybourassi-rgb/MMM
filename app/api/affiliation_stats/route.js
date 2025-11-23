// app/api/affiliation_stats/route.js
import { Redis } from "@upstash/redis";

export const runtime = "edge";

const redis = Redis.fromEnv();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  try {
    // ✅ Récupération du hash clicks
    const data = await redis.hgetall("affiliate_clicks");

    const items = [];

    if (data) {
      for (const [key, value] of Object.entries(data)) {
        const [platform, product] = String(key).split(":");
        items.push({
          key,                            // ex: "amazon:B09XYZ1234"
          platform: platform || "unknown",
          product: product || "",
          clicks: Number(value) || 0,
        });
      }
    }

    // ✅ Tri décroissant (top deals / top plateformes)
    items.sort((a, b) => b.clicks - a.clicks);

    // ✅ Stats globales utiles pour dashboard
    const totalClicks = items.reduce((sum, it) => sum + it.clicks, 0);

    const byPlatform = items.reduce((acc, it) => {
      acc[it.platform] = (acc[it.platform] || 0) + it.clicks;
      return acc;
    }, {});

    const topPlatform = Object.entries(byPlatform)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return json({
      ok: true,
      totalClicks,
      topPlatform,
      byPlatform,
      items,
      ts: Date.now(),
    });
  } catch (err) {
    // Edge-safe log minimal
    console.error("🔥 affiliation_stats error:", err?.message || err);
    return json(
      { ok: false, error: err?.message || "Erreur interne" },
      500
    );
  }
}

// Si quelqu’un call POST par erreur ➜ message clair
export async function POST() {
  return json(
    { ok: false, error: "Méthode non autorisée, utilise GET" },
    405
  );
}
