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

// ✅ Dealabs met souvent des miniatures :
// https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/re/150x150/qt/55/ID_1.jpg
// → on veut l’original :
// https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/ID_1.jpg
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

// petite util pour extraire une image d’un item RSS
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

function normalizeItem(raw, i = 0, forcedCategory = null) {
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

    category:
      forcedCategory ||
      raw.category ||
      raw.type ||
      "autre",

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

// mélange simple
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Round-robin par catégorie pour alterner (voyage / autre / voyage / autre…)
function interleaveByCategory(items) {
  const groups = {};
  for (const it of items) {
    const c = it.category || "autre";
    if (!groups[c]) groups[c] = [];
    groups[c].push(it);
  }

  // on mélange chaque groupe pour éviter "bloc par source"
  Object.values(groups).forEach(shuffle);

  const cats = Object.keys(groups);
  const result = [];
  let left = true;

  while (left) {
    left = false;
    for (const c of cats) {
      const next = groups[c].shift();
      if (next) {
        result.push(next);
        left = true;
      }
    }
  }

  return result;
}

export async function GET() {
  try {
    // ✅ Ajoute autant de sources que tu veux
    // tag = catégorie forçée si le RSS est trop "général"
    const SOURCES = [
      // -------------------- GROS DEALS GÉNÉRAUX --------------------
      { url: "https://www.dealabs.com/rss/hot", tag: "bons-plans" },
      { url: "https://www.dealabs.com/rss/new", tag: "bons-plans" },

      // -------------------- HIGH TECH / GAMING --------------------
      { url: "https://www.dealabs.com/groupe/high-tech/rss", tag: "high-tech" },
      { url: "https://www.dealabs.com/groupe/informatique/rss", tag: "high-tech" },
      { url: "https://www.dealabs.com/groupe/jeux-video/rss", tag: "gaming" },
      { url: "https://www.dealabs.com/groupe/console/rss", tag: "gaming" },

      // -------------------- MAISON / BRICOLAGE / JARDIN --------------------
      { url: "https://www.dealabs.com/groupe/maison/rss", tag: "maison" },
      { url: "https://www.dealabs.com/groupe/bricolage/rss", tag: "bricolage" },
      { url: "https://www.dealabs.com/groupe/jardin/rss", tag: "jardin" },

      // -------------------- MODE / SNEAKERS / BEAUTÉ --------------------
      { url: "https://www.dealabs.com/groupe/mode/rss", tag: "mode" },
      { url: "https://www.dealabs.com/groupe/chaussures/rss", tag: "sneakers" },
      { url: "https://www.dealabs.com/groupe/beaute-et-parfum/rss", tag: "beaute" },

      // -------------------- SUPERMARCHÉ / COURSES --------------------
      { url: "https://www.dealabs.com/groupe/supermarche-et-alimentation/rss", tag: "courses" },
      { url: "https://www.dealabs.com/groupe/hygiene-et-sante/rss", tag: "courses" },

      // -------------------- BÉBÉ / FAMILLE --------------------
      { url: "https://www.dealabs.com/groupe/bebe-et-enfants/rss", tag: "famille" },
      { url: "https://www.dealabs.com/groupe/jouets/rss", tag: "famille" },

      // -------------------- AUTO / MOTO --------------------
      { url: "https://www.dealabs.com/groupe/auto-moto/rss", tag: "auto" },
      { url: "https://www.dealabs.com/groupe/pieces-auto/rss", tag: "auto" },

      // -------------------- IMMO / BUSINESS --------------------
      { url: "https://www.dealabs.com/groupe/immobilier/rss", tag: "immo" },
      { url: "https://www.dealabs.com/groupe/services-et-entreprises/rss", tag: "business" },

      // -------------------- VOYAGE --------------------
      { url: "https://www.dealabs.com/groupe/voyages/rss", tag: "voyage" },
      { url: "https://www.dealabs.com/groupe/transport/rss", tag: "voyage" },

      // -------------------- AUTRES SITES (OPTIONNEL) --------------------
      // Promos vols/hotels (en général)
      { url: "https://www.voyage-prive.com/rss/offres", tag: "voyage" },
      // Deals variés hors Dealabs
      { url: "https://www.hotukdeals.com/rss/hot", tag: "bons-plans" },
    ];

    const feeds = await Promise.all(
      SOURCES.map(async ({ url, tag }) => {
        const f = await parser.parseURL(url);
        return { ...f, __tag: tag };
      })
    );

    let items = feeds
      .flatMap((f) =>
        (f.items || []).map((raw, i) =>
          normalizeItem(raw, i, f.__tag)
        )
      )
      // ✅ on garde seulement ceux avec lien ET image
      .filter((it) => it.url && it.image);

    // ✅ mélange alterné par catégorie
    items = interleaveByCategory(items);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
