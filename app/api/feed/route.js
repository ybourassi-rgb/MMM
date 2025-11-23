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

// ✅ Dealabs met souvent des miniatures :
// https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/re/150x150/qt/55/ID_1.jpg
// → on veut l’original :
// https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/ID_1.jpg
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
  // 1) media:content url
  const mc = it.mediaContent;
  if (mc?.$?.url) return upgradeDealabsImage(mc.$.url);
  if (Array.isArray(mc) && mc[0]?.$?.url)
    return upgradeDealabsImage(mc[0].$?.url);

  // 2) enclosure url
  if (it.enclosure?.url) return upgradeDealabsImage(it.enclosure.url);

  // 3) parfois dans content HTML => cherche un <img src="...">
  const html = it.contentEncoded || it.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return upgradeDealabsImage(match[1]);

  return null;
}

function normalizeItem(raw, i = 0) {
  const url = raw.link || raw.url || raw.guid || "";

  return {
    id: raw.id || raw.guid || `${Date.now()}-${i}`,
    title: raw.title?.trim() || "Opportunité",
    url,
    link: raw.link || null,
    image: pickImage(raw),

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
    source: raw.source || "rss",
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

export async function GET() {
  try {
    const SOURCES = [
      // ===== FR Pepper Network =====
      "https://www.dealabs.com/rss/hot",
      "https://www.dealabs.com/rss/new",
      "https://www.dealabs.com/rss/discussed",
      "https://www.dealabs.com/rss/commented",

      // ===== International Pepper Network =====
      "https://www.hotukdeals.com/rss/hot",
      "https://www.hotukdeals.com/rss/new",

      "https://www.mydealz.de/rss/hot",
      "https://www.mydealz.de/rss/new",

      "https://www.chollometro.com/rss/hot",
      "https://www.chollometro.com/rss/new",

      "https://www.pepper.com/rss/hot",
      "https://www.pepper.com/rss/new",

      // ===== Autres sites FR bons plans =====
      "https://www.radins.com/rss.xml",
      "https://www.ma-reduc.com/rss.xml",
      "https://www.echantillonsgratuits.fr/feed/",
      "https://www.bonsplans.fr/rss.xml",

      // ===== Tech / Gaming deals =====
      "https://www.jeuxvideo.com/rss/les-bons-plans.xml",
      "https://www.numerama.com/rss/bons-plans/",
      "https://www.frandroid.com/rss/bons-plans",

      // =========================================
      // ✅✅ VOYAGE / BONS PLANS TRAVEL
      // =========================================
      "https://www.dealabs.com/groupe/voyage/rss",
      "https://www.dealabs.com/groupe/volsavion/rss",
      "https://www.dealabs.com/groupe/hotel/rss",

      "https://www.voyagepirates.fr/rss",
      "https://www.fly4free.com/feed/",
      "https://www.secretflying.com/feed/",
      "https://travel-dealz.eu/feed/",
      "https://www.theflightdeal.com/feed/",
      "https://www.holidaypirates.com/rss",
    ];

    // ✅ allSettled : si un flux bug => ça casse pas tout
    const results = await Promise.allSettled(
      SOURCES.map((u) => parser.parseURL(u))
    );

    const feedsOk = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const items = feedsOk
      .flatMap((f) => f.items || [])
      .map(normalizeItem)
      .filter((it) => it.url);

    return NextResponse.json({
      ok: true,
      items,
      cursor: null,
      sourcesOk: feedsOk.length,
      sourcesTotal: SOURCES.length,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
