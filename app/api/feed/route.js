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

// ====== Dealabs thumbnails -> full size ======
function upgradeDealabsImage(url) {
  if (!url) return url;
  try {
    const u = new URL(url);

    if (u.hostname.includes("static-pepper.dealabs.com")) {
      // supprime /re/150x150/qt/55/ etc.
      u.pathname = u.pathname.replace(/\/re\/\d+x\d+\/qt\/\d+\//i, "/");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

// ====== Ignore images "fake" / default ======
function isUsableImage(url) {
  if (!url) return false;

  const lower = url.toLowerCase();

  // pas d'images vectorielles / placeholders
  if (lower.endsWith(".svg")) return false;

  // Dealabs default image
  if (lower.includes("default-voucher")) return false;

  // si c'est clairement une icone générique
  if (lower.includes("placeholder")) return false;

  return true;
}

// ====== Extract image from RSS item ======
function pickImage(it) {
  const mc = it.mediaContent;
  let img = null;

  if (mc?.$?.url) img = mc.$.url;
  if (!img && Array.isArray(mc) && mc[0]?.$?.url) img = mc[0].$?.url;

  if (!img && it.enclosure?.url) img = it.enclosure.url;

  if (!img) {
    const html = it.contentEncoded || it.content || "";
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) img = match[1];
  }

  img = upgradeDealabsImage(img);

  return isUsableImage(img) ? img : null;
}

// ====== Normalize item to your UI format ======
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
      // ===== Hot deals =====
      "https://www.dealabs.com/rss/hot",

      // ===== Voyages (mix) =====
      "https://www.voyagespirates.fr/rss/top",
      "https://www.fly4free.com/feed/",
      "https://www.secretflying.com/posts/feed/",

      // ===== Marketplace / “comme leboncoin / FB” =====
      // (tu peux ajouter tes propres sources ici)
      // ex: rss de petites annonces si tu en as
    ];

    const feeds = await Promise.all(
      SOURCES.map((u) => parser.parseURL(u))
    );

    let items = feeds
      .flatMap((f) => f.items || [])
      .map(normalizeItem);

    // ✅ 1) garde seulement ceux avec lien + image valide
    items = items.filter((it) => it.url && it.image);

    // ✅ 2) petit mélange pour intercaler voyage/tech/etc
    items = items.sort(() => Math.random() - 0.5);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
