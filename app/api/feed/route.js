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

// -----------------------------
// Helpers
// -----------------------------

// Dealabs met souvent des miniatures :
// https://static-pepper.dealabs.com/.../re/150x150/qt/55/xxx.jpg
// → on veut l’original :
// https://static-pepper.dealabs.com/.../xxx.jpg
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

// extraire une image d’un item RSS
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

// timeout anti-freeze par feed
async function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

function normalizeItem(raw, i = 0, sourceUrl = "") {
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
    category: raw.category || raw.type || "autre",

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
    source: sourceUrl || raw.source || "rss",
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

// Détecter “voyage”
function isTravelItem(it) {
  const t = (it.title || "").toLowerCase();
  const u = (it.url || "").toLowerCase();
  const c = (it.category || "").toLowerCase();
  const s = (it.source || "").toLowerCase();

  return (
    t.includes("vol") ||
    t.includes("voyage") ||
    t.includes("hôtel") ||
    t.includes("hotel") ||
    t.includes("airbnb") ||
    t.includes("train") ||
    t.includes("ryanair") ||
    t.includes("easyjet") ||
    t.includes("booking") ||
    u.includes("voyage") ||
    u.includes("travel") ||
    c.includes("voyage") ||
    c.includes("travel") ||
    s.includes("voyage") ||
    s.includes("travel")
  );
}

// alternance 1 voyage / 2 autres
function mixTravelAndOthers(travel, others) {
  const out = [];
  let i = 0, j = 0;

  while (i < travel.length || j < others.length) {
    if (i < travel.length) out.push(travel[i++]);
    if (j < others.length) out.push(others[j++]);
    if (j < others.length) out.push(others[j++]);
  }
  return out;
}

// shuffle léger pour éviter les blocs
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

// -----------------------------
// GET
// -----------------------------
export async function GET() {
  try {
    // ✅ maxi sources “grand public”
    const SOURCES = [
      // Deals FR
      "https://www.dealabs.com/rss/hot",
      "https://www.dealabs.com/rss/new",
      "https://www.dealabs.com/groupe/high-tech/rss",
      "https://www.dealabs.com/groupe/maison-jardin/rss",
      "https://www.dealabs.com/groupe/auto-moto/rss",
      "https://www.dealabs.com/groupe/mode-beaute/rss",
      "https://www.dealabs.com/groupe/jeux-video/rss",

      // Voyages / transports
      "https://www.dealabs.com/groupe/voyage/rss",
      "https://www.voyagespirates.fr/feed/",
      "https://www.travelpirates.com/feed/",
      "https://www.fly4free.com/feed/",
      "https://www.secretflying.com/feed/",
    ];

    // parse chaque feed sans bloquer tout le monde
    const settled = await Promise.allSettled(
      SOURCES.map((u) =>
        withTimeout(parser.parseURL(u), 9000)
          .then((feed) => ({ feed, sourceUrl: u }))
      )
    );

    const feedsOk = settled
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    let items = feedsOk
      .flatMap(({ feed, sourceUrl }) =>
        (feed.items || []).map((raw, i) => normalizeItem(raw, i, sourceUrl))
      )
      .filter((it) => it.url);

    // ✅ enlève tous les deals sans image / placeholder
    items = items.filter((it) => {
      if (!it.image) return false;
      const img = it.image.toLowerCase();
      if (img.includes("default-voucher")) return false;
      if (img.endsWith(".svg")) return false;
      return true;
    });

    // split voyages vs autres puis alternance
    const travel = [];
    const others = [];
    for (const it of items) {
      (isTravelItem(it) ? travel : others).push(it);
    }

    const mixed = mixTravelAndOthers(
      shuffle(travel),
      shuffle(others)
    );

    // limite (évite feed trop lourd)
    const MAX_ITEMS = 220;
    const finalItems = mixed.slice(0, MAX_ITEMS);

    return NextResponse.json({
      ok: true,
      items: finalItems,
      cursor: null,
      stats: {
        total: items.length,
        travel: travel.length,
        others: others.length,
        sourcesOk: feedsOk.length,
        sourcesTotal: SOURCES.length,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
