export const runtime = "edge";
export const dynamic = "force-dynamic";

function headers() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// 👉 Ajoute/retire tes flux ici
const SOURCES = [
  "https://fr.cointelegraph.com/rss",
  "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",

  "https://www.zonebourse.com/rss/actualite/",
  "https://investir.lesechos.fr/rss/flux.xml",
  "https://www.boursorama.com/rss/flux-actualites-economie.xml",

  "https://www.reuters.com/finance/rss",
  "https://www.reuters.com/business/finance/rss",
  "https://www.cnbc.com/id/100003114/device/rss/rss.html",

  "https://techcrunch.com/feed/",
  "https://www.theverge.com/rss/index.xml",

  "https://www.ebay.fr/sch/i.html?_nkw=voiture&_sop=10&_rss=1",
];

function guessType(urlOrSource = "") {
  const u = urlOrSource.toLowerCase();
  if (u.includes("ebay") || u.includes("auto") || u.includes("voiture") || u.includes("car")) return "auto";
  if (u.includes("immo") || u.includes("immobilier") || u.includes("realestate")) return "immo";
  if (u.includes("crypto") || u.includes("coin") || u.includes("btc") || u.includes("coindesk") || u.includes("cointelegraph")) return "crypto";
  if (u.includes("bourse") || u.includes("finance") || u.includes("boursorama") || u.includes("investir") || u.includes("reuters")) return "finance";
  if (u.includes("tech") || u.includes("crunch") || u.includes("verge")) return "tech";
  return "gen";
}

function extractPriceFromTitle(title = "") {
  const m = title
    .replace(/\u00A0/g, " ")
    .match(/(\d[\d\s.,’']+)\s?(€|eur|mad|dhs|usd)?/i);
  if (!m) return null;

  const n = m[1]
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");

  const val = parseFloat(n);
  return Number.isFinite(val) ? Math.round(val) : null;
}

async function buildStatus(req) {
  const hasOpenAIKey =
    !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10);

  const restUrl =
    process.env.UPSTASH_REST_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";
  const hasUpstashKV = !!(restUrl && restToken);

  const now = new Date();
  const serverNowISO = now.toISOString();
  const todayFr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let feed = [];

  try {
    const origin = new URL(req.url).origin;

    const resp = await fetch(`${origin}/api/rss_fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: SOURCES }),
      cache: "no-store",
    });

    if (resp.ok) {
      const data = await resp.json();
      const items = Array.isArray(data.items) ? data.items : [];

      feed = items.map((x) => ({
        id: x.id || x.url || String(Math.random()).slice(2),
        type: guessType(x.url || x.source),
        title: x.title || "—",
        price: extractPriceFromTitle(x.title || ""),
        url: x.url || "",
        updatedAtISO: x.updatedAtISO || serverNowISO,
        source: x.source || "",
        image: x.image || null, // 🔥 utile pour ton scroll TikTok
        summary: x.summary || null,
      }));
    }
  } catch {
    feed = [];
  }

  if (feed.length === 0) {
    feed = [
      {
        id: "demo-1",
        type: "auto",
        title: "BMW 320d 2019 • 92 000 km — 17 900€",
        price: 17900,
        url: "https://www.ebay.fr",
        updatedAtISO: serverNowISO,
        source: "demo",
        image: null,
        summary: null,
      },
      {
        id: "demo-2",
        type: "crypto",
        title: "Bitcoin — signal momentum positif",
        price: null,
        url: "https://www.coindesk.com",
        updatedAtISO: serverNowISO,
        source: "demo",
        image: null,
        summary: null,
      },
    ];
  }

  return {
    ok: true,
    status: "online",
    hasOpenAIKey,
    hasUpstashKV,
    env: process.env.VERCEL_ENV || "unknown",
    ts: Date.now(),
    serverNowISO,
    todayFr,
    feed,
  };
}

// ---- App Router exports ----
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: headers() });
}

export async function GET(req) {
  const body = await buildStatus(req);
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: headers(),
  });
}
