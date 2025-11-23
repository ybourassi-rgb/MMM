import Parser from "rss-parser";
const parser = new Parser();

/**
 * fetchFeeds 2026
 * - sépare news vs deals
 * - taggue chaque item avec sourceType
 * - garantit un format homogène pour le pipeline
 */
export default async function fetchFeeds() {
  // 1) NEWS (actus)
  const newsFeeds = [
    "https://www.lemonde.fr/rss/en_continu.xml",
    "https://www.lefigaro.fr/rss/sections/economie.xml",
    // ajoute ici tes flux crypto/tech/etc
  ];

  // 2) DEALS (e-commerce)
  const dealFeeds = [
    // Ajoute ici VRAIS flux promo (exemples)
    // "https://www.dealabs.com/rss",
    // "https://www.pepper.com/rss",
    // "https://tonfluxamazonpromos/rss",
    // "https://tonfluxaliexpresspromos/rss"
  ];

  const results = [];

  // helper générique
  async function loadFeed(url, sourceType) {
    try {
      const feed = await parser.parseURL(url);
      return (feed.items || []).map((i) => ({
        title: i.title || "",
        link: i.link || "",
        content: i.contentSnippet || i.content || "",
        source: feed.title || url,
        sourceType, // "news" | "deal"
      }));
    } catch (err) {
      console.warn("Flux erreur:", url, err.message);
      return [];
    }
  }

  // NEWS
  for (const url of newsFeeds) {
    const items = await loadFeed(url, "news");
    results.push(...items);
  }

  // DEALS
  for (const url of dealFeeds) {
    const items = await loadFeed(url, "deal");
    results.push(...items);
  }

  // limite globale (tu peux ajuster)
  return results.slice(0, 40);
}
