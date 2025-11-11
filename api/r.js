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
  "ebay.fr","www.ebay.fr",
  "amazon.fr","www.amazon.fr","amzn.to",

  // travel (si tu les utilises)
  "booking.com","www.booking.com",
  "airbnb.fr","www.airbnb.fr",

  // crypto news
  "coindesk.com","www.coindesk.com",
  "cointelegraph.com","www.cointelegraph.com","fr.cointelegraph.com",

  // presse éco/finance FR
  "lesechos.fr","www.lesechos.fr","investir.lesechos.fr",
  "zonebourse.com","www.zonebourse.com",
  "boursorama.com","www.boursorama.com",

  // finance/business EN
  "reuters.com","www.reuters.com",
  "cnbc.com","www.cnbc.com",

  // tech / startups
  "techcrunch.com","www.techcrunch.com",
  "theverge.com","www.theverge.com"
];

// Vérifie si host correspond à la allowlist (gère sous-domaines)
function isHostAllowed(hostname) {
  const h = (hostname || "").toLowerCase();
  return ALLOW.some(d => h === d || h.endsWith(`.${d}`));
}

// Normalise l'URL (force https si pas de protocole)
function normalizeUrl(u) {
  try {
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    const url = new URL(u);
    // refuse tout sauf http/https
    if (!/^https?$/.test(url.protocol.replace(":",""))) throw new Error("bad_protocol");
    return url;
  } catch {
    return null;
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
  const raw = urlObj.searchParams.get("u");         // URL à rediriger (brute)
  const s   = urlObj.searchParams.get("s") || "gen"; // source/type (auto/immo/crypto/finance/tech…)

  if (!raw) {
    return new Response("Missing u", { status: 400, headers: noStore() });
  }

  const target = normalizeUrl(raw);
  if (!target) {
    return new Response("Bad URL", { status: 400, headers: noStore() });
  }

  if (!isHostAllowed(target.hostname)) {
    return new Response("Domain not allowed", { status: 400, headers: noStore() });
  }

  // Ajoute un subid si absent (tracking)
  if (!target.searchParams.has("subid")) {
    target.searchParams.set("subid", `mmm-${s}-${Date.now()}`);
  }

  // Comptage (non bloquant)
  incrClick(`click:${s}:${target.hostname}`);

  // Redirection 302 → annonceur / média
  return Response.redirect(target.toString(), 302);
}
