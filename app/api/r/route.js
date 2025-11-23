// app/api/r/route.js
import { NextResponse } from "next/server";

export const runtime = "edge";

// No-cache partout
function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
  };
}

// ✅ Domains autorisés (affiliation / redirection)
// Ajoute/enlève ce que tu veux.
const ALLOW = [
  // e-commerce / auto
  "ebay.fr", "www.ebay.fr",
  "ebay.com", "www.ebay.com",
  "amazon.fr", "www.amazon.fr",
  "amzn.to",

  // travel
  "booking.com", "www.booking.com",
  "airbnb.fr", "www.airbnb.fr",

  // crypto news
  "coindesk.com", "www.coindesk.com",
  "cointelegraph.com", "www.cointelegraph.com",
  "fr.cointelegraph.com",

  // presse éco/finance FR
  "lesechos.fr", "www.lesechos.fr",
  "zonebourse.com", "www.zonebourse.com",
  "boursorama.com", "www.boursorama.com",

  // finance/business EN
  "reuters.com", "www.reuters.com",
  "cnbc.com", "www.cnbc.com",

  // tech / startups
  "techcrunch.com", "www.techcrunch.com",
  "theverge.com", "www.theverge.com",
];

function isAllowed(rawUrl) {
  try {
    const h = new URL(rawUrl).hostname.toLowerCase();
    return ALLOW.some((d) => h === d || h.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

// incr Upstash REST (non bloquant)
async function incrClick(key) {
  const restUrl =
    process.env.UPSTASH_REST_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";

  if (!restUrl || !restToken) return;

  // Edge-safe, sans await pour ne jamais bloquer
  fetch(`${restUrl}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${restToken}` },
    cache: "no-store",
  }).catch(() => {});
}

export async function GET(req) {
  const urlObj = new URL(req.url);

  // u = URL brute à rediriger
  const u = urlObj.searchParams.get("u");
  // s = catégorie (auto / immo / crypto / gen ...)
  const s = (urlObj.searchParams.get("s") || "gen").toLowerCase();

  if (!u) {
    return NextResponse.json(
      { ok: false, error: "Missing u" },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  if (!isAllowed(u)) {
    return NextResponse.json(
      { ok: false, error: "Domain not allowed" },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  const target = new URL(u);

  // Ajoute un subid si absent (tracking MMM)
  if (!target.searchParams.has("subid")) {
    target.searchParams.set("subid", `mmm-${s}-${Date.now()}`);
  }

  // Bonus: garde tes UTM si tu veux les exploiter un jour
  if (!target.searchParams.has("utm_source")) {
    target.searchParams.set("utm_source", "mmm");
  }
  if (!target.searchParams.has("utm_medium")) {
    target.searchParams.set("utm_medium", "redirect");
  }
  if (!target.searchParams.has("utm_campaign")) {
    target.searchParams.set("utm_campaign", s);
  }

  // Comptage Upstash (non bloquant)
  incrClick(`click:${s}:${target.hostname}`);

  // Redirection 302
  const res = NextResponse.redirect(target.toString(), 302);
  Object.entries(noStoreHeaders()).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
