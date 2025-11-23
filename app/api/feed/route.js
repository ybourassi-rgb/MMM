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
 * - prend la meilleure image possible dans un item RSS
 * - puis tente d'améliorer l'URL si c'est un thumbnail connu
 */
function pickImage(it) {
  // 1) media:content url
  const mc = it.mediaContent;
  let url =
    mc?.$?.url ||
    (Array.isArray(mc) && mc[0]?.$?.url) ||
    null;

  // 2) enclosure url
  if (!url && it.enclosure?.url) url = it.enclosure.url;

  // 3) dans HTML -> <img src="...">
  if (!url) {
    const html = it.contentEncoded || it.content || "";
    // srcset (souvent plusieurs tailles)
    const srcsetMatch = html.match(/srcset=["']([^"']+)["']/i);
    if (srcsetMatch?.[1]) {
      // on prend la dernière URL du srcset (= la plus grande en général)
      const last = srcsetMatch[1].split(",").pop()?.trim();
      const lastUrl = last?.split(" ")?.[0];
      if (lastUrl) url = lastUrl;
    }

    if (!url) {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch?.[1]) url = imgMatch[1];
    }
  }

  if (!url) return null;

  // Normalise URL (//domain => https://domain)
  if (url.startsWith("//")) url = "https:" + url;

  // ✅ Amélioration "HD" pour thumbnails courants
  url = upgradeThumbUrl(url);

  return url;
}

/**
 * Essaie de transformer une miniature en image plus grande
 * selon les patterns connus.
 */
function upgradeThumbUrl(url) {
  let u = url;

  // Dealabs / HotUKDeals / Pepper etc.
  // Exemple mini : .../thread/thumbnail/xxxx/12345_1.jpg?width=200
  // => on enlève width/height trop petits
  u = u.replace(/([?&])(width|w|height|h)=\d+/gi, "$1");
  u = u.replace(/[?&]$/g, "");

  // Si on voit "thumbnail" dans le path -> tente "large"
  u = u.replace(/\/thumbnail\//i, "/large/");

  // Certains CDN utilisent /small/ /thumb/
  u = u.replace(/\/small\//i, "/large/");
  u = u.replace(/\/thumb\//i, "/large/");

  return u;
}

function normalizeItem(raw, i = 0) {
  const url = raw.link || raw.url || raw.guid || "";

  return {
    id: raw.id || raw.guid || `${Date.now()}-${i}`,
    title: raw.title?.trim() || "Opportunité",
    url,                       // ✅ champ utilisé par l'UI
    image: pickImage(raw),     // ✅ image HD si dispo
    price: raw.price || null,
    score: raw.yscore?.globalScore ?? raw.score ?? null,
    category: raw.category || raw.type || "autre",
    margin: raw.yscore ? `${raw.yscore.opportunityScore ?? "—"}%` : raw.margin,
    risk: raw.yscore ? `${raw.yscore.riskScore ?? "—"}/100` : raw.risk,
    horizon: raw.horizon || "court terme",
    halal: raw.yscore ? raw.yscore.halalScore >= 80 : raw.halal ?? null,
    affiliateUrl: raw.affiliateUrl || null,
    source: raw.source || "rss",
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

export async function GET() {
  try {
    const SOURCES = [
      "https://www.dealabs.com/rss/hot",
      // ajoute tes autres flux ici
    ];

    const feeds = await Promise.all(
      SOURCES.map((u) => parser.parseURL(u))
    );

    const items = feeds
      .flatMap((f) => f.items || [])
      .map(normalizeItem)
      .filter((it) => it.url);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
