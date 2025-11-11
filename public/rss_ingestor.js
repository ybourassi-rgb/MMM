export async function fetchRSS(url) {
  try {
    const xml = await fetch(url).then(r => r.text());
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
      const get = t => (m[1].match(new RegExp(`<${t}>([\\s\\S]*?)<\\/${t}>`, "i"))?.[1] ?? "").trim();
      return { title: get("title"), link: get("link"), source: url };
    });
    return items.slice(0, 20);
  } catch (e) {
    console.error("Erreur RSS:", e);
    return [];
  }
}
