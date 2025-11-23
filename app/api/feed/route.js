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

// Upgrade des miniatures dealabs → version plus grande si possible
function upgradeDealabs(url) {
  if (!url) return url;

  return url
    .replace("/thumb/", "/")
    .replace(/\/[0-9]{2,3}x[0-9]{2,3}\//, "/");
}

// petite util pour extraire une image d’un item RSS
function pickImage(it) {
  let url = null;

  // 1) media:content url
  const mc = it.mediaContent;
  if (mc?.$?.url) url = mc.$.url;
  if (!url && Array.isArray(mc) && mc[0]?.$?.url) url = mc[0].$?.url;

  // 2) enclosure url (souvent sur RSS)
  if (!url && it.enclosure?.url) url = it.enclosure.url;

  // 3) parfois dans content HTML => cherche un <img src="...">
  if (!url) {
    const html = it.contentEncoded || it.content || "";
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) url = match[1];
  }

  return upgradeDealabs(url);
}

function normalizeItem(raw, i = 0) {
  const finalUrl = raw.affiliateUrl || raw.url || raw.link || raw.guid || "";

  return {
    id: raw.id || raw.guid || `${Date.now()}-${i}`,
    title: raw.title?.trim() || "Opportunité",

    // ✅ UI DealSlide utilise url/link/affiliateUrl
    url: raw.url || raw.link || raw.guid || "",
    link: raw.link || null,
    affiliateUrl: raw.affiliateUrl || null,

    image: pickImage(raw), // ✅ image absolue si dispo
    price: raw.price || null,
    score: raw.yscore?.globalScore ?? raw.score ?? null,
    category: raw.category || raw.type || "autre",
    margin: raw.yscore ? `${raw.yscore.opportunityScore ?? "—"}%` : raw.margin,
    risk: raw.yscore ? `${raw.yscore.riskScore ?? "—"}/100` : raw.risk,
    horizon: raw.horizon || "court terme",
    halal: raw.yscore ? raw.yscore.halalScore >= 80 : raw.halal ?? null,
    source: raw.source || "rss",
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

export async function GET() {
  try {
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
      .filter((it) => it.url || it.link || it.affiliateUrl);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
