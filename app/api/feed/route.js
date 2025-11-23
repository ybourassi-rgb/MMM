// app/api/feed/route.js
import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

// ===============================
// 1) Helpers images Dealabs
// ===============================

// Dealabs met souvent des miniatures :
// https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/re/150x150/qt/55/ID_1.jpg
// -> on veut l'original (sans /re/150x150/qt/55/)
function upgradeDealabsImage(url) {
  if (!url) return url;

  try {
    const u = new URL(url);

    if (u.hostname.includes("static-pepper.dealabs.com")) {
      u.pathname = u.pathname.replace(
        /\/re\/\d+x\d+\/qt\/\d+\//i,
        "/"
      );
      return u.toString();
    }

    return url;
  } catch {
    return url;
  }
}

// petite util pour extraire une image d’un item RSS
function pickImage(it) {
  const mc = it.mediaContent;
  if (mc?.$?.url) return upgradeDealabsImage(mc.$.url);
  if (Array.isArray(mc) && mc[0]?.$?.url)
    return upgradeDealabsImage(mc[0].$?.url);

  if (it.enclosure?.url) return upgradeDealabsImage(it.enclosure.url);

  const html = it.contentEncoded || it.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return upgradeDealabsImage(match[1]);

  return null;
}

// Dealabs a parfois des “images par défaut” qu’on veut jeter
function isValidImage(url) {
  if (!url) return false;
  const lower = url.toLowerCase();

  // exemples qu’on vire:
  if (lower.includes("default-voucher")) return false;
  if (lower.includes("default-avatar")) return false;
  if (lower.endsWith(".svg")) return false; // souvent placeholders

  return true;
}

// ===============================
// 2) Normalisation
// ===============================
function normalizeItem(raw, i = 0, sourceName = "rss") {
  const url = raw.link || raw.url || raw.guid || "";

  const image = pickImage(raw);

  return {
    id: raw.id || raw.guid || `${Date.now()}-${i}`,
    title: raw.title?.trim() || "Opportunité",
    url,
    link: raw.link || null,
    image,

    price: raw.price || null,
    score: raw.yscore?.globalScore ?? raw.score ?? null,
    category: raw.category || raw.type || sourceName || "autre",

    margin: raw.yscore
      ? `${raw.yscore.opportunityScore ?? "—"}%`
      : raw.margin,
    risk: raw.yscore
      ? `${raw.yscore.riskScore ?? "—"}/100`
      : raw.risk,

    horizon: raw.horizon || "court terme",

    halal: raw.yscore
      ? raw.yscore.halalScore >= 80
      : raw.halal ?? null,

    affiliateUrl: raw.affiliateUrl || null,
    source: sourceName,
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

// ===============================
// 3) Fetch RSS robuste (évite blocage)
// ===============================
async function fetchTextWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);

  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        // Certains flux bloquent sans user-agent
        "user-agent": "MoneyMotorYBot/1.0 (+https://mmm-alpha-one.vercel.app)",
        accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function parseFeedSafe(url, sourceName) {
  try {
    const xml = await fetchTextWithTimeout(url);
    const feed = await parser.parseString(xml);
    feed._sourceName = sourceName;
    return feed;
  } catch (e) {
    console.error("Feed fail:", url, e?.message);
    return { items: [], _sourceName: sourceName };
  }
}

// ===============================
// 4) Shuffle pour mélanger voyages / autres
// ===============================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===============================
// 5) GET
// ===============================
export async function GET() {
  try {
    // 🔥 Plus de sources (style marketplace)
    // Dealabs fournit beaucoup de catégories RSS.
    // Liste par catégorie: /rss/groupe/xxx (dont Voyages).  [oai_citation:1‡Gist](https://gist.github.com/Snipees/608a97bc81c4003991876f7d7e6dc77b?utm_source=chatgpt.com)
    const SOURCES = [
      // général / hot
      { name: "hot", url: "https://www.dealabs.com/rss/hot" },
      { name: "bons-plans", url: "https://www.dealabs.com/rss/bons-plans" },
      { name: "codes-promo", url: "https://www.dealabs.com/rss/codes-promo" },

      // marketplace-like (objets / maison / tech / mode etc.)
      { name: "maison-jardin", url: "https://www.dealabs.com/rss/groupe/maison-jardin" },
      { name: "informatique", url: "https://www.dealabs.com/rss/groupe/informatique" },
      { name: "telephonie", url: "https://www.dealabs.com/rss/groupe/telephonie" },
      { name: "image-son", url: "https://www.dealabs.com/rss/groupe/image-son-video" },
      { name: "jeux", url: "https://www.dealabs.com/rss/groupe/consoles-jeux-video" },
      { name: "sports", url: "https://www.dealabs.com/rss/groupe/sports-plein-air" },
      { name: "mode", url: "https://www.dealabs.com/rss/groupe/mode-accessoires" },
      { name: "animaux", url: "https://www.dealabs.com/rss/groupe/animaux" },
      { name: "services", url: "https://www.dealabs.com/rss/groupe/services-divers" },

      // ✈️ VOYAGES / SORTIES / RESTAURANTS
      { name: "voyages", url: "https://www.dealabs.com/rss/groupe/voyages-sorties-restaurants" },
    ];

    // parse tous les feeds sans bloquer
    const feeds = await Promise.all(
      SOURCES.map((s) => parseFeedSafe(s.url, s.name))
    );

    let items = feeds
      .flatMap((f) =>
        (f.items || []).map((raw, i) =>
          normalizeItem(raw, i, f._sourceName)
        )
      )
      .filter((it) => it.url)
      // ✅ 100% sans image => on vire direct
      .filter((it) => isValidImage(it.image));

    // ✅ Mélange pour avoir voyages + autres alternés
    items = shuffle(items);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
