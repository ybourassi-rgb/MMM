// /api/yscore.js
export default async function handler(req, res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Méthode non autorisée" });

  try {
    const { items = [], weights = {}, modeMMM = false } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ ok:false, error:"'items' doit être un tableau" });

    const W = {
      value:     Number(weights.value)     || 0.30,
      quality:   Number(weights.quality)   || 0.25,
      momentum:  Number(weights.momentum)  || 0.20,
      risk:      Number(weights.risk)      || 0.15,
      liquidity: Number(weights.liquidity) || 0.10,
      halalPenalty: Number.isFinite(weights.halalPenalty) ? weights.halalPenalty : 15
    };
    const sum = W.value + W.quality + W.momentum + W.risk + W.liquidity || 1;
    W.value/=sum; W.quality/=sum; W.momentum/=sum; W.risk/=sum; W.liquidity/=sum;

    const results = items.map(it=>{
      const fairValue = num(it.fairValue) || num(it.fairvalue) || num(it.fv) || num(it.price);
      const valueScore = bounded((fairValue - num(it.price)) / Math.max(1, fairValue)); // 0..1
      const quality = bounded(avg([pct(it.profitabilityPct), pct(it.growthYoYPct), invRatio(it.debtToEquity), pct(it.esg), pct(it.quality)]));
      const momentum = bounded(pct(it.momentum30dPct));
      const risk = 1 - bounded(pct(it.volatility30dPct));
      const liquidity = bounded(Math.log10(Math.max(1, num(it.avgDailyLiquidity) || num(it.volume) || 0)) / 6);

      let y = W.value*valueScore + W.quality*quality + W.momentum*momentum + W.risk*risk + W.liquidity*liquidity;
      if (modeMMM && it.halalCompliant === false) { y -= (W.halalPenalty || 0)/100; } // inactif si non utilisé

      return { ...it, yScore: round(y,3) };
    }).sort((a,b)=>b.yScore - a.yScore);

    return res.status(200).json({ ok:true, count: results.length, results });
  } catch (e) {
    console.error("yscore.js:", e);
    return res.status(500).json({ ok:false, error: e?.message || "Erreur interne" });
  }
}

const num = (x)=>Number(x)||0;
const pct = (v)=>bounded((Number(v)||0)/100);
const avg = (a)=>{ const xs=a.filter(n=>Number.isFinite(n)); return xs.length? xs.reduce((p,c)=>p+c,0)/xs.length : 0; };
const invRatio = (v)=>{ const x=Number(v)||0; return bounded(1/(1+Math.max(0,x))); };
const bounded = (x)=>Math.max(0,Math.min(1,x));
const round = (x,d=2)=>{ const k=10**d; return Math.round((x+Number.EPSILON)*k)/k; };
