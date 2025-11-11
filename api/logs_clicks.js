// /api/logs_clicks.js
export const config = { runtime: "edge" };

function headers() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  };
}

export default async function handler() {
  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

  if (!restUrl || !restToken) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Upstash non configuré ou clés manquantes."
      }),
      { status: 400, headers: headers() }
    );
  }

  try {
    // 🔹 Récupère toutes les clés commençant par "click:"
    const r = await fetch(`${restUrl}/keys/click:*`, {
      headers: { Authorization: `Bearer ${restToken}` },
      cache: "no-store"
    });

    const data = await r.json();
    const keys = data.result || [];

    // 🔹 Pour chaque clé, on lit sa valeur (nombre de clics)
    const clicks = [];
    for (const k of keys) {
      const valResp = await fetch(`${restUrl}/get/${encodeURIComponent(k)}`, {
        headers: { Authorization: `Bearer ${restToken}` },
        cache: "no-store"
      });
      const valData = await valResp.json();
      clicks.push({ key: k, count: parseInt(valData.result || 0) });
    }

    // 🔹 Trie du plus cliqué au moins cliqué
    clicks.sort((a, b) => b.count - a.count);

    return new Response(JSON.stringify({ ok: true, total: clicks.length, clicks }), {
      status: 200,
      headers: headers()
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message || "Erreur interne" }),
      { status: 500, headers: headers() }
    );
  }
}
