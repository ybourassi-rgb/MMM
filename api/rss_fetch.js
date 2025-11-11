// /api/rss_fetch.js
export const config = { runtime: 'edge' };

function h() {
  return {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store, no-cache, must-revalidate',
    'Pragma':'no-cache',
    'Expires':'0',
    'Access-Control-Allow-Origin':'*',
  };
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const u = searchParams.get('u');
    const max = Math.max(1, Math.min(30, +(searchParams.get('max')||'12')));

    if (!u) return new Response(JSON.stringify({ ok:false, error:'Missing u'}), { status:400, headers:h() });

    const ctrl = new AbortController();
    const to = setTimeout(()=>ctrl.abort(), 6000); // 6s max
    const r = await fetch(u, {
      headers: { 'Accept':'application/rss+xml, application/xml;q=0.9, */*;q=0.8' },
      cache:'no-store',
      signal: ctrl.signal,
    });
    clearTimeout(to);

    if (!r.ok) {
      const t = await r.text().catch(()=>r.statusText);
      return new Response(JSON.stringify({ ok:false, error:`RSS ${r.status}: ${t}` }), { status:502, headers:h() });
    }

    const xml = await r.text();

    // parse simple (comme ton helper public)
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m => {
      const get = (t) => (m[1].match(new RegExp(`<${t}>([\\s\\S]*?)<\\/${t}>`, 'i'))?.[1] ?? '').trim();
      const title = get('title');
      const link  = get('link') || (get('guid') || '').replace(/^.*(https?:\/\/)/,'$1');
      const pub   = get('pubDate') || '';
      return { title, link, pubDate: pub };
    }).filter(x => x.title && x.link);

    return new Response(JSON.stringify({ ok:true, source:u, items: items.slice(0, max) }), { status:200, headers:h() });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e?.message||e) }), { status:500, headers:h() });
  }
}
