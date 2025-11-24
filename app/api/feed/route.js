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
// upgrade image urls
// (Pepper thumbnails -> full + Amazon size tokens)
// =========================
function upgradeImage(url) {
  if (!url) return url;

  try {
    const u = new URL(url);
    const host = u.hostname;

    // ✅ Pepper CDN thumbnails → full
    u.pathname = u.pathname.replace(
      /\/re\/\d+x\d+\/qt\/\d+\//i,
      "/"
    );

    // ✅ Amazon HD
    if (host.includes("amazon.")) {
      u.pathname = u.pathname.replace(/_S[XL]\d+_/gi, "_SL1000_");
      u.pathname = u.pathname.replace(/_AC_[A-Z]{2}\d+_/gi, "_AC_SL1000_");
    }

    return u.toString();
  } catch {
    return url;
  }
}

// =========================
// pick image from RSS item
// =========================
function pickImage(it) {
  const mc = it.mediaContent;
  if (mc?.$?.url) return upgradeImage(mc.$.url);
  if (Array.isArray(mc) && mc[0]?.$?.url)
    return upgradeImage(mc[0].$?.url);

  if (it.enclosure?.url) return upgradeImage(it.enclosure.url);

  const html = it.contentEncoded || it.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return upgradeImage(match[1]);

  return null;
}

// =========================
// filter images (remove bad / low-res patterns)
// =========================
function isValidImage(img) {
  if (!img) return false;
  const lower = img.toLowerCase();

  if (lower.endsWith(".svg")) return false;
  if (lower.includes("default-voucher")) return false;
  if (lower.includes("placeholder")) return false;
  if (lower.includes("/assets/img/")) return false;

  if (lower.includes("150x150")) return false;
  if (lower.includes("120x120")) return false;
  if (lower.includes("200x200")) return false;
  if (lower.includes("thumb")) return false;

  if (lower.match(/_s[xy]\d+_/i)) return false;
  if (lower.match(/_sl\d+_/i) && !lower.includes("_sl1000_")) return false;

  return true;
}

// =========================
// tiny language guesser
// =========================
function looksFrench(text = "") {
  const t = text.toLowerCase();
  // mini heuristique : beaucoup de mots FR courants
  const frHits = [
    "prix", "offre", "promo", "livraison", "gratuit", "réduction",
    "voyage", "vol", "hôtel", "location", "bon plan", "au lieu de"
  ].filter(w => t.includes(w)).length;
  return frHits >= 2;
}

// =========================
// Translate to French (optional via OpenAI)
// =========================
async function translateToFR(text) {
  if (!text) return text;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return text; // pas de clé => pas de traduction

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Tu traduis en français simple et naturel. Garde les marques, chiffres, prix et unités. Pas d'ajout.",
          },
          { role: "user", content: text },
        ],
      }),
    });

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || text;
  } catch {
    return text;
  }
}

async function translateItemIfNeeded(item) {
  // si déjà FR → ne touche pas
  if (looksFrench(item.title + " " + (item.summary || ""))) return item;

  const [titleFR, summaryFR] = await Promise.all([
    translateToFR(item.title),
    translateToFR(item.summary),
  ]);

  return { ...item, title: titleFR, summary: summaryFR };
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
    // SOURCES : deals + travel + "annonces"
    // =========================
    const SOURCES = [
      // 🔥 Deals France
      { url: "https://www.dealabs.com/rss/hot", source: "dealabs-hot" },
      { url: "https://www.dealabs.com/rss/new", source: "dealabs-new" },

      // 🌍 Voyages (on traduit si besoin)
      { url: "https://www.hotukdeals.com/rss/tag/travel", source: "travel-uk" },
      { url: "https://www.mydealz.de/rss/tag/reise", source: "travel-de" },
      { url: "https://nl.pepper.com/rss/tag/reizen", source: "travel-nl" },

      // 🛒 Gros volume Pepper network
      { url: "https://www.hotukdeals.com/rss/hot", source: "hukd-hot" },
      { url: "https://www.mydealz.de/rss/hot", source: "mydealz-hot" },
      { url: "https://nl.pepper.com/rss/hot", source: "pepper-nl-hot" },
      { url: "https://www.chollometro.com/rss/hot", source: "chollo-es" },

      // 🎮 Tech / gaming
      { url: "https://www.dealabs.com/rss/tag/gaming", source: "dealabs-gaming" },
      { url: "https://www.hotukdeals.com/rss/tag/tech", source: "tech-uk" },
      { url: "https://www.mydealz.de/rss/tag/technik", source: "tech-de" },

      // 🧰 "Annonces" proches marketplace (RSS fiables)
      // eBay deals (bonnes affaires type marketplace)
      { url: "https://www.ebay.com/deals/rss", source: "ebay-deals" },

      // AliExpress hot deals via Pepper tag
      { url: "https://www.dealabs.com/rss/tag/aliexpress", source: "aliexpress-fr" },

      // Auto / immo via Dealabs tags (pour attirer public Leboncoin-like)
      { url: "https://www.dealabs.com/rss/tag/auto", source: "auto-fr" },
      { url: "https://www.dealabs.com/rss/tag/immobilier", source: "immo-fr" },
    ];

    // =========================
    // parse sources safely
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

    let items = feeds
      .flatMap(({ feed, meta }) =>
        (feed.items || []).map((it, i) => normalizeItem(it, i, meta.source))
      )
      .filter((it) => it.url)
      .filter((it) => isValidImage(it.image));

    // ✅ traduction FR si besoin (optionnel)
    items = await Promise.all(items.map(translateItemIfNeeded));

    // ✅ mélange tout (voyage/deals/annonces)
    items = shuffleArray(items);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
