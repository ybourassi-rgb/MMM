// lib/rss.js
export function parseRssItems(xml, source) {
  const items = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const get = (tag) =>
      (block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "")
        .replace(/<!\[CDATA\[(.*?)\]\]>/gis, "$1")
        .trim();

    const title = get("title");
    const link = get("link") || get("guid") || "";
    const pubRaw = get("pubDate") || get("dc:date") || "";
    const updatedAtISO = pubRaw ? new Date(pubRaw).toISOString() : new Date().toISOString();

    if (title || link) {
      items.push({
        id: (link || title || Math.random().toString(36).slice(2)).slice(-64),
        title,
        url: link || null,
        source,
        updatedAtISO,
      });
    }
  }
  return items;
}
