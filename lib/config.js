// api/config.js
export const config = { runtime: "edge" };

const DEFAULT = {
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

const KV_URL   = process.env.UPSTASH_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REST_TOKEN;
const HEADERS  = { "Cache-Control":"no-store", "Content-Type":"application/json; charset=utf-8" };

function bad(msg, code=400){ return new Response(JSON.stringify({ ok:false, error:msg }), { status:code, headers:HEADERS }); }
function ok(data){ return new Response(JSON.stringify({ ok:true, ...data }), { status:200, headers:HEADERS }); }

function validateConfig(c){
  if(!c || typeof c !== 'object') return "Invalid body";
  const w = c.weights || {};
  const t = c.thresholds || {};
  const sum = [w.weightPrice, w.weightMarketValue, w.weightProfitability, w.weightRisk, w.weightTimeToLiquidity, w.weightStrategic]
    .map(Number).reduce((a,b)=> a + (Number.isFinite(b)?b:0), 0);

  if (Math.abs(sum - 100) > 5) return "La somme des pondérations doit être ≈ 100 (±5).";
  for (const k of Object.keys(w)){
    const v = Number(w[k]); if(!Number.isFinite(v) || v < 0 || v > 100) return `Poids invalide: ${k}`;
  }
  for (const k of ["excellent","acceptable","risky"]){
    const v = Number(t[k]); if(!Number.isFinite(v) || v < 0 || v > 100) return `Seuil invalide: ${k}`;
  }
  const d = Number(c.timeDecayFactor ?? 2); if(!Number.isFinite(d) || d < 0 || d > 10) return "timeDecayFactor doit être 0..10";
  return null;
}

async function kvGet(key){
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if(!r.ok) return null;
  const j = await r.json();
  if(!j || !("result" in j) || j.result === null) return null;
  try { return JSON.parse(j.result); } catch { return null; }
}

async function kvSet(key, val){
  const r = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type":"application/json" },
    body: JSON.stringify({ value: JSON.stringify(val) })
  });
  return r.ok;
}

export default async function handler(req){
  // GET: lit la config (KV si dispo, sinon défaut)
  if (req.method === "GET") {
    if (KV_URL && KV_TOKEN) {
      const cfg = await kvGet("MMY_CONFIG");
      return ok({ source: cfg ? "kv" : "default", config: cfg || DEFAULT });
    }
    return ok({ source: "default", config: DEFAULT });
  }

  // PUT: met à jour (nécessite KV)
  if (req.method === "PUT") {
    if (!(KV_URL && KV_TOKEN)) {
      return bad("KV non configuré (UPSTASH_REST_URL/TOKEN manquants). Ajoute-les dans Vercel → Settings → Environment Variables.", 501);
    }
    let body;
    try { body = await req.json(); } catch { return bad("JSON invalide"); }
    const err = validateConfig(body);
    if (err) return bad(err);
    const saved = await kvSet("MMY_CONFIG", body);
    if (!saved) return bad("Échec d’enregistrement KV", 500);
    return ok({ saved: true, config: body });
  }

  return bad("Method not allowed", 405);
}
