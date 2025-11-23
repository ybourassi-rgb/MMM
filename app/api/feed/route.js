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

/**
 * ✅ Dealabs met souvent des miniatures :
 * https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/re/150x150/qt/55/ID_1.jpg
 * → on veut l’original :
 * https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/ID_1.jpg
 */
function upgradeDealabsImage(url) {
  if (!url) return url;
  try {
    const u = new URL(url);

    if (u.hostname.includes("static-pepper.dealabs.com")) {
      u.pathname = u.pathname.replace(/\/re\/\d+x\d+\/qt\/\d+\//i, "/");
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

function normalizeItem(raw, i = 0, sourceUrl = "") {
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
    source: raw.source || new URL(sourceUrl).hostname || "rss",
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

export async function GET() {
  try {
    // ✅ PLEIN DE SOURCES (tu peux en enlever/ajouter)
    const SOURCES = [
      // 🇫🇷 DEALABS
      "https://www.dealabs.com/rss/hot",
      "https://www.dealabs.com/rss/nouveaux",
      "https://www.dealabs.com/rss/codes-promo",

      // 🌍 PEPPER NETWORK (mêmes flux “hot”)
      "https://www.hotukdeals.com/rss/hot",       // 🇬🇧 UK
      "https://www.mydealz.de/rss/hot",          // 🇩🇪 DE
      "https://www.chollometro.com/rss/hot",     // 🇪🇸 ES
      "https://www.pepper.pl/rss/hot",           // 🇵🇱 PL
      "https://www.preisjaeger.at/rss/hot",      // 🇦🇹 AT
      "https://nl.pepper.com/rss/hot",           // 🇳🇱 NL
      "https://www.promodescuentos.com/rss/hot", // 🇲🇽 MX
      "https://www.ozbargain.com.au/rss/hot",    // 🇦🇺 AU (communauté deals)

      // 🇺🇸 / 🇨🇦 GROS SITES DEALS
      "https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1",
      "https://www.redflagdeals.com/rss/hot/",
    ];

    // ✅ on ne casse pas tout si un flux plante
    const settled = await Promise.allSettled(
      SOURCES.map((u) => parser.parseURL(u))
    );

    const feedsOk = settled
      .map((res, idx) => {
        if (res.status === "fulfilled") {
          return { feed: res.value, sourceUrl: SOURCES[idx] };
        }
        console.warn("RSS failed:", SOURCES[idx], res.reason?.message);
        return null;
      })
      .filter(Boolean);

    // 🔥 items normalisés
    let items = feedsOk.flatMap(({ feed, sourceUrl }) =>
      (feed.items || []).map((raw, i) => normalizeItem(raw, i, sourceUrl))
    );

    // ✅ garde seulement ceux avec lien
    items = items.filter((it) => it.url);

    // ✅ déduplication par url (évite doublons entre pays)
    const seen = new Set();
    items = items.filter((it) => {
      if (seen.has(it.url)) return false;
      seen.add(it.url);
      return true;
    });

    // ✅ trie par date desc si possible
    items.sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return db - da;
    });

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
