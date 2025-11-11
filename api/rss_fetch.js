// /api/rss_fetch.js
export const config = { runtime: 'nodejs' }; // ✅ plus tolérant que Edge pour les timeouts

function headers() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*',
  };
}

// parseur minimal RSS + Atom
function parseFeed(xml, source) {
  const items = [];

  // RSS <item>
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const chunk = m[1];
    const get = (tag, fallbackRE) => {
      const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const mm = chunk.match(re);
      if (mm?.[1]) return mm[1].trim();
      if (fallbackRE) {
        const mm2 = chunk.match(fallbackRE);
        if (mm2?.[1]) return mm2[1].trim();
      }
      return '';
    };
    const title = get('title');
    const link  = get('link', /<guid.*?>([\s\S]*?)<\/guid>/i);
    const pub   = get('pubDate') || get('date') || '';
    if (title && link) items.push({ title, link, pubDate: pub, source });
  }

  // Atom <entry>
  if (items.length === 0) {
    for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)) {
      const chunk = m[1];
      const t = (chunk.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
      const l = (chunk.match(/<link[^>]*href="([^"]+)"/i)?.[1] || '').trim();
      const d = (chunk.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] || '').trim();
      if (t && l) items.push({ title: t, link: l, pubDate: d, source });
    }
  }

  return items;
}

export default async function handler(req, res) {
  try {
    const u = new URL(req.url, 'http://x'); // base fictive pour parse
    const rss = u.searchParams.get('u');
    const max = Math.max(1, Math.min(30, +(u.searchParams.get('max') || '12')));

    if (!rss) {
      return new Response(JSON.stringify({ ok:false, error:'Missing u' }), { status:400, headers:headers() });
    }

    // 12s timeout
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 12000);

    const r = await fetch(rss, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      cache: 'no-store',
    });
    clearTimeout(to);

    if (!r.ok) {
      const t = await r.text().catch(() => r.statusText);
      return new Response(JSON.stringify({ ok:false, error:`RSS ${r.status}: ${t}` }), { status:502, headers:headers() });
    }

    const xml = await r.text();
    const items = parseFeed(xml, rss).slice(0, max);
    return new Response(JSON.stringify({ ok:true, source:rss, items }), { status:200, headers:headers() });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e?.message||e) }), { status:500, headers:headers() });
  }
}
