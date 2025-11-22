// /api/logs_clicks.js
export const config = { runtime: "edge" };

function headers() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: headers() });
  }
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ ok: false, error: "Méthode non autorisée" }),
      { status: 405, headers: headers() }
    );
  }

  const restUrl =
    process.env.UPSTASH_REST_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";

  if (!restUrl || !restToken) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Upstash non configuré ou clés manquantes.",
      }),
      { status: 400, headers: headers() }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    // 1) Récupère les clés click:*
    const r = await fetch(`${restUrl}/keys/click:*`, {
      headers: { Authorization: `Bearer ${restToken}` },
      cache: "no-store",
    });
    const data = await r.json();
    const keys = data.result || [];

    if (!keys.length) {
      return new Response(
        JSON.stringify({ ok: true, totalKeys: 0, totalClicks: 0, clicks: [] }),
        { status: 200, headers: headers() }
      );
    }

    // 2) Lecture des valeurs en parallèle (beaucoup plus rapide)
    const values = await Promise.all(
      keys.map(async (k) => {
        const valResp = await fetch(`${restUrl}/get/${encodeURIComponent(k)}`, {
          headers: { Authorization: `Bearer ${restToken}` },
          cache: "no-store",
        });
        const valData = await valResp.json();
        return { key: k, count: parseInt(valData.result || 0, 10) };
      })
    );

    // 3) Tri
    values.sort((a, b) => b.count - a.count);

    // 4) Totaux
    const totalClicks = values.reduce((sum, x) => sum + (x.count || 0), 0);

    // 5) Limit top N
    const top = values.slice(0, limit);

    return new Response(
      JSON.stringify({
        ok: true,
        totalKeys: values.length,
        totalClicks,
        clicks: top,
      }),
      { status: 200, headers: headers() }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message || "Erreur interne" }),
      { status: 500, headers: headers() }
    );
  }
}
