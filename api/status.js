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

// 👉 AJOUTE ICI TES RSS réels (exemples génériques ci-dessous)
// Choisis des RSS qui listent des opportunités ou actualités marché.
const SOURCES = [
  // 'https://example.com/auto.rss',
  // 'https://example.com/immo.rss',
  // 'https://example.com/crypto.rss',
];

function guessType(urlOrSource) {
  const u = (urlOrSource || '').toLowerCase();
  if (u.includes('auto') || u.includes('car') || u.includes('voiture')) return 'auto';
  if (u.includes('immo') || u.includes('realestate') || u.includes('immobilier')) return 'immo';
  if (u.includes('crypto') || u.includes('coin') || u.includes('btc')) return 'crypto';
  return 'gen';
}

// extrait un nombre du titre (ex: “21 000€” → 21000)
function extractPriceFromTitle(title) {
  if (!title) return null;
  const m = title.replace(/\u00A0/g,' ').match(/(\d[\d\s.,’']+)\s?(€|eur|mad|dhs|usd)?/i);
  if (!m) return null;
  const n = m[1].replace(/[^\d.,]/g,'').replace(/\.(?=\d{3}\b)/g,'').replace(',', '.');
  const val = parseFloat(n);
  return isNaN(val) ? null : Math.round(val);
}

async function fetchRssItems(urls) {
  // Appelle la route /api/rss_fetch (même projet)
  const r = await fetch('https://'+(process.env.VERCEL_URL || '')+'/api/rss_fetch', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ urls }),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`rss_fetch HTTP ${r.status}`);
  const data = await r.json();
  if (!data.ok) throw new Error(data.error || 'rss_fetch non OK');
  return data.items || [];
}

export default async function handler() {
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
    if (SOURCES.length) {
      const items = await fetchRssItems(SOURCES);
      feed = items.map(x => {
        const type  = guessType(x.url || x.source);
        const price = extractPriceFromTitle(x.title);
        return {
          id: x.id,
          type,
          title: x.title,
          price,
          url: x.url,                  // ⚠️ si tu as un lien affilié, mets-le ici
          updatedAtISO: x.updatedAtISO,
          source: x.source,
        };
      });
    }
  } catch (e) {
    // En cas d'erreur RSS, on ne casse pas le heartbeat
    feed = [];
  }

  // 🧪 Fallback de démo si aucune source n’est fournie
  if (feed.length === 0) {
    feed = [
      { id:'demo-1', type:'auto', title:'BMW 320d 2019 • 92 000 km — 17 900€', price:17900, url:'https://www.amazon.fr/?tag=ton-tag-affil', updatedAtISO: serverNowISO, source: 'demo' },
      { id:'demo-2', type:'immo', title:'Studio Gueliz • 34 m² — 460 000 MAD',  price:460000, url:'https://www.booking.com/?aid=TON_AID',      updatedAtISO: serverNowISO, source: 'demo' },
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
