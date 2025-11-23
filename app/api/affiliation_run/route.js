// app/api/affiliation_run/route.js
export const runtime = "edge";

// Petit helper de réponse JSON standard
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Comparaison "timing-safe" simple (évite de leak via timing)
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function handler(req) {
  const url = new URL(req.url);

  // ✅ Autoriser GET et POST (utile pour Vercel Cron)
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ ok: false, error: "Méthode non autorisée" }, 405);
  }

  // ✅ Sécurité CRON
  const provided = (url.searchParams.get("secret") || "").trim();
  const expected = (process.env.CRON_SECRET || "").trim();

  if (expected && !safeEqual(provided, expected)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  // ✅ URL worker externe configurable
  const WORKER_URL =
    process.env.RAILWAY_RUN_URL ||
    "https://ton-projet-railway.up.railway.app/runCycle";

  // ✅ Fire-and-forget non bloquant (Edge-safe)
  // On ne veut pas que l’API plante si Railway est down.
  const trigger = fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "vercel-cron",
      ts: Date.now(),
    }),
    cache: "no-store",
  }).catch(() => null);

  // On laisse le worker tourner en fond sans attendre
  // (mais on évite un warning d’async non géré)
  trigger;

  return json({
    ok: true,
    msg: "Cycle déclenché ✅",
    worker: WORKER_URL,
    at: new Date().toISOString(),
  });
}

// App Router exports
export async function GET(req) {
  return handler(req);
}
export async function POST(req) {
  return handler(req);
}
