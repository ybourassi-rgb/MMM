// app/api/feed/route.js
import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs"; // ✅ stabilité (RSS + Redis)

const redis = Redis.fromEnv();

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

// ====================================
// 1) Pepper thumbnails -> full quality
// ====================================
function upgradePepperImage(url) {
  if (!url) return url;

  try {
    const u = new URL(url);
    const host = u.hostname;

    const isPepper =
      host.includes("static-pepper.") ||
      host.includes("static-hotukdeals.") ||
      host.includes("static-mydealz.") ||
      host.includes("pepper.") ||
      host.includes("chollometro.") ||
      host.includes("dealabs.");

    if (isPepper) {
      u.pathname = u.pathname.replace(/\/re\/\d+x\d+\/qt\/\d+\//i, "/");
      u.pathname = u.pathname.replace(/\/re\/\d+x\d+\//i, "/");
      return u.toString();
    }

    return url;
  } catch {
    return url;
  }
}

// ====================================
// 2) Extract image from RSS item
// ====================================
function pickImage(it) {
  const mc = it.mediaContent;

  if (mc?.$?.url) return upgradePepperImage(mc.$.url);
  if (Array.isArray(mc) && mc[0]?.$?.url) {
    return upgradePepperImage(mc[0].$?.url);
  }

  if (it.enclosure?.url) return upgradePepperImage(it.enclosure.url);

  const html = it.contentEncoded || it.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return upgradePepperImage(match[1]);

  return null;
}

// ====================================
// 3) Filter NO/LOW images
// ====================================
function isValidImage(img) {
  if (!img) return false;
  const lower = img.toLowerCase();

  if (lower.endsWith(".svg")) return false;
  if (lower.includes("default-voucher")) return false;
  if (lower.includes("placeholder")) return false;

  if (lower.match(/\/re\/\d+x\d+\//i)) return false;
  if (lower.match(/\/qt\/\d+\//i)) return false;

  const smallSizes = [
    "100x100",
    "120x120",
    "150x150",
    "160x160",
    "180x180",
    "200x150",
  ];
  if (smallSizes.some((s) => lower.includes(s))) return false;

  if (lower.includes("thumbnail")) return false;
  if (lower.includes("thumbs")) return false;
  if (lower.includes("/small/")) return false;
  if (lower.includes("_small")) return false;

  return true;
}

// ====================================
// 4) Normalize item
// ====================================
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

// ====================================
// 5) Bucketize (travel / tech / general)
// ====================================
function bucketize(item) {
  const s = (item.source || "").toLowerCase();
  const c = (item.category || "").toLowerCase();
  const t = (item.title || "").toLowerCase();

  if (
    s.includes("travel") ||
    c.includes("voyage") ||
    c.includes("reise") ||
    t.includes("vol ") ||
    t.includes("hotel") ||
    t.includes("flight")
  ) return "travel";

  if (
    s.includes("tech") ||
    s.includes("gaming") ||
    c.includes("tech") ||
    c.includes("informatique") ||
    t.includes("pc") ||
    t.includes("ssd") ||
    t.includes("ryzen")
  ) return "tech";

  if (
    s.includes("community") ||
    s.includes("dealabs") ||
    s.includes("hukd") ||
    s.includes("mydealz") ||
    s.includes("pepper") ||
    s.includes("chollo")
  ) return "general";

  return "other";
}

// ====================================
// 6) Interleave TikTok style
// ====================================
function interleaveBuckets(buckets) {
  const order = ["travel", "general", "general", "tech", "general", "other"];
  const out = [];

  let guard = 0;
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
    if (!pushed) break;
  }

  return out;
}

export async function GET() {
  try {
    const SOURCES = [
      { url: "https://www.dealabs.com/rss/hot", source: "dealabs-hot" },
      { url: "https://www.dealabs.com/rss/new", source: "dealabs-new" },

      { url: "https://www.hotukdeals.com/rss/tag/travel", source: "travel-uk" },
      { url: "https://www.mydealz.de/rss/tag/reise", source: "travel-de" },
      { url: "https://nl.pepper.com/rss/tag/reizen", source: "travel-nl" },

      { url: "https://www.hotukdeals.com/rss/hot", source: "hukd-hot" },
      { url: "https://www.mydealz.de/rss/hot", source: "mydealz-hot" },
      { url: "https://nl.pepper.com/rss/hot", source: "pepper-nl-hot" },
      { url: "https://www.chollometro.com/rss/hot", source: "chollo-es" },

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

    // ✅ Community deals DIRECT Redis (plus de fetch relatif instable)
    let community = [];
    try {
      community = (await redis.lrange("community:deals", 0, 199)) || [];
    } catch {
      community = [];
    }

    items = [...community, ...items];

    const buckets = { travel: [], general: [], tech: [], other: [] };
    for (const it of items) buckets[bucketize(it)].push(it);

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
