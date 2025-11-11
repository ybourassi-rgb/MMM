// /api/market.js
export const config = { runtime: 'edge' };

function headers() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  };
}

// 👉 Tes flux (tu peux en ajouter/enlever)
const SOURCES = [
  'https://fr.cointelegraph.com/rss',
  'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
  'https://www.ebay.fr/sch/i.html?_nkw=BMW+320d&_sop=10&_rss=1',
];

function guessType(urlOrSource) {
  const u = (urlOrSource || '').toLowerCase();
  if (u.includes('ebay') || u.includes('auto') || u.includes('voiture') || u.includes('car')) return 'auto';
  if (u.includes('immo') || u.includes('immobilier') || u.includes('realestate')) return 'immo';
  if (u.includes('crypto') || u.includes('coin') || u.includes('btc') || u.includes('coindesk') || u.includes('cointelegraph')) return 'crypto';
  return 'gen';
}

function extractPriceFromTitle(title) {
  if (!title) return null;
  const m = title.replace(/\u00A0/g,' ').match(/(\d[\d\s.,’']+)\s?(€|eur|mad|dhs|usd)?/i);
  if (!m) return null;
  const n = m[1]
    .replace(/[^\d.,]/g,'')
    .replace(/\.(?=\d{3}\b)/g,'')
    .replace(',', '.');
  const val = parseFloat(n);
  return isNaN(val) ? null : Math.round(val);
}

export default async function handler(req) {
  const now = new Date();
  const serverNowISO = now.toISOString();

  let feed = [];
  try {
    // calcule l'origin courant pour éviter les CORS
    const host = req.headers.get('host') || process.env.VERCEL_URL;
    const origin = host?.startsWith('http') ? host : `https://${host}`;

    const r = await fetch(`${origin}/api/rss_fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: SOURCES }),
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`rss_fetch HTTP ${r.status}`);
    const data = await r.json();
    const items = Array.isArray(data.items) ? data.items : [];

    feed = items.map(x => ({
      id: x.id,
      type: guessType(x.url || x.source),
      title: x.title,
      price: extractPriceFromTitle(x.title),
      url: x.url,
      updatedAtISO: x.updatedAtISO || serverNowISO,
      source: x.source,
    }));
  } catch (e) {
    feed = [];
  }

  // Fallback visuel
  if (feed.length === 0) {
    feed = [
      { id:'demo-1', type:'auto',   title:'BMW 320d 2019 • 92 000 km — 17 900€', price:17900, url:'https://www.ebay.fr',      updatedAtISO: serverNowISO, source:'demo' },
      { id:'demo-2', type:'crypto', title:'Bitcoin — signal momentum positif',   price:null,  url:'https://www.coindesk.com', updatedAtISO: serverNowISO, source:'demo' },
    ];
  }

  return new Response(JSON.stringify({ ok: true, feed }), { status: 200, headers: headers() });
}
