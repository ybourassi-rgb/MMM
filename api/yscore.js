// api/yscore.js
export const config = { runtime: "edge" };

// utils
function clamp(n, a, b){ n = Number(n); if (Number.isNaN(n)) n = 0; return Math.max(a, Math.min(b, n)); }
function num(n){ n = Number(n); return Number.isNaN(n) ? 0 : n; }
const headers = { "Cache-Control":"no-store", "Content-Type":"application/json; charset=utf-8" };

/**
 * MODE 1 (MMM)  : { items:[{ id, price, fairValue, volatility30dPct, avgDailyLiquidity, ... }], weights?, modeMMM? }
 * SORTIE        : { ok:true, count, results:[{ id, yScore, features:{value,quality,momentum,risk,liq} }] }
 *
 * MODE 2 (simple): { price, marketValue, risk, daysToLiquidity, strategic }
 * SORTIE        : { price, marketValue, risk, daysToLiquidity, strategic, profitAbs, profitPct, yScore, decision, createdAt }
 */
export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok:false, error:"Method not allowed" }), { status:405, headers });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok:false, error:"Bad JSON" }), { status:400, headers });
  }

  // --- MODE 1: compat MMM (ton implémentation existante) ---
  if (Array.isArray(body.items)) {
    try {
      const { items = [], weights = {}, modeMMM = false } = body;

      // poids normalisés (comme avant)
      const W = {
        value:.30, quality:.25, momentum:.20, risk:.15, liquidity:.10,
        halalPenalty:15, ...weights
      };
      const sum = (W.value + W.quality + W.momentum + W.risk + W.liquidity) || 1;
      const w = {
        value: W.value/sum, quality: W.quality/sum, momentum: W.momentum/sum,
        risk: W.risk/sum, liquidity: W.liquidity/sum, halalPenalty: W.halalPenalty|0
      };

      const results = items.map(it=>{
        const fair = num(it.fairValue), price = num(it.price);

        // mêmes features qu’avant
        const value = fair>0 ? clamp(((fair-price)/fair)*100, -100, 100) : 0;
        const quality = clamp(
          ("quality" in it) ? num(it.quality)
            : 0.5*(num(it.profitabilityPct)) + 0.5*(num(it.growthYoYPct)) - 30*(num(it.debtToEquity)),
          0, 100);
        const momentum = clamp(num(it.momentum30dPct), -50, 50) + 50; // 0..100
        const risk = 100 - clamp(num(it.volatility30dPct), 0, 100);
        const liq = clamp(
          ("avgDailyLiquidity" in it) ? Math.log10((num(it.avgDailyLiquidity))+1)*20 : 0,
          0, 100);

        let score =
          w.value*clamp(value,0,100) +
          w.quality*quality +
          w.momentum*momentum +
          w.risk*risk +
          w.liquidity*liq;

        if (modeMMM && it.halalCompliant === false) score -= w.halalPenalty;

        return {
          id: it.id || "item",
          yScore: Math.round(clamp(score, 0, 100)),
          features: { value, quality, momentum, risk, liq }
        };
      }).sort((a,b)=> b.yScore - a.yScore);

      return new Response(JSON.stringify({ ok:true, count:results.length, results }), { status:200, headers });
    } catch(e) {
      return new Response(JSON.stringify({ ok:false, error:e?.message || "YS error" }), { status:500, headers });
    }
  }

  // --- MODE 2: format simple v10.4 ---
  try {
    const input = {
      price: num(body.price),
      marketValue: num(body.marketValue),
      risk: clamp(num(body.risk), 0, 100),
      daysToLiquidity: Math.max(0, Math.round(num(body.daysToLiquidity))),
      strategic: clamp(num(body.strategic ?? 70), 0, 100),
    };

    // garde-fous
    if (input.price < 0 || input.marketValue < 0) {
      return new Response(JSON.stringify({ error: "price/marketValue doivent être ≥ 0" }), { status:400, headers });
    }
    if (input.marketValue > 0 && input.price > input.marketValue * 2) {
      return new Response(JSON.stringify({ error: "Anti-outlier: price > 2x marketValue" }), { status:400, headers });
    }

    // config pondérations v10.4 (somme ≈ 100)
    const cfg = {
      weights: {
        weightPrice: 20,
        weightMarketValue: 20,
        weightProfitability: 25,
        weightRisk: 15,
        weightTimeToLiquidity: 10,
        weightStrategic: 10
      },
      thresholds: { excellent: 80, acceptable: 60, risky: 40 },
      timeDecayFactor: 2
    };

    const result = computeYScoreV104(input, cfg);
    const payload = { ...input, ...result, createdAt: new Date().toISOString() };

    return new Response(JSON.stringify(payload), { status:201, headers });
  } catch(e) {
    return new Response(JSON.stringify({ error: e?.message || "YS error" }), { status:500, headers });
  }
}

// --- calcul v10.4 (moteur Money Motor Y)
function computeYScoreV104(d, cfg) {
  const w = cfg.weights, t = cfg.thresholds;
  const safeDiv = (a, b) => (b > 0 ? a / b : 0);

  const profitAbs = d.marketValue - d.price;
  const profitPct = safeDiv(profitAbs, d.price) * 100;

  const priceComponent = d.marketValue > 0 ? (100 - (safeDiv(d.price, d.marketValue) * 100)) : 0;
  const marketValueComponent = d.marketValue > 0 ? 100 : 0;
  const riskComponent = 100 - clamp(d.risk, 0, 100);
  const timeComponent = Math.max(0, 100 - ((d.daysToLiquidity ?? 0) * (cfg.timeDecayFactor ?? 2)));
  const strategicComponent = clamp(d.strategic ?? 0, 0, 100);

  const yScore =
      priceComponent       * (w.weightPrice / 100) +
      marketValueComponent * (w.weightMarketValue / 100) +
      profitPct            * (w.weightProfitability / 100) +
      riskComponent        * (w.weightRisk / 100) +
      timeComponent        * (w.weightTimeToLiquidity / 100) +
      strategicComponent   * (w.weightStrategic / 100);

  const y = clamp(+yScore.toFixed(2), 0, 100);

  let decision = "Mauvaise";
  if (y >= t.excellent) decision = "Excellente";
  else if (y >= t.acceptable) decision = "Acceptable";
  else if (y >= t.risky) decision = "Risquée";

  return {
    profitAbs: +profitAbs.toFixed(2),
    profitPct: +profitPct.toFixed(2),
    yScore: y,
    decision
  };
}
