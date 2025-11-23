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

const ALLOW = [
  "ebay.fr", "www.ebay.fr",
  "amazon.fr", "www.amazon.fr", "amzn.to",

  "booking.com", "www.booking.com",
  "airbnb.fr", "www.airbnb.fr",

  "coindesk.com", "www.coindesk.com",
  "cointelegraph.com", "www.cointelegraph.com",

  "lesechos.fr", "www.lesechos.fr",
  "zonebourse.com", "www.zonebourse.com",
  "boursorama.com", "www.boursorama.com",

  "reuters.com", "www.reuters.com",
  "cnbc.com", "www.cnbc.com",

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
  if (!restUrl || !restToken) return;

  try {
    await fetch(`${restUrl}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${restToken}` },
      cache: "no-store"
    });
  } catch {}
}

export default async function handler(req) {
  const urlObj = new URL(req.url);
  const u = urlObj.searchParams.get("u");
  const s = urlObj.searchParams.get("s") || "gen";

  if (!u)
    return new Response("Missing u", { status: 400, headers: noStore() });
  if (!isAllowed(u))
    return new Response("Domain not allowed", { status: 400, headers: noStore() });

  const target = new URL(u);

  if (!target.searchParams.has("subid")) {
    target.searchParams.set("subid", `mmm-${s}-${Date.now()}`);
  }

  incrClick(`click:${s}:${target.hostname}`);

  return Response.redirect(target.toString(), 302);
}
