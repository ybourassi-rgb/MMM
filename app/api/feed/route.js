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

// =========================
// Dealabs thumbnails -> full
// =========================
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

// =========================
// pick image from RSS item
// =========================
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

// =========================
// filter images (remove bad)
// =========================
function isValidImage(img) {
  if (!img) return false;
  const lower = img.toLowerCase();

  // pas d’icônes / svg / placeholders
  if (lower.endsWith(".svg")) return false;
  if (lower.includes("default-voucher")) return false;
  if (lower.includes("placeholder")) return false;

  // miniatures pepper restantes
  if (lower.match(/\/re\/\d+x\d+\//i)) return false;
  if (lower.match(/\/qt\/\d+\//i)) return false;

  // formats trop petits fréquents
  if (lower.includes("100x100")) return false;
  if (lower.includes("160x160")) return false;
  if (lower.includes("180x180")) return false;
  if (lower.includes("200x150")) return false;

  // thumbs classiques
  if (lower.includes("thumbnail")) return false;
  if (lower.includes("thumbs")) return false;
  if (lower.includes("/small/")) return false;
  if (lower.includes("_small")) return false;

  return true;
}

// =========================
// normalize item
// =========================
function normalizeItem(raw, i = 0, source = "rss") {
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
    source,
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

// =========================
// bucket by source/category
// =========================
function bucketize(item) {
  const s = (item.source || "").toLowerCase();
  const c = (item.category || "").toLowerCase();
  const t = (item.title || "").toLowerCase();

  if (s.includes("travel") || c.includes("voyage") || c.includes("reise") || t.includes("vol ") || t.includes("hotel") || t.includes("flight"))
    return "travel";

  if (s.includes("tech") || s.includes("gaming") || c.includes("tech") || c.includes("informatique") || t.includes("pc") || t.includes("ssd") || t.includes("ryzen"))
    return "tech";

  if (s.includes("dealabs") || s.includes("hukd") || s.includes("mydealz") || s.includes("pepper") || s.includes("chollo"))
    return "general";

  return "other";
}

// =========================
// interleave in TikTok style
// travel → general → general → tech → repeat
// =========================
function interleaveBuckets(buckets) {
  const order = ["travel", "general", "general", "tech", "general", "other"];
  const out = [];

  let guard = 0; // sécurité anti boucle infinie
  while (guard < 5000) {
    guard++;

    let pushed = false;
    for (const key of order) {
      const arr = buckets[key];
      if (arr && arr.length) {
        out.push(arr.shift());
        pushed = true;
      }
    }

    if (!pushed) break; // plus rien à pousser
  }

  return out;
}

export async function GET() {
  try {
    const SOURCES = [
      // 🔥 Dealabs FR
      { url: "https://www.dealabs.com/rss/hot", source: "dealabs-hot" },
      { url: "https://www.dealabs.com/rss/new", source: "dealabs-new" },

      // 🌍 Voyages
      { url: "https://www.hotukdeals.com/rss/tag/travel", source: "travel-uk" },
      { url: "https://www.mydealz.de/rss/tag/reise", source: "travel-de" },
      { url: "https://nl.pepper.com/rss/tag/reizen", source: "travel-nl" },

      // 🛒 Volume autres pays
      { url: "https://www.hotukdeals.com/rss/hot", source: "hukd-hot" },
      { url: "https://www.mydealz.de/rss/hot", source: "mydealz-hot" },
      { url: "https://nl.pepper.com/rss/hot", source: "pepper-nl-hot" },
      { url: "https://www.chollometro.com/rss/hot", source: "chollo-es" },

      // 🎮 Tech / gaming
      { url: "https://www.dealabs.com/rss/tag/gaming", source: "dealabs-gaming" },
      { url: "https://www.hotukdeals.com/rss/tag/tech", source: "tech-uk" },
      { url: "https://www.mydealz.de/rss/tag/technik", source: "tech-de" },
    ];

    const settled = await Promise.allSettled(
      SOURCES.map((s) => parser.parseURL(s.url))
    );

    const feeds = settled
      .map((res, idx) => {
        if (res.status !== "fulfilled") return null;
        return { feed: res.value, meta: SOURCES[idx] };
      })
      .filter(Boolean);

    let items = feeds
      .flatMap(({ feed, meta }) =>
        (feed.items || []).map((it, i) => normalizeItem(it, i, meta.source))
      )
      .filter((it) => it.url)
      .filter((it) => isValidImage(it.image));

    // ===== buckets
    const buckets = { travel: [], general: [], tech: [], other: [] };
    for (const it of items) {
      buckets[bucketize(it)].push(it);
    }

    // petit shuffle interne à chaque bucket
    for (const k of Object.keys(buckets)) {
      buckets[k].sort(() => Math.random() - 0.5);
    }

    const mixed = interleaveBuckets(buckets);

    return NextResponse.json({ ok: true, items: mixed, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
