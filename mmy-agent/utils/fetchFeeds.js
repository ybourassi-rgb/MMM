import Parser from "rss-parser";

const parser = new Parser();

export default async function fetchFeeds() {
  const feeds = [
    "https://www.lemonde.fr/rss/en_continu.xml",
    "https://www.lefigaro.fr/rss/sections/economie.xml"
    // tu ajouteras tes flux auto / immo / crypto ici
  ];

  const results = [];

  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      results.push(
        ...feed.items.map((i) => ({
          title: i.title,
          link: i.link,
          content: i.contentSnippet || i.content || "",
        }))
      );
    } catch (err) {
      console.warn("Flux erreur:", url, err.message);
    }
  }

  return results.slice(0, 20);
}
