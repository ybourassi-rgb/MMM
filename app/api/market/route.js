export const runtime = "edge";

/**
 * GET /api/market
 * -> agrège SOURCES via /api/rss_fetch
 */

function headers() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  };
}

const SOURCES = [
  "https://fr.cointelegraph.com/rss",
  "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",
  "https://www.ebay.fr/sch/i.html?_nkw=BMW+320d&_sop=10&_rss=1",
];

// ---- helpers ----
function guessType(urlOrSource = "") {
  const u = urlOrSource.toLowerCase();
  if (/(ebay|voiture|auto|car|bmw|mercedes|audi|renault|peugeot)/.test(u)) return "auto";
  if (/(immo|immobilier|realestate|maison|appartement)/.test(u)) return "immo";
  if (/(crypto|coin|btc|eth|blockchain|coindesk|cointelegraph)/.test(u)) return "crypto";
  return "gen";
}

function extractPriceFromTitle(title) {
  if (!title) return null;
  const m = title.replace(/\u00A0/g, " ").match(/(\d[\d\s.,’']+)\s?(€|eur|mad|dhs|usd)?/i);
  if (!m) return null;

  const n = m[1]
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");

  const val = parseFloat(n);
  return Number.isFinite(val) ? Math.round(val) : null;
}

function uniqById(items) {
  const seen = new Set();
  return items.filter((x) => {
    const id = x?.id || x?.url || x?.title;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function fetchWithTimeout(url, options = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ---- route ----
export async function GET(req) {
  const nowISO = new Date().toISOString();
  let feed = [];

  try {
    // Origin auto (prod + preview)
    const host = req.headers.get("host") || process.env.VERCEL_URL;
    const origin = host?.startsWith("http") ? host : `https://${host}`;

    const r = await fetchWithTimeout(`${origin}/api/rss_fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: SOURCES }),
      cache: "no-store",
    });

    if (!r.ok) throw new Error(`rss_fetch HTTP ${r.status}`);

    const data = await r.json();
    const items = Array.isArray(data.items) ? data.items : [];

    feed = items.map((x) => ({
      id: x.id || x.url || x.title,
      type: guessType(x.url || x.source),
      title: x.title || "",
      price: extractPriceFromTitle(x.title),
      url: x.url || "",
      updatedAtISO: x.updatedAtISO || nowISO,
      source: x.source || "",
      // petit bonus pour la future UI TikTok-like
      scoreHint: x.scoreHint || null,
    }));

    feed = uniqById(feed).slice(0, 60); // limite propre pour mobile
  } catch (e) {
    feed = [];
  }

  // Fallback si aucun flux ne répond
  if (feed.length === 0) {
    feed = [
      {
        id: "demo-1",
        type: "auto",
        title: "BMW 320d 2019 • 92 000 km — 17 900€",
        price: 17900,
        url: "https://www.ebay.fr",
        updatedAtISO: nowISO,
        source: "demo",
      },
      {
        id: "demo-2",
        type: "crypto",
        title: "Bitcoin — signal momentum positif",
        price: null,
        url: "https://www.coindesk.com",
        updatedAtISO: nowISO,
        source: "demo",
      },
    ];
  }

  return new Response(JSON.stringify({ ok: true, feed }), {
    status: 200,
    headers: headers(),
  });
}
