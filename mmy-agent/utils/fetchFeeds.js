// mmy-agent/utils/fetchFeeds.js
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "MMY-Agent/1.0 (+https://moneymotory.app)"
  }
});

// Helpers
const isProbablyDealLink = (url = "") => {
  const u = url.toLowerCase();
  return (
    u.includes("amazon.") ||
    u.includes("aliexpress.") ||
    u.includes("ebay.") ||
    u.includes("/dp/") ||
    u.includes("/gp/") ||
    u.includes("deal") ||
    u.includes("promo") ||
    u.includes("offre")
  );
};

const cleanItem = (i) => ({
  title: (i.title || "").trim(),
  link: (i.link || i.guid || "").trim(),
  content: (i.contentSnippet || i.content || "").trim(),
  pubDate: i.isoDate || i.pubDate || null,
});

export default async function fetchFeeds() {
  // 1) SOURCES DEALS par défaut (non-news)
  const defaultDealFeeds = [
    // Sites deals FR (fiables)
    "https://www.dealabs.com/rss/hot",
    "https://www.dealabs.com/rss/new",
    "https://www.promocodie.com/rss",
    // Tech/Geek deals
    "https://www.frandroid.com/feed",
    // Tu peux ajouter d'autres flux deals ici
  ];

  // 2) SOURCES DEALS depuis Railway/Vercel (optionnel)
  // Format attendu:
  // AFFILIATOR_SOURCES='["https://....rss","https://....rss"]'
  let envDealFeeds = [];
  try {
    if (process.env.AFFILIATOR_SOURCES) {
      const parsed = JSON.parse(process.env.AFFILIATOR_SOURCES);
      if (Array.isArray(parsed)) envDealFeeds = parsed;
    }
  } catch (e) {
    console.warn("[fetchFeeds] AFFILIATOR_SOURCES invalid JSON");
  }

  // 3) Si tu veux garder des NEWS ailleurs, fais un autre fichier.
  // Ici on ne prend QUE des deals.
  const feeds = [...defaultDealFeeds, ...envDealFeeds];

  const results = [];

  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);

      const items = (feed.items || [])
        .map(cleanItem)
        .filter((it) => it.title && it.link)
        .filter((it) => isProbablyDealLink(it.link)); // filtre simple

      results.push(...items);
    } catch (err) {
      console.warn("[fetchFeeds] Flux erreur:", url, err?.message || err);
    }
  }

  // 4) Déduplication par link
  const dedup = [];
  const seen = new Set();
  for (const it of results) {
    if (seen.has(it.link)) continue;
    seen.add(it.link);
    dedup.push(it);
  }

  // 5) Limite
  return dedup.slice(0, 30);
}
