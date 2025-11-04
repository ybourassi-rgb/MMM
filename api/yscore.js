// /api/yscore.js
export const config = { runtime: "edge" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Vercel-CDN-Cache-Control": "no-store",
      "CDN-Cache-Control": "no-store",
    }
  });
}

export default async function handler(req) {
  if (req.method !== "POST") return json({ ok: false, error: "Use POST" }, 405);
  try {
    const { items = [], weights = {}, modeMMM = false } = await req.json();

    const W = {
      value:     Number(weights.value)     || 0.3,
      quality:   Number(weights.quality)   || 0.25,
      momentum:  Number(weights.momentum)  || 0.2,
      risk:      Number(weights.risk)      || 0.15,
      liquidity: Number(weights.liquidity) || 0.1,
      halalPenalty: Number.isFinite(weights.halalPenalty) ? weights.halalPenalty : 15
    };
    const sum = W.value + W.quality + W.momentum + W.risk + W.liquidity || 1;
    // renormalise
    W.value/=sum; W.quality/=sum; W.momentum/=sum; W.risk/=sum; W.liquidity/=sum;

    const scored = items.map(it => {
      // Features dérivées robustes
      const fairValue = Number(it.fairValue) || Number(it.fairvalue) || Number(it.fv) || it.price;
      const valueScore = bounded((fairValue - it.price) / Math.max(1, fairValue)); // 0..1
      const quality = bounded(
        avg([
          percent(it.profitabilityPct),
          percent(it.growthYoYPct),
          invRatio(it.debtToEquity), // plus bas = mieux
          percent(it.esg),
          percent(it.quality)
        ])
      );
      const momentum = bounded(percent(it.momentum30dPct));
      const risk = 1 - bounded(percent(it.volatility30dPct)); // moins de vol = mieux
      const liquidity = bounded(logScale(it.avgDailyLiquidity || it.volume || 0));

      let y = (
        W.value*valueScore +
        W.quality*quality +
        W.momentum*momentum +
        W.risk*risk +
        W.liquidity*liquidity
      );

      // Pénalité halal si MMM
      if (modeMMM && it.halalCompliant === false) {
        y -= (W.halalPenalty || 0) / 100; // 15pts => -0.15
      }

      return { ...it, yScore: round(y, 3) };
    }).sort((a,b) => b.yScore - a.yScore);

    return json({ ok: true, count: scored.length, results: scored });
  } catch (e) {
    return json({ ok: false, error: e?.message || "Y-Score failed" }, 500);
  }
}

function percent(v){ return bounded((Number(v)||0)/100); }
function invRatio(v){ const x = Number(v)||0; return bounded(1 / (1 + Math.max(0,x))); }
function logScale(v){ return bounded(Math.log10(Math.max(1, Number(v))) / 6); } // ~0..1
function avg(arr){ const xs = arr.filter(n=>Number.isFinite(n)); return xs.length? xs.reduce((a,b)=>a+b,0)/xs.length : 0; }
function bounded(x){ return Math.max(0, Math.min(1, x)); }
function round(x, d=2){ const k = 10**d; return Math.round((x + Number.EPSILON)*k)/k; }
