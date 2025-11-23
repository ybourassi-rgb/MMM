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
 * Dealabs renvoie souvent une miniature:
 * https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/re/150x150/qt/55/ID_1.jpg
 * On veut l’original:
 * https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/ID_1.jpg
 */
function upgradeDealabsImage(url) {
  if (!url) return null;
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

// extrait une image d’un item RSS
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

/**
 * ✅ filtre anti "fausses images"
 * - null / vide
 * - svg par défaut Dealabs
 * - images "default" / "placeholder"
 * - images trop petites dealabs (si ça arrive)
 */
function isValidImage(url) {
  if (!url) return false;

  const lower = url.toLowerCase();

  // dealabs default voucher / placeholder
  if (lower.includes("default-voucher")) return false;
  if (lower.includes("default-")) return false;
  if (lower.includes("placeholder")) return false;
  if (lower.endsWith(".svg")) return false;

  // parfois dealabs renvoie /150x150/ même après upgrade (rare)
  if (lower.includes("/re/") && lower.includes("150x150")) return false;

  return true;
}

function normalizeItem(raw, i = 0) {
  const finalUrl = raw.link || raw.url || raw.guid || "";
  const img = pickImage(raw);

  return {
    id: raw.id || raw.guid || `${Date.now()}-${i}`,
    title: raw.title?.trim() || "Opportunité",
    url: finalUrl,
    link: raw.link || null,
    image: img,

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
      "https://www.dealabs.com/rss/hot",

      // ✅ Ajoute d’autres flux ici (électronique, maison, voyages, etc.)
      // ex:
      // "https://www.dealabs.com/rss/nouveaux",
      // "https://www.dealabs.com/rss/recents",
    ];

    const feeds = await Promise.all(SOURCES.map((u) => parser.parseURL(u)));

    let items = feeds
      .flatMap((f) => f.items || [])
      .map(normalizeItem)
      .filter((it) => it.url);

    // ✅ ÉTAPE CLÉ : on enlève TOUS ceux sans vraie image
    items = items.filter((it) => isValidImage(it.image));

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
