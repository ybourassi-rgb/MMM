// app/api/r/route.js
import { NextResponse } from "next/server";

export const runtime = "edge"; // ✅ Edge runtime

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
  };
}

// ✅ Domains autorisés
const ALLOW = [
  // e-commerce / auto
  "ebay.fr", "www.ebay.fr",
  "amazon.fr", "www.amazon.fr", "amzn.to",

  // travel
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
  "theverge.com", "www.theverge.com",
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
    process.env.UPSTASH_REST_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";

  if (!restUrl || !restToken) return;

  // non bloquant
  fetch(`${restUrl}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${restToken}` },
    cache: "no-store",
  }).catch(() => {});
}

export async function GET(req) {
  const urlObj = new URL(req.url);
  const u = urlObj.searchParams.get("u");          // URL cible
  const s = urlObj.searchParams.get("s") || "gen"; // catégorie

  if (!u) {
    return NextResponse.json(
      { ok: false, error: "Missing u" },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  if (!isAllowed(u)) {
    return NextResponse.json(
      { ok: false, error: "Domain not allowed", domain: u },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  const target = new URL(u);

  // ✅ Ajout subid auto si absent
  if (!target.searchParams.has("subid")) {
    target.searchParams.set("subid", `mmm-${s}-${Date.now()}`);
  }

  // ✅ Comptage Upstash (facultatif)
  incrClick(`click:${s}:${target.hostname}`);

  // ✅ Redirection
  return NextResponse.redirect(target.toString(), {
    status: 302,
    headers: noStoreHeaders(),
  });
}
