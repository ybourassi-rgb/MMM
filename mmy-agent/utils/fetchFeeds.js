// mmy-agent/utils/fetchFeeds.js
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["media:content", "mediaContent"],
    ],
  },
});

// Liste de feeds :
// - type "deal" => Telegram DEALS + Redis
// - type "news" => Telegram AUTO (actu)
const FEEDS = [
  // -------- DEALS / BONS PLANS --------
  {
    url: "https://www.dealabs.com/rss/hot.xml",
    type: "deal",
    source: "dealabs-hot",
    defaultCategory: "Deals",
  },
  {
    url: "https://www.dealabs.com/rss/nouveaux.xml",
    type: "deal",
    source: "dealabs-new",
    defaultCategory: "Deals",
  },
  {
    url: "https://www.frandroid.com/bons-plans/feed",
    type: "deal",
    source: "frandroid-deals",
    defaultCategory: "Tech",
  },
  {
    url: "https://www.phonandroid.com/bons-plans/feed",
    type: "deal",
    source: "phonandroid-deals",
    defaultCategory: "Tech",
  },

  // -------- NEWS --------
  {
    url: "https://www.lemonde.fr/rss/en_continu.xml",
    type: "news",
    source: "lemonde",
    defaultCategory: "News",
  },
  {
    url: "https://www.lefigaro.fr/rss/sections/economie.xml",
    type: "news",
    source: "lefigaro-economie",
    defaultCategory: "News",
  },
];

// Normalisation (IMPORTANT: sourceType au lieu de type)
function normalizeItem(i, feedMeta) {
  const title = (i.title || "").trim();
  const link = (i.link || i.guid || "").trim();

  const content =
    (i.contentSnippet ||
      i.content ||
      i.contentEncoded ||
      i.summary ||
      ""
    ).toString();

  return {
    title,
    link,
    content,

    // ✅ champ attendu par index.js
    sourceType: feedMeta.type, // "deal" | "news"
    source: feedMeta.source,
    category: feedMeta.defaultCategory,
    publishedAt: i.isoDate || i.pubDate || null,
  };
}

export default async function fetchFeeds(limit = 40) {
  const results = [];
  const seen = new Set();

  for (const f of FEEDS) {
    try {
      const feed = await parser.parseURL(f.url);

      for (const item of feed.items || []) {
        const n = normalizeItem(item, f);

        if (!n.link || seen.has(n.link)) continue;
        seen.add(n.link);

        results.push(n);
      }
    } catch (err) {
      console.warn("Flux erreur:", f.url, err.message);
    }
  }

  return results.slice(0, limit);
}
