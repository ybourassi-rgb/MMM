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

// ==============================
// Utils
// ==============================

// Dealabs met souvent des miniatures (150x150). On les upgrade.
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

// Parse une image depuis RSS
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

// Normalisation d’un item
function normalizeItem(raw, i = 0, sourceName = "rss") {
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
    source: sourceName,
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

// Mélange "propre" pour intercaler voyage / autres
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fetch RSS avec timeout + fallback
async function parseWithTimeout(url, timeoutMs = 8000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    // rss-parser ne supporte pas AbortController directement,
    // donc on fetch nous-même puis parseString
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { "User-Agent": "MMM-FeedBot/1.0" },
      cache: "no-store",
    });
    const xml = await res.text();
    return await parser.parseString(xml);
  } finally {
    clearTimeout(t);
  }
}

// ==============================
// GET
// ==============================
export async function GET() {
  try {
    // 🚀 MAX sources : Deals + Voyage + Auto/Occasion + Immo + Tech + Jeux + Divers
    const SOURCES = [
      // ----- DEALS GÉNÉRALISTES -----
      { name: "dealabs-hot", url: "https://www.dealabs.com/rss/hot" },
      { name: "dealabs-new", url: "https://www.dealabs.com/rss/nouveau" },
      { name: "hotukdeals", url: "https://www.hotukdeals.com/rss/hot" },
      { name: "mydealz", url: "https://www.mydealz.de/rss/hot" },

      // ----- TECH / GAMING / HIGH-TECH -----
      { name: "frandroid", url: "https://www.frandroid.com/feed" },
      { name: "hitek", url: "https://hitek.fr/rss/actualite" },
      { name: "jeuxvideo", url: "https://www.jeuxvideo.com/rss/rss.xml" },

      // ----- VOYAGE / BONS PLANS VOYAGE -----
      { name: "voyage-dealabs", url: "https://www.dealabs.com/groupe/voyages/rss" },
      { name: "secretflying", url: "https://www.secretflying.com/feed/" },
      { name: "voyagereddit", url: "https://www.reddit.com/r/traveldeals/.rss" },

      // ----- AUTO / OCCASION / MOBILITÉ -----
      { name: "leboncoin-auto", url: "https://www.leboncoin.fr/rss/voitures.xml" },
      { name: "leboncoin-moto", url: "https://www.leboncoin.fr/rss/motos.xml" },

      // ----- IMMO / INVEST -----
      { name: "leboncoin-immo", url: "https://www.leboncoin.fr/rss/locations.xml" },

      // ----- DIVERS POPULAIRES -----
      { name: "ikea", url: "https://www.ikea.com/fr/fr/rss/" },
      { name: "steamdeals", url: "https://store.steampowered.com/feeds/daily_deals.xml" },
    ];

    // On parse tout sans bloquer si un flux crash
    const feeds = await Promise.allSettled(
      SOURCES.map(async (s) => {
        const f = await parseWithTimeout(s.url, 8000);
        return { source: s.name, items: f.items || [] };
      })
    );

    // Normalise + flatten
    let items = feeds
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value.items.map((it, i) => normalizeItem(it, i, r.value.source)));

    // ✅ SUPPRIMER ceux sans lien OU sans image
    items = items.filter((it) => it.url && it.image);

    // Mélange global
    items = shuffle(items);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
