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

/* =========================
   Helpers images Dealabs
   ========================= */

// Dealabs met souvent des miniatures :
// https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/re/150x150/qt/55/ID_1.jpg
// → on veut l’original :
// https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/ID_1.jpg
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

function isValidImage(url) {
  if (!url) return false;
  const u = url.toLowerCase();

  // on jette les svg / placeholders / pixels
  if (u.endsWith(".svg")) return false;
  if (u.includes("default-voucher")) return false;
  if (u.includes("placeholder")) return false;
  if (u.includes("spacer")) return false;

  return true;
}

function normalizeItem(raw, i = 0, sourceTag = "rss") {
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
    source: sourceTag,
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

/* =========================
   Anti-freeze feed
   ========================= */

async function parseWithTimeout(url, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);

  try {
    // rss-parser n'accepte pas le signal direct,
    // mais parseURL utilise fetch interne Node.
    // Donc on fait un fetch nous-mêmes + parseString.
    const res = await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; MoneyMotorY/1.0; +https://mmm-alpha-one.vercel.app)",
      },
    });
    const text = await res.text();
    return await parser.parseString(text);
  } finally {
    clearTimeout(t);
  }
}

/* =========================
   Mix catégories (round robin)
   ========================= */
function mixByCategory(items) {
  const buckets = new Map();

  for (const it of items) {
    const cat = (it.category || "autre").toLowerCase();
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat).push(it);
  }

  // petit shuffle dans chaque bucket
  for (const arr of buckets.values()) {
    arr.sort(() => Math.random() - 0.5);
  }

  const cats = [...buckets.keys()];
  const mixed = [];
  let added = true;

  while (added) {
    added = false;
    for (const c of cats) {
      const arr = buckets.get(c);
      if (arr?.length) {
        mixed.push(arr.shift());
        added = true;
      }
    }
  }

  return mixed;
}

/* =========================
   GET
   ========================= */

export async function GET() {
  try {
    const SOURCES = [
      // ✅ Dealabs général
      { url: "https://www.dealabs.com/rss/hot", tag: "dealabs" },

      // ✅ Autres bons plans FR / EU
      { url: "https://www.bravodeal.com/feed/", tag: "bonsplans" },
      { url: "https://www.promodeclic.com/feed/", tag: "bonsplans" },
      { url: "https://www.offresdujour.fr/feed", tag: "bonsplans" },

      // ✅ Tech / gaming deals
      { url: "https://www.dealabs.com/groupe/informatique.rss", tag: "tech" },
      { url: "https://www.dealabs.com/groupe/jeux-video.rss", tag: "gaming" },

      // ✅ Auto / immo (si ça marche => top)
      { url: "https://www.dealabs.com/groupe/auto-moto.rss", tag: "auto" },
      { url: "https://www.dealabs.com/groupe/immobilier.rss", tag: "immo" },

      // ✅ Voyage (best effort, si flux mort il est ignoré)
      { url: "https://travelpirates.com/fr/feed/", tag: "voyage" },
      { url: "https://www.secretflying.com/feed/", tag: "voyage" },
      { url: "https://www.voyagepirates.com/feed/", tag: "voyage" },

      // ✅ Marketplace-style deals (occasion / ventes)
      { url: "https://www.dealabs.com/groupe/occasion.rss", tag: "occasion" },
      { url: "https://www.dealabs.com/groupe/maison-jardin.rss", tag: "maison" },
    ];

    const settled = await Promise.allSettled(
      SOURCES.map((s) => parseWithTimeout(s.url, 7000))
    );

    const itemsRaw = settled.flatMap((res, idx) => {
      if (res.status !== "fulfilled") return [];
      const feed = res.value;
      const tag = SOURCES[idx]?.tag || "rss";
      return (feed.items || []).map((it, i) =>
        normalizeItem(it, i, tag)
      );
    });

    const itemsClean = itemsRaw
      .filter((it) => it.url)
      .filter((it) => isValidImage(it.image)); // ✅ retire sans photo

    const itemsMixed = mixByCategory(itemsClean);

    return NextResponse.json({ ok: true, items: itemsMixed, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
