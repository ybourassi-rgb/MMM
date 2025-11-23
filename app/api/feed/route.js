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
 * Dealabs thumbnails -> full image
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
    source: raw.source || (sourceUrl ? new URL(sourceUrl).hostname : "rss"),
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

export async function GET() {
  try {
    const SOURCES = [
      // =========================
      // 🇫🇷 DEALABS (FR)
      // =========================
      "https://www.dealabs.com/rss/hot",
      "https://www.dealabs.com/rss/nouveaux",
      "https://www.dealabs.com/rss/codes-promo",

      // Dealabs catégories populaires
      "https://www.dealabs.com/groupe/high-tech.rss",
      "https://www.dealabs.com/groupe/informatique.rss",
      "https://www.dealabs.com/groupe/telephonie.rss",
      "https://www.dealabs.com/groupe/gaming.rss",
      "https://www.dealabs.com/groupe/maison-jardin.rss",
      "https://www.dealabs.com/groupe/auto-moto.rss",
      "https://www.dealabs.com/groupe/supermarches.rss",

      // =========================
      // 🌍 PEPPER NETWORK
      // =========================
      "https://www.hotukdeals.com/rss/hot",
      "https://www.mydealz.de/rss/hot",
      "https://www.chollometro.com/rss/hot",
      "https://www.pepper.pl/rss/hot",
      "https://www.preisjaeger.at/rss/hot",
      "https://nl.pepper.com/rss/hot",
      "https://www.promodescuentos.com/rss/hot",
      "https://www.ozbargain.com.au/rss/hot",

      // =========================
      // 🇺🇸 / 🇨🇦 SITES DEALS
      // =========================
      "https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1",
      "https://www.redflagdeals.com/rss/hot/",

      // =========================
      // 🚗 AUTO / MOBILITÉ
      // =========================
      // Bons plans auto FR (Dealabs suffit déjà, mais on ajoute du global)
      "https://www.carscoops.com/feed/",
      "https://www.autoblog.com/rss.xml",

      // =========================
      // 🏠 MAISON / IMMO / BRICOLAGE
      // =========================
      "https://www.maisonapart.com/rss/actualites.xml",
      "https://www.systemed.fr/rss.xml",

      // =========================
      // 📱 TECH / GAMING / ECOM
      // =========================
      "https://www.frandroid.com/feed",
      "https://www.dealabs.com/groupe/amazon.rss",
      "https://www.dealabs.com/groupe/aliexpress.rss",

      // =========================
      // 💸 CRYPTO / FINANCE / MARCHÉS
      // =========================
      "https://cointelegraph.com/rss",
      "https://www.coindesk.com/arc/outboundfeeds/rss/",
      "https://www.boursorama.com/rss/actualites/",
      "https://feeds.finance.yahoo.com/rss/2.0/headline?s=BTC-USD,ETH-USD,TSLA,NVDA&region=US&lang=en-US",
    ];

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

    let items = feedsOk.flatMap(({ feed, sourceUrl }) =>
      (feed.items || []).map((raw, i) => normalizeItem(raw, i, sourceUrl))
    );

    items = items.filter((it) => it.url);

    // dédup par url
    const seen = new Set();
    items = items.filter((it) => {
      if (seen.has(it.url)) return false;
      seen.add(it.url);
      return true;
    });

    // tri date desc
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
