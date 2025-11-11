// /api/r.js
export const config = { runtime: "edge" };

function noStore() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store"
  };
}

// ✅ Domains autorisés (affiliation / redirection)
// (Tu peux en ajouter/retirer à tout moment)
const ALLOW = [
  // e-commerce / auto
  "ebay.fr", "www.ebay.fr",
  "amazon.fr", "www.amazon.fr", "amzn.to",

  // travel (si tu les utilises)
  "booking.com", "www.booking.com",
  "airbnb.fr", "www.airbnb.fr",

  // crypto news
  "coindesk.com", "www.coindesk.com",
  "cointelegraph.com", "www.cointelegraph.com",

  // presse éco/finance FR
  "lesechos.fr", "www.lesechos.fr",
  "zonebourse.com", "www.zonebourse.com",
  "boursorama.com", "www.boursorama.com",

  // finance/business EN
  "reuters.com", "www.reuters.com",
  "cnbc.com", "www.cnbc.com",

  // tech / startups
  "techcrunch.com", "www.techcrunch.com",
  "theverge.com", "www.theverge.com"
];

function isAllowed(u) {
  try {
    const h = new URL(u).hostname.toLowerCase();
    return ALLOW.some(d => h === d || h.endsWith(`.${d}`));
  } catch { 
    return false; 
  }
}

async function incrClick(key) {
  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!restUrl || !restToken) return; // facultatif

  fetch(`${restUrl}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${restToken}` },
    cache: "no-store"
  }).catch(()=>{});
}

export default async function handler(req) {
  const urlObj = new URL(req.url);
  const u = urlObj.searchParams.get("u");              // URL brute
  const s = urlObj.searchParams.get("s") || "gen";     // catégorie (auto/immo/crypto…)

  if (!u) 
    return new Response("Missing u", { status: 400, headers: noStore() });
  if (!isAllowed(u)) 
    return new Response("Domain not allowed", { status: 400, headers: noStore() });

  const target = new URL(u);

  // Ajoute automatiquement un identifiant de tracking
  if (!target.searchParams.has("subid")) {
    target.searchParams.set("subid", `mmm-${s}-${Date.now()}`);
  }

  // Comptage côté Upstash (non bloquant)
  incrClick(`click:${s}:${target.hostname}`);

  // Redirection vers l’offre
  return Response.redirect(target.toString(), 302);
}
