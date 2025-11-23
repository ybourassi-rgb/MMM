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

// petite util pour extraire une image d’un item RSS
function pickImage(it) {
  // 1) media:content url
  const mc = it.mediaContent;
  if (mc?.$?.url) return mc.$.url;
  if (Array.isArray(mc) && mc[0]?.$?.url) return mc[0].$?.url;

  // 2) enclosure url (souvent sur RSS)
  if (it.enclosure?.url) return it.enclosure.url;

  // 3) parfois dans content HTML => cherche un <img src="...">
  const html = it.contentEncoded || it.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return match[1];

  return null;
}

function normalizeItem(raw, i = 0) {
  const url = raw.link || raw.url || raw.guid || "";

  return {
    id: raw.id || raw.guid || `${Date.now()}-${i}`,
    title: raw.title?.trim() || "Opportunité",
    url, // ✅ le champ que l’UI utilise
    image: pickImage(raw), // ✅ image absolue si dispo
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
    // Exemple sources (mets les tiennes)
    const SOURCES = [
      "https://www.dealabs.com/rss/hot",
      // ajoute tes flux ici
    ];

    const feeds = await Promise.all(
      SOURCES.map((u) => parser.parseURL(u))
    );

    const items = feeds
      .flatMap((f) => f.items || [])
      .map(normalizeItem)
      .filter((it) => it.url); // garde seulement ceux avec lien

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
