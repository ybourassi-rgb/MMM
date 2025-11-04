// MMM/api/yscore.js

// ========= Defaults =========
const DEFAULT_WEIGHTS = {
  value: 0.30,
  quality: 0.25,
  momentum: 0.20,
  risk: 0.15,
  liquidity: 0.10,
  halalPenalty: 15, // points soustraits si modeMMM && non halal
};

const DEFAULT_PARAMS = {
  // Value
  maxUndervaluationPct: 60,

  // Momentum
  momentumMidPct: 0,
  momentumScale: 12,

  // Risk (volatilité)
  targetLowVolPct: 15,
  highVolPct: 60,

  // Liquidity
  liqGood: 10000,
  liqPoor: 50,

  // Quality (si non fourni)
  profitGoodPct: 15,
  profitPoorPct: 0,
  growthGoodPct: 20,
  growthPoorPct: -5,
  dteLow: 0.2,
  dteHigh: 2.0,
  esgGood: 80,
  esgPoor: 30,
};

// ========= Helpers (math) =========
const clamp01 = (x) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
const mapLinear = (x, a, b) => clamp01((x - a) / (b - a));
const invMapLinear = (x, a, b) => clamp01((b - x) / (b - a));
const sigmoid01 = (x) => 1 / (1 + Math.exp(-x));

// ========= Sub-scores 0..100 =========
function valueScore(price, fairValue, maxUndervaluationPct) {
  if (!(fairValue > 0) || !(price >= 0)) return 50;
  const undervaluation = ((fairValue - price) / fairValue) * 100; // en %
  const span = maxUndervaluationPct;
  const v = clamp01((undervaluation + span) / (2 * span)); // -span..+span → 0..1
  return Math.round(v * 100);
}

function momentumScore(momentumPct, mid, scale) {
  if (!isFinite(momentumPct)) return 50;
  const x = (momentumPct - mid) / scale;
  return Math.round(sigmoid01(x) * 100);
}

function riskScore(volPct, low, high) {
  if (!isFinite(volPct)) return 50;
  const s = invMapLinear(volPct, low, high); // faible vol = meilleur
  return Math.round(s * 100);
}

function liquidityScore(liq, poor, good) {
  if (!isFinite(liq)) return 50;
  const l = Math.log10(Math.max(liq, 1));
  const lPoor = Math.log10(Math.max(poor, 1));
  const lGood = Math.log10(Math.max(good, 10));
  const s = mapLinear(l, lPoor, lGood);
  return Math.round(s * 100);
}

function qualityFromComponents(
  profitabilityPct,
  growthYoYPct,
  dte,
  esg,
  p
) {
  const pScore = isFinite(profitabilityPct)
    ? Math.round(mapLinear(profitabilityPct, p.profitPoorPct, p.profitGoodPct) * 100)
    : 50;

  const gScore = isFinite(growthYoYPct)
    ? Math.round(mapLinear(growthYoYPct, p.growthPoorPct, p.growthGoodPct) * 100)
    : 50;

  const dScore = isFinite(dte)
    ? Math.round(invMapLinear(dte, p.dteLow, p.dteHigh) * 100)
    : 50;

  const eScore = isFinite(esg)
    ? Math.round(mapLinear(esg, p.esgPoor, p.esgGood) * 100)
    : 50;

  // pondération simple 0.35/0.35/0.2/0.1
  return Math.round(0.35 * pScore + 0.35 * gScore + 0.2 * dScore + 0.1 * eScore);
}

// ========= Minimal validation =========
function asNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeWeights(input) {
  const w = { ...DEFAULT_WEIGHTS, ...(input || {}) };
  // borne ≥ 0
  ["value", "quality", "momentum", "risk", "liquidity"].forEach((k) => {
    w[k] = Math.max(0, asNumber(w[k]) ?? DEFAULT_WEIGHTS[k]);
  });
  w.halalPenalty = Math.max(0, Math.min(100, asNumber(w.halalPenalty) ?? DEFAULT_WEIGHTS.halalPenalty));
  const sum = w.value + w.quality + w.momentum + w.risk + w.liquidity || 1;
  return {
    value: w.value / sum,
    quality: w.quality / sum,
    momentum: w.momentum / sum,
    risk: w.risk / sum,
    liquidity: w.liquidity / sum,
    halalPenalty: w.halalPenalty,
  };
}

