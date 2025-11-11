// /api/r.js
export const config = { runtime: "edge" };

function noStore() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
  };
}

// (optionnel) whitelist de domaines autorisés
const ALLOW = [
  "www.amazon.fr", "amzn.to",
  "www.booking.com",
  "www.airbnb.fr",
  // ajoute tes réseaux d’affiliation
];

function isAllowed(u) {
  try {
    const h = new URL(u).hostname.toLowerCase();
    return ALLOW.some(d => h === d || h.endsWith(`.${d}`));
  } catch { return false; }
}

async function incrClick(key) {
  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!restUrl || !restToken) return;

  // incr non bloquant
  fetch(`${restUrl}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${restToken}` },
    cache: "no-store",
  }).catch(()=>{});
}

export default async function handler(req) {
  const urlObj = new URL(req.url);
  const u = urlObj.searchParams.get("u");   // URL affiliée encodée
  const s = urlObj.searchParams.get("s") || "gen"; // source (auto/immo/crypto…)

  if (!u) return new Response("Missing u", { status: 400, headers: noStore() });
  if (!isAllowed(u)) return new Response("Domain not allowed", { status: 400, headers: noStore() });

  // (optionnel) ajouter/forcer notre subid
  const target = new URL(u);
  if (!target.searchParams.has("subid")) {
    target.searchParams.set("subid", `mmm-${s}-${Date.now()}`);
  }

  // comptage de clics (non bloquant)
  incrClick(`click:${s}:${target.hostname}`);

  // 302 vers l’annonceur (tracking OK)
  return Response.redirect(target.toString(), 302);
}
