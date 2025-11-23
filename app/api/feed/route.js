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

// upgrade simple vers HD si possible
function toHighRes(url) {
  if (!url) return url;

  let u = url;

  // Dealabs/HotUKDeals CDN : souvent /thread_small/ ou /thread_medium/
  u = u.replace("/thread_small/", "/thread_large/");
  u = u.replace("/thread_medium/", "/thread_large/");

  // parfois ils ont /width/xxx/ dans l’URL
  u = u.replace(/\/width\/\d+\//, "/width/1200/");

  return u;
}

// extraire image d’un item RSS
function pickImage(it) {
  const mc = it.mediaContent;
  if (mc?.$?.url) return toHighRes(mc.$.url);
  if (Array.isArray(mc) && mc[0]?.$?.url) return toHighRes(mc[0].$?.url);

  if (it.enclosure?.url) return toHighRes(it.enclosure.url);

  const html = it.contentEncoded || it.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return toHighRes(match[1]);

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
    ];

    const feeds = await Promise.all(SOURCES.map((u) => parser.parseURL(u)));

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
