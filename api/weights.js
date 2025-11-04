// /api/weights.js
export const config = { runtime: "edge" };

const REST_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const DEFAULT_WEIGHTS = {
  value: 0.30, quality: 0.25, momentum: 0.20, risk: 0.15, liquidity: 0.10, halalPenalty: 15
};

function json(data, status = 200) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Vercel-CDN-Cache-Control": "no-store",
    "CDN-Cache-Control": "no-store",
  };
  return new Response(JSON.stringify(data), { status, headers });
}

async function kvGet(key) {
  const r = await fetch(`${REST_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REST_TOKEN}` }
  });
  const data = await r.json(); // { result: "...json..." } ou { result: null }
  return (data && data.result) ? JSON.parse(data.result) : null;
}

async function kvSet(key, value) {
  return fetch(`${REST_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ value: JSON.stringify(value) })
  });
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const profile = (searchParams.get("profile") || "default").trim().toLowerCase();
    const key = `weights:${profile}`;

    if (req.method === "GET") {
      const saved = await kvGet(key);
      if (saved) return json({ ok: true, source: "kv", weights: saved });
      return json({ ok: true, source: "defaults", weights: DEFAULT_WEIGHTS });
    }

    if (req.method === "POST") {
      const body = await req.json();
      // Nettoyage & sécurité minimale
      const w = {
        value: clamp(body.value, 0, 1),
        quality: clamp(body.quality, 0, 1),
        momentum: clamp(body.momentum, 0, 1),
        risk: clamp(body.risk, 0, 1),
        liquidity: clamp(body.liquidity, 0, 1),
        halalPenalty: Math.max(0, Math.min(100, parseInt(body.halalPenalty ?? 0, 10)))
      };
      // Renormalisation (hors halalPenalty)
      const s = (w.value + w.quality + w.momentum + w.risk + w.liquidity) || 1;
      const norm = { ...w };
      norm.value     = w.value     / s;
      norm.quality   = w.quality   / s;
      norm.momentum  = w.momentum  / s;
      norm.risk      = w.risk      / s;
      norm.liquidity = w.liquidity / s;

      await kvSet(key, norm);
      return json({ ok: true, saved: { profile, weights: norm } });
    }

    return json({ ok: false, error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ ok: false, error: e?.message || "Unexpected error" }, 500);
  }
}

function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}
