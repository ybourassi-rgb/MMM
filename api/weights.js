// /api/weights.js
const REST_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const DEFAULT_WEIGHTS = {
  value: 0.30, quality: 0.25, momentum: 0.20, risk: 0.15, liquidity: 0.10, halalPenalty: 15
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const profile = String((req.query.profile || "default")).trim().toLowerCase();
  const key = `weights:${profile}`;

  try {
    if (req.method === "GET") {
      const r = await fetch(`${REST_URL}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${REST_TOKEN}` }
      });
      const data = await r.json();
      const weights = data?.result ? JSON.parse(data.result) : DEFAULT_WEIGHTS;
      return res.status(200).json({ ok:true, source: data?.result ? "kv" : "defaults", weights });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const w = {
        value: clamp(body.value, 0, 1),
        quality: clamp(body.quality, 0, 1),
        momentum: clamp(body.momentum, 0, 1),
        risk: clamp(body.risk, 0, 1),
        liquidity: clamp(body.liquidity, 0, 1),
        halalPenalty: Math.max(0, Math.min(100, parseInt(body.halalPenalty ?? 0, 10)))
      };
      const s = (w.value + w.quality + w.momentum + w.risk + w.liquidity) || 1;
      const norm = { ...w,
        value: w.value/s, quality: w.quality/s, momentum: w.momentum/s, risk: w.risk/s, liquidity: w.liquidity/s
      };

      await fetch(`${REST_URL}/set/${encodeURIComponent(key)}`,{
        method:"POST",
        headers:{ Authorization:`Bearer ${REST_TOKEN}`,"Content-Type":"application/json"},
        body: JSON.stringify({ value: JSON.stringify(norm) })
      });

      return res.status(200).json({ ok:true, saved: { profile, weights: norm } });
    }

    return res.status(405).json({ ok:false, error:"Méthode non autorisée" });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e?.message || "Erreur interne" });
  }
}

function clamp(n,min,max){ const x = Number(n); if (Number.isNaN(x)) return min; return Math.max(min, Math.min(max, x)); }
