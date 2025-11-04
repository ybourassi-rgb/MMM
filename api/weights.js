// MMM/api/weights.js

// ---- Defaults ----
const DEFAULT_WEIGHTS = {
  value: 0.30,
  quality: 0.25,
  momentum: 0.20,
  risk: 0.15,
  liquidity: 0.10,
  halalPenalty: 15, // points soustraits si non halal (mode MMM)
};

// ---- In-memory fallback (volatile) ----
const memoryStore = new Map();

// ---- Upstash Redis (optionnel) ----
const HAS_KV =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

async function kvGet(key) {
  if (!HAS_KV) return memoryStore.get(key);
  const r = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  const json = await r.json().catch(() => ({}));
  // Upstash renvoie { result: "..." } où ... est stringifié si set via /set
  if (json && typeof json.result === "string") {
    try { return JSON.parse(json.result); } catch { return json.result; }
  }
  return json?.result ?? null;
}

async function kvSet(key, value) {
  if (!HAS_KV) {
    memoryStore.set(key, value);
    return true;
  }
  const payload = JSON.stringify(value);
  const r = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(payload)}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  return r.ok;
}

// ---- Utils / validation ----
function asNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeWeights(input) {
  const w = { ...DEFAULT_WEIGHTS, ...(input || {}) };
  ["value", "quality", "momentum", "risk", "liquidity"].forEach((k) => {
    w[k] = Math.max(0, asNumber(w[k]) ?? DEFAULT_WEIGHTS[k]);
  });
  w.halalPenalty = Math.max(0, Math.min(100, asNumber(w.halalPenalty) ?? DEFAULT_WEIGHTS.halalPenalty));

  // renormalisation (somme = 1) pour les 5 premières clés
  const sum = (w.value + w.quality + w.momentum + w.risk + w.liquidity) || 1;
  return {
    value: w.value / sum,
    quality: w.quality / sum,
    momentum: w.momentum / sum,
    risk: w.risk / sum,
    liquidity: w.liquidity / sum,
    halalPenalty: w.halalPenalty,
  };
}

function keyFor(profile = "default") {
  return `yscore:weights:${profile}`;
}

// ---- Handler (Vercel/Next) ----
export default async function handler(req, res) {
  try {
    const profile = (req.query?.profile || "default").toString();
    const key = keyFor(profile);

    if (req.method === "GET") {
      const saved = await kvGet(key);
      const weights = saved ? normalizeWeights(saved) : normalizeWeights(DEFAULT_WEIGHTS);
      return res.status(200).json({
        ok: true,
        profile,
        source: saved ? (HAS_KV ? "kv" : "memory") : "defaults",
        weights,
        version: "weights.v1.0.0",
      });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "object" && req.body !== null ? req.body
                 : JSON.parse(req.body || "{}");

      const next = normalizeWeights(body);
      await kvSet(key, next);

      return res.status(200).json({
        ok: true,
        profile,
        saved: true,
        weights: next,
      });
    }

    return res.status(405).json({ ok: false, error: "Méthode non autorisée" });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err?.message || "Invalid request" });
  }
}
