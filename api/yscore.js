export const config = { runtime: "edge" };

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

export default async function handler(req) {
  const headers = {
    "Cache-Control":"no-store",
    "Content-Type":"application/json; charset=utf-8"
  };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ok:false,error:'Method not allowed'}), {status:405, headers});
  }

  try{
    const { items = [], weights = {}, modeMMM = false } = await req.json();

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
      const fair = Number(it.fairValue)||0, price = Number(it.price)||0;
      const value = fair>0 ? clamp(((fair-price)/fair)*100, -100, 100) : 0;
      const quality = clamp(
        ('quality' in it) ? Number(it.quality)
          : 0.5*(Number(it.profitabilityPct)||0) + 0.5*(Number(it.growthYoYPct)||0) - 30*(Number(it.debtToEquity)||0),
        0, 100);
      const momentum = clamp(Number(it.momentum30dPct)||0, -50, 50) + 50; // 0..100
      const risk = 100 - clamp(Number(it.volatility30dPct)||0, 0, 100);
      const liq = clamp(
        ('avgDailyLiquidity' in it) ? Math.log10((Number(it.avgDailyLiquidity)||0)+1)*20 : 0,
        0, 100);

      let score = (
        w.value*clamp(value,0,100) +
        w.quality*quality +
        w.momentum*momentum +
        w.risk*risk +
        w.liquidity*liq
      );

      if(modeMMM && it.halalCompliant === false) score -= w.halalPenalty;
      return { id: it.id || 'item', yScore: Math.round(clamp(score, 0, 100)), features:{value,quality,momentum,risk,liq} };
    }).sort((a,b)=> b.yScore - a.yScore);

    return new Response(JSON.stringify({ ok:true, count:results.length, results }), {status:200, headers});
  }catch(e){
    return new Response(JSON.stringify({ ok:false, error:e.message || 'YS error' }), {status:500, headers});
  }
}
