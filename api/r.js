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

// ✅ Autorise les domaines pour tes offres & articles
const ALLOW = [
  // e-commerce / auto
  "ebay.fr","www.ebay.fr",
  "amzn.to","amazon.fr","www.amazon.fr",

  // travel
  "booking.com","www.booking.com",
  "airbnb.fr","www.airbnb.fr",

  // crypto news
  "coindesk.com","www.coindesk.com",
  "cointelegraph.com","www.cointelegraph.com",

  // presse éco/finance (ajoute ceux que tu utilises)
  "lesechos.fr","www.lesechos.fr",
  "zonebourse.com","www.zonebourse.com"
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
  if (!restUrl || !restToken) return; // facultatif
  fetch(`${restUrl}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${restToken}` },
    cache: "no-store"
  }).catch(()=>{});
}

export default async function handler(req) {
  const urlObj = new URL(req.url);
  const u = urlObj.searchParams.get("u");              // URL à rediriger (brute)
  const s = urlObj.searchParams.get("s") || "gen";     // source/type (auto/immo/crypto…)

  if (!u) return new Response("Missing u", { status: 400, headers: noStore() });
  if (!isAllowed(u)) return new Response("Domain not allowed", { status: 400, headers: noStore() });

  const target = new URL(u);

  // Ajoute un subid si absent (tracking)
  if (!target.searchParams.has("subid")) {
    target.searchParams.set("subid", `mmm-${s}-${Date.now()}`);
  }

  // Comptage (non bloquant)
  incrClick(`click:${s}:${target.hostname}`);

  // Redirection 302
  return Response.redirect(target.toString(), 302);
}
