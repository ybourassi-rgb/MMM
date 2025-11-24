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
// Pepper thumbnails -> full (Dealabs/HUKD/MyDealz/Chollometro/etc.)
// Pattern:  .../re/150x150/qt/55/...  -> original
// =========================
function upgradePepperImage(url) {
  if (!url) return url;

  try {
    const u = new URL(url);

    // Pepper CDN thumb pattern (works for all Pepper sites)
    u.pathname = u.pathname.replace(
      /\/re\/\d+x\d+\/qt\/\d+\//i,
      "/"
    );

    return u.toString();
  } catch {
    return url;
  }
}

// =========================
// pick image from RSS item
// =========================
function pickImage(it) {
  // 1) media:content url
  const mc = it.mediaContent;
  if (mc?.$?.url) return upgradePepperImage(mc.$.url);
  if (Array.isArray(mc) && mc[0]?.$?.url)
    return upgradePepperImage(mc[0].$?.url);

  // 2) enclosure url
  if (it.enclosure?.url) return upgradePepperImage(it.enclosure.url);

  // 3) sometimes inside HTML content
  const html = it.contentEncoded || it.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return upgradePepperImage(match[1]);

  return null;
}

// =========================
// filter images (remove bad)
// =========================
function isValidImage(img) {
  if (!img) return false;

  const lower = img.toLowerCase();

  // drop icons / svg / placeholders / tracking pixels
  if (lower.endsWith(".svg")) return false;
  if (lower.includes("default-voucher")) return false;
  if (lower.includes("placeholder")) return false;
  if (lower.includes("spacer")) return false;
  if (lower.includes("1x1")) return false;

  // Pepper sometimes returns site-logo or "assets/img/default"
  if (lower.includes("/assets/img/")) return false;

  return true;
}

// =========================
// normalize item
// =========================
function normalizeItem(raw, i = 0, source = "rss") {
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
    source,
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

// =========================
// shuffle to mix categories
// =========================
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET() {
  try {
    // =========================
    // SOURCES : mix deals + travel
    // =========================
    const SOURCES = [
      // 🔥 Dealabs (France)
      { url: "https://www.dealabs.com/rss/hot", source: "dealabs-hot" },
      { url: "https://www.dealabs.com/rss/new", source: "dealabs-new" },

      // 🌍 Travel / voyages (Pepper network)
      { url: "https://www.hotukdeals.com/rss/tag/travel", source: "travel-uk" },
      { url: "https://www.mydealz.de/rss/tag/reise", source: "travel-de" },
      { url: "https://nl.pepper.com/rss/tag/reizen", source: "travel-nl" },

      // 🛒 General deals (autres pays Pepper = +volume)
      { url: "https://www.hotukdeals.com/rss/hot", source: "hukd-hot" },
      { url: "https://www.mydealz.de/rss/hot", source: "mydealz-hot" },
      { url: "https://nl.pepper.com/rss/hot", source: "pepper-nl-hot" },
      { url: "https://www.chollometro.com/rss/hot", source: "chollo-es" },

      // 🎮 Gaming / tech / freebies
      { url: "https://www.dealabs.com/rss/tag/gaming", source: "dealabs-gaming" },
      { url: "https://www.hotukdeals.com/rss/tag/tech", source: "tech-uk" },
      { url: "https://www.mydealz.de/rss/tag/technik", source: "tech-de" },
    ];

    // =========================
    // parse all sources safely
    // =========================
    const settled = await Promise.allSettled(
      SOURCES.map((s) => parser.parseURL(s.url))
    );

    const feeds = settled
      .map((res, idx) => {
        if (res.status !== "fulfilled") return null;
        return { feed: res.value, meta: SOURCES[idx] };
      })
      .filter(Boolean);

    // =========================
    // normalize + filter
    // =========================
    let items = feeds
      .flatMap(({ feed, meta }) =>
        (feed.items || []).map((it, i) => normalizeItem(it, i, meta.source))
      )
      .filter((it) => it.url)
      .filter((it) => isValidImage(it.image)); // ✅ enlève ceux sans vraie image

    // =========================
    // mix everything
    // =========================
    items = shuffleArray(items);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
