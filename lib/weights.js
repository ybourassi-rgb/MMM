export const config = { runtime: "edge" };

export default async function handler(req) {
  const headers = { "Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8" };
  const url = new URL(req.url);
  const profile = url.searchParams.get('profile') || 'default';

  // Si pas de KV, on sert des défauts en GET, on refuse en POST
  if(!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN){
    if(req.method === 'GET'){
      return new Response(JSON.stringify({
        ok:true, source:'defaults',
        weights:{ value:.30, quality:.25, momentum:.20, risk:.15, liquidity:.10, halalPenalty:15 }
      }), {status:200, headers});
    } else {
      return new Response(JSON.stringify({ ok:false, error:'KV non configuré' }), {status:500, headers});
    }
  }

  const base = process.env.UPSTASH_REDIS_REST_URL.replace(/\/+$/,'');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = `ys:weights:${profile}`;

  async function kvGet(k){
    const r = await fetch(`${base}/get/${encodeURIComponent(k)}`, { headers:{ Authorization:`Bearer ${token}` }});
    const js = await r.json();
    return js?.result ? JSON.parse(js.result) : null;
  }
  async function kvSet(k, val){
    const r = await fetch(`${base}/set/${encodeURIComponent(k)}`, {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ value: JSON.stringify(val) })
    });
    return r.ok;
  }

  try{
    if(req.method === 'GET'){
      const v = await kvGet(key);
      return new Response(JSON.stringify({
        ok:true, source: v ? 'kv' : 'defaults',
        weights: v || { value:.30, quality:.25, momentum:.20, risk:.15, liquidity:.10, halalPenalty:15 }
      }), {status:200, headers});
    }
    if(req.method === 'POST'){
      const w = await req.json();
      await kvSet(key, w);
      return new Response(JSON.stringify({ ok:true }), {status:200, headers});
    }
    return new Response(JSON.stringify({ ok:false, error:'Method not allowed' }), {status:405, headers});
  }catch(e){
    return new Response(JSON.stringify({ ok:false, error:e.message || 'weights error' }), {status:500, headers});
  }
}