function normalizeParams(input) {
  const p = { ...DEFAULT_PARAMS, ...(input || {}) };
  Object.keys(DEFAULT_PARAMS).forEach((k) => {
    if (!Number.isFinite(p[k])) p[k] = DEFAULT_PARAMS[k];
  });
  return p;
}

function ensureItems(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("`items` doit être un tableau non vide.");
  }
  return arr.map((raw) => {
    if (!raw || typeof raw !== "object") throw new Error("Item invalide.");
    const it = { ...raw };
    if (!it.id || typeof it.id !== "string") throw new Error("Chaque item doit avoir un `id` (string).");
    it.price = asNumber(it.price);
    it.fairValue = asNumber(it.fairValue);
    it.momentum30dPct = asNumber(it.momentum30dPct);
    it.volatility30dPct = asNumber(it.volatility30dPct);
    it.avgDailyLiquidity = asNumber(it.avgDailyLiquidity);
    it.quality = asNumber(it.quality);
    it.profitabilityPct = asNumber(it.profitabilityPct);
    it.growthYoYPct = asNumber(it.growthYoYPct);
    it.debtToEquity = asNumber(it.debtToEquity);
    it.esg = asNumber(it.esg);
    it.halalCompliant = Boolean(it.halalCompliant);
    return it;
  });
}

// ========= Handler (Vercel/Next) =========
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        weights: DEFAULT_WEIGHTS,
        params: DEFAULT_PARAMS,
        version: "yscore.v1.0.0",
        doc: {
          endpoint: "POST /api/yscore",
          itemShape: {
            id: "string",
            price: "number",
            fairValue: "number",
            momentum30dPct: "number?",
            volatility30dPct: "number?",
            avgDailyLiquidity: "number?",
            quality: "number? (0..100)",
            profitabilityPct: "number?",
            growthYoYPct: "number?",
            debtToEquity: "number?",
            esg: "number?",
            halalCompliant: "boolean?",
          },
          notes: [
            "Les sous-scores sont 0..100; score final = moyenne pondérée.",
            "Si un signal manque, 50 (neutre) est utilisé.",
            "Mode MMM: pénalité si halalCompliant=false.",
          ],
        },
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Méthode non autorisée" });
    }

    const body = typeof req.body === "object" && req.body !== null ? req.body
               : JSON.parse(req.body || "{}");

    const items = ensureItems(body.items);
    const weights = normalizeWeights(body.weights);
    const params = normalizeParams(body.params);
    const modeMMM = Boolean(body.modeMMM);
    const sortDesc = body.sortDesc === undefined ? true : Boolean(body.sortDesc);

    const results = items.map((it) => {
      const sub = {
        value: valueScore(it.price, it.fairValue, params.maxUndervaluationPct),
        momentum: momentumScore(it.momentum30dPct, params.momentumMidPct, params.momentumScale),
        risk: riskScore(it.volatility30dPct, params.targetLowVolPct, params.highVolPct),
        liquidity: liquidityScore(it.avgDailyLiquidity, params.liqPoor, params.liqGood),
        quality: isFinite(it.quality)
          ? Math.round(clamp01(it.quality / 100) * 100)
          : qualityFromComponents(
              it.profitabilityPct,
              it.growthYoYPct,
              it.debtToEquity,
              it.esg,
              params
            ),
      };

      let core =
        sub.value * weights.value +
        sub.quality * weights.quality +
        sub.momentum * weights.momentum +
        sub.risk * weights.risk +
        sub.liquidity * weights.liquidity;

      let penaltyApplied = 0;
      if (modeMMM && it.halalCompliant === false) {
        penaltyApplied = weights.halalPenalty;
        core = Math.max(0, core - penaltyApplied);
      }

      const yScore = Math.round(core);

      return {
        id: it.id,
        yScore,
        subScores: sub,
        weights,
        penalty: penaltyApplied,
        flags: {
          undervalued: sub.value >= 60,
          highMomentum: sub.momentum >= 65,
          lowRisk: sub.risk >= 65,
          illiquid: sub.liquidity <= 35,
          nonHalal: Boolean(modeMMM && it.halalCompliant === false),
        },
        version: "yscore.v1.0.0",
      };
    });

    const payload = sortDesc
      ? [...results].sort((a, b) => b.yScore - a.yScore)
      : results;

    return res.status(200).json({
      ok: true,
      count: payload.length,
      modeMMM,
      results: payload,
    });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err?.message || "Invalid request" });
  }
}
