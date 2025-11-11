// /api/rss_fetch.js
export const config = { runtime: "edge" };

function headers() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function parseItems(xml, source) {
  // léger, sans dépendance — suffisant pour <item><title/><link/><pubDate/></item>
  const items = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const get = (tag) =>
      (block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "")
        .replace(/<!\[CDATA\[(.*?)\]\]>/gis, "$1")
        .trim();

    const title = get("title");
    const link = get("link") || get("guid");
    const pubDateRaw = get("pubDate") || get("dc:date") || "";
    const pubDateISO = pubDateRaw ? new Date(pubDateRaw).toISOString() : null;

    if (title || link) {
      items.push({
        id: (link || title || Math.random().toString(36).slice(2)).slice(-64),
        title,
        url: link || null,
        source,
        updatedAtISO: pubDateISO || new Date().toISOString(),
      });
    }
  }
  return items;
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: headers() });
  }

  try {
    let urls = [];

    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const u = searchParams.get("url");
      if (u) urls = [u];
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      urls = Array.isArray(body?.urls) ? body.urls : [];
    } else {
      return new Response(JSON.stringify({ ok: false, error: "Méthode non autorisée" }), {
        status: 405,
        headers: headers(),
      });
    }

    if (!urls.length) {
      return new Response(JSON.stringify({ ok: false, error: "Aucune URL fournie" }), {
        status: 400,
        headers: headers(),
      });
    }

    // fetch toutes les sources côté serveur (pas de CORS)
    const results = [];
    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const xml = await r.text();
        const items = parseItems(xml, url).slice(0, 30);
        results.push(...items);
      } catch (e) {
        // On n'arrête pas tout le flux pour une source en erreur
        results.push({
          id: `err-${Math.random().toString(36).slice(2)}`,
          title: `Erreur RSS: ${url}`,
          url,
          source: url,
          updatedAtISO: new Date().toISOString(),
          error: String(e?.message || e),
        });
      }
    }

    // tri par date décroissante si possible
    results.sort((a, b) => new Date(b.updatedAtISO) - new Date(a.updatedAtISO));

    return new Response(JSON.stringify({
      ok: true,
      count: results.length,
      serverNowISO: new Date().toISOString(),
      items: results,
    }), { status: 200, headers: headers() });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || "Erreur interne") }), {
      status: 500,
      headers: headers(),
    });
  }
}
