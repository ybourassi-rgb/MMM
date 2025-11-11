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
    const link  = get("link") || get("guid") || "";
    const pub   = get("pubDate") || get("dc:date") || "";
    const iso   = pub ? new Date(pub).toISOString() : new Date().toISOString();
    if (title || link) {
      items.push({
        id: (link || title || Math.random().toString(36).slice(2)).slice(-64),
        title, url: link || null, source, updatedAtISO: iso,
      });
    }
  }
  return items;
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: headers() });

  let urls = [];
  if (req.method === "GET") {
    const u = new URL(req.url).searchParams.get("url");
    if (u) urls = [u];
  } else if (req.method === "POST") {
    const body = await req.json().catch(()=> ({}));
    urls = Array.isArray(body?.urls) ? body.urls : [];
  } else {
    return new Response(JSON.stringify({ ok:false, error:"Méthode non autorisée" }), { status:405, headers:headers() });
  }

  if (!urls.length) {
    return new Response(JSON.stringify({ ok:false, error:"Aucune URL fournie" }), { status:400, headers:headers() });
  }

  const out = [];
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const xml = await r.text();
      out.push(...parseItems(xml, u));
    } catch (e) {
      out.push({
        id: `err-${Math.random().toString(36).slice(2)}`,
        title: `Erreur RSS: ${u}`,
        url: u,
        source: u,
        updatedAtISO: new Date().toISOString(),
        error: String(e?.message || e),
      });
    }
  }

  out.sort((a, b) => new Date(b.updatedAtISO) - new Date(a.updatedAtISO));

  return new Response(JSON.stringify({ ok:true, serverNowISO:new Date().toISOString(), items:out }), { status:200, headers:headers() });
}
