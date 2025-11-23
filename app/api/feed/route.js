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
   0) Text cleanup (mojibake)
   ========================= */
function cleanText(s = "") {
  return String(s)
    .replace(/Â°/g, "°")
    .replace(/â‚¬/g, "€")
    .replace(/â€™/g, "’")
    .replace(/â€œ/g, "“")
    .replace(/â€/g, "”")
    .replace(/Ã /g, "à")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã®/g, "î")
    .replace(/Ã´/g, "ô")
    .replace(/Ã¹/g, "ù")
    .replace(/Ã§/g, "ç")
    .trim();
}

/* ========================================
   1) Dealabs thumbnails => original image
   ======================================== */
// thumb:
// https://static-pepper.dealabs.com/threads/raw/XXXX/ID_1/re/150x150/qt/55/ID_1.jpg
// full:
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

/* =========================
   2) Pick best image in item
   ========================= */
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

/* =========================
   3) Normalize
   ========================= */
function normalizeItem(raw, i = 0) {
  const url = raw.link || raw.url || raw.guid || "";

  const image = pickImage(raw);

  return {
    id: raw.id || raw.guid || `${Date.now()}-${i}`,
    title: cleanText(raw.title) || "Opportunité",
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
    source: raw.source || "rss",
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: cleanText(raw.summary || raw.contentSnippet || ""),
  };
}

/* =========================
   4) Sources
   ========================= */
const SOURCES = [
  // ===== DEALABS (FR) =====
  "https://www.dealabs.com/rss/hot",
  "https://www.dealabs.com/rss/nouveaux",          // nouveaux deals
  "https://www.dealabs.com/rss/bonnes-affaires",   // si dispo selon région
  "https://www.dealabs.com/rss/groupe/high-tech",
  "https://www.dealabs.com/rss/groupe/maison-jardin",
  "https://www.dealabs.com/rss/groupe/auto-moto",
  "https://www.dealabs.com/rss/groupe/voyages",    // bon plan voyage

  // ===== E-COMMERCE / PROMOS GÉNÉRALISTES =====
  "https://www.promocatalogues.fr/rss",            // catalogues promos
  "https://www.radins.com/rss.xml",                // site bons plans
  "https://www.ma-reduc.com/rss",                  // réductions & codes
  "https://www.cuponation.fr/blog/feed",           // coupons

  // ===== TECH / GAMING =====
  "https://www.generation-nt.com/rss",             // actus + deals parfois
  "https://www.jeuxvideo.com/rss.xml",             // bons plans JV/tech

  // ===== VOYAGES (très grand public) =====
  "https://www.voyagespirates.fr/feed",            // Voyage Pirates FR
  "https://www.traveldealz.fr/feed",               // grosses promos vols/hôtels
  "https://www.dealchecker.co.uk/rss.xml",         // travel deals (EU)
  "https://www.secretflying.com/feed/",            // erreurs tarifaires vols

  // ===== AUTOMOBILE / MOBILITÉ =====
  "https://www.caradisiac.com/rss/actualite/",     // actus auto (parfois deals)
  "https://www.autoplus.fr/rss",                   

  // ===== IMMOBILIER / INVEST =====
  "https://www.seloger.com/rss/annonces.xml",      // annonces immo (si dispo)
  "https://www.pap.fr/rss.xml",                    // annonces PAP

  // ===== AJOUTE ICI TES SOURCES MAROC si tu en as =====
  // ex: sites locaux qui ont un /feed ou /rss
];

/* =========================
   5) GET
   ========================= */
export async function GET() {
  try {
    const feeds = await Promise.allSettled(
      SOURCES.map((u) => parser.parseURL(u))
    );

    const items = feeds
      .filter((f) => f.status === "fulfilled")
      .flatMap((f) => f.value.items || [])
      .map(normalizeItem)
      // ✅ on garde seulement deals AVEC lien + AVEC image
      .filter((it) => it.url && it.image);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
