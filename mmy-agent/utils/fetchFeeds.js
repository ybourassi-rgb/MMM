// mmy-agent/utils/fetchFeeds.js
import Parser from "rss-parser";
const parser = new Parser();

/**
 * fetchFeeds 2026
 * - Sépare NEWS vs DEALS
 * - Tag chaque item avec sourceType = "news" | "deal"
 * - Format homogène pour le pipeline (index.js)
 */
export default async function fetchFeeds() {
  // 1) NEWS (actus / marchés)
  const newsFeeds = [
    "https://www.lemonde.fr/rss/en_continu.xml",
    "https://www.lefigaro.fr/rss/sections/economie.xml",
    // 👉 ajoute ici tes flux crypto/tech/auto/immo si tu veux
  ];

  // 2) DEALS (bons plans e-commerce)
  const dealFeeds = [
    // FR (communauté deals)
    "https://www.dealabs.com/rss", // si 403 ou change → on génère un RSS custom

    // Réseau Pepper (international, pleins de vrais deals)
    "https://www.hotukdeals.com/rss",
    "https://www.mydealz.de/rss",
    "https://nl.pepper.com/rss",
  ];

  const results = [];

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

  // Charger NEWS
  for (const url of newsFeeds) {
    const items = await loadFeed(url, "news");
    results.push(...items);
  }

  // Charger DEALS
  for (const url of dealFeeds) {
    const items = await loadFeed(url, "deal");
    results.push(...items);
  }

  // limite globale (ajuste si tu veux)
  return results.slice(0, 60);
}
