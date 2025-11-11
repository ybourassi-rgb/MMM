// /api/status.js
export const config = { runtime: 'edge' };

function headers() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  };
}

// 👉 Mets tes flux ici (tu peux en ajouter/supprimer)
const SOURCES = [
  'https://fr.cointelegraph.com/rss',
  'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
  'https://www.ebay.fr/sch/i.html?_nkw=BMW+320d&_sop=10&_rss=1',
];

function guessType(urlOrSource) {
  const u = (urlOrSource || '').toLowerCase();
  if (u.includes('auto') || u.includes('car') || u.includes('voiture') || u.includes('ebay')) return 'auto';
  if (u.includes('immo') || u.includes('realestate') || u.includes('immobilier')) return 'immo';
  if (u.includes('crypto') || u.includes('coin') || u.includes('btc') || u.includes('coindesk') || u.includes('cointelegraph')) return 'crypto';
  return 'gen';
}

function extractPriceFromTitle(title) {
  if (!title) return null;
  const m = title.replace(/\u00A0/g,' ').match(/(\d[\d\s.,’']+)\s?(€|eur|mad|dhs|usd)?/i);
  if (!m) return null;
  const n = m[1].replace(/[^\d.,]/g,'').replace(/\.(?=\d{3}\b)/g,'').replace(',', '.');
  const val = parseFloat(n);
  return isNaN(val) ? null : Math.round(val);
}

export default async function handler(req) {
  const hasOpenAIKey =
    !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  const hasUpstashKV = !!(restUrl && restToken);

  const now = new Date();
  const serverNowISO = now.toISOString();
  const todayFr = now.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  let feed = [];

  try {
    // 🔑 construit l’origin du déploiement courant
    const host = req?.headers?.get('host') || process.env.VERCEL_URL || 'mmm-alpha-one.vercel.app';
    const origin = host.startsWith('http') ? host : `https://${host}`;

    if (SOURCES.length) {
      // appelle l’API interne /api/rss_fetch du même domaine
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
        url: x.url,                       // si tu as un lien affilié natif, il sera utilisé
        updatedAtISO: x.updatedAtISO,
        source: x.source,
      }));
    }
  } catch (e) {
    // ne casse pas le heartbeat si RSS KO
    feed = [];
  }

  // 🧪 fallback démo si rien
  if (feed.length === 0) {
    feed = [
      { id:'demo-1', type:'auto',  title:'BMW 320d 2019 • 92 000 km — 17 900€', price:17900, url:'https://www.ebay.fr', updatedAtISO: serverNowISO, source:'demo' },
      { id:'demo-2', type:'crypto',title:'Bitcoin — signal momentum positif',     price:null,  url:'https://www.coindesk.com', updatedAtISO: serverNowISO, source:'demo' },
    ];
  }

  const body = {
    ok: true,
    status: 'online',
    hasOpenAIKey,
    hasUpstashKV,
    env: process.env.VERCEL_ENV || 'unknown',
    ts: Date.now(),
    serverNowISO,
    todayFr,
    feed,
  };

  return new Response(JSON.stringify(body), { status: 200, headers: headers() });
}
