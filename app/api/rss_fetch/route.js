// app/api/rss_fetch/route.js
import Parser from "rss-parser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

// ✅ Feeds "Market Live" propres / ouverts
const FEEDS = [
  // --- FINANCE / ECONOMIE ---
  {
    url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    type: "finance",
    source: "cnbc-finance",
  },
  {
    url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    type: "finance",
    source: "wsj-markets",
  },

  // --- TECH ---
  {
    url: "https://techcrunch.com/feed/",
    type: "tech",
    source: "techcrunch",
  },
  {
    url: "https://www.theverge.com/rss/index.xml",
    type: "tech",
    source: "theverge",
  },

  // --- CRYPTO ---
  {
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    type: "crypto",
    source: "coindesk",
  },
  {
    url: "https://cointelegraph.com/rss",
    type: "crypto",
    source: "cointelegraph",
  },
  {
    url: "https://fr.cointelegraph.com/rss",
    type: "crypto",
    source: "cointelegraph-fr",
  },
];

// Petite normalisation
function normalizeItem(i, feedMeta) {
  const title = (i.title || "").trim();
  const url = (i.link || i.guid || "").trim();

  const content =
    (i.contentSnippet ||
      i.content ||
      i.contentEncoded ||
      i.summary ||
      ""
    ).toString();

  const image =
    i.enclosure?.url ||
    i.mediaContent?.url ||
    i.mediaThumbnail?.url ||
    null;

  return {
    id: url || `${feedMeta.source}-${Date.now()}`,
    type: feedMeta.type,
    title,
    url,
    source: feedMeta.source,
    image,
    summary: content.slice(0, 240),
    updatedAtISO: i.isoDate || i.pubDate || new Date().toISOString(),
  };
}

export async function GET() {
  const results = [];
  const seen = new Set();

  for (const f of FEEDS) {
    try {
      const feed = await parser.parseURL(f.url);

      for (const item of feed.items || []) {
        const n = normalizeItem(item, f);
        if (!n.url || seen.has(n.url)) continue;
        seen.add(n.url);
        results.push(n);
      }
    } catch (err) {
      // ✅ IMPORTANT: on ne push PAS d'item "Erreur RSS"
      console.warn("[rss_fetch] Flux erreur:", f.url, err.message);
    }
  }

  return Response.json({
    ok: true,
    items: results.slice(0, 60),
  });
}
