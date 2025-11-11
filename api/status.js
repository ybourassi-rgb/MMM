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

/**
 * SOURCES — n’hésite pas à en ajouter/enlever.
 * NOTE: On reste sur des flux RSS/Atom publics fiables.
 */
const SOURCES = [
  // 🔹 Crypto (FR/EN)
  'https://fr.cointelegraph.com/rss',
  'https://cointelegraph.com/rss',
  'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
  'https://bitcoinmagazine.com/.rss/full/',
  'https://cryptopotato.com/feed/',

  // 🔹 Finance / Marchés
  'https://finance.yahoo.com/news/rssindex',
  'https://www.reuters.com/finance/rss',            // (alias) certains déploiements renvoient business
  'https://www.reuters.com/markets/rss',            // marchés
  'https://www.cnbc.com/id/100003114/device/rss',  // Markets
  'https://www.cnbc.com/id/10000664/device/rss',   // Investing

  // 🔹 FX / Macro / Commodities (selon dispos)
  'https://www.dailyfx.com/feeds/market-news',      // FX
  'https://www.kitco.com/rss/gold.xml',             // Or & métaux

  // 🔹 Auto: exemples eBay (RSS natif)
  'https://www.ebay.fr/sch/i.html?_nkw=BMW+320d&_sop=10&_rss=1',
  'https://www.ebay.fr/sch/i.html?_nkw=Mercedes+C220&_sop=10&_rss=1',
  'https://www.ebay.fr/sch/i.html?_nkw=Audi+A3&_sop=10&_rss=1',
];

/** Essaie d’inférer un type par URL/source ou le titre */
function guessType(u = '', title = '') {
  const s = (u + ' ' + title).toLowerCase();
  if (s.includes('ebay')) return 'auto';
  if (s.includes('immo') || s.includes('immobil') || s.includes('real estate') || s.includes('seloger')) return 'immo';
  if (s.includes('crypto') || s.includes('cointelegraph') || s.includes('coindesk') || s.includes('bitcoin') || s.includes('btc') || s.includes('cryptopotato')) return 'crypto';
  if (s.includes('reuters') || s.includes('cnbc') || s.includes('yahoo') || s.includes('market') || s.includes('finance') || s.includes('stocks')) return 'marches';
  if (s.includes('dailyfx') || s.includes('forex') || s.includes('fx')) return 'fx';
  if (s.includes('kitco') || s.includes('gold') || s.includes('silver') || s.includes('oil') || s.includes('brent')) return 'commod';
  return 'gen';
}

/** Extrait un prix du titre si présent (€, MAD, $, DHS) */
function extractPriceFromTitle(title) {
  if (!title) return null;
  const t = title.replace(/\u00A0/g, ' ');
  const m = t.match(/(\d[\d\s.,’']+)\s?(€|eur|mad|dhs|usd|\$)?/i);
  if (!m) return null;
  const raw = m[1]
    .replace(/[^\d.,]/g, '')
    .replace(/\.(?=\d{3}\b)/g, '') // 1.000.000 -> 1000000
    .replace(',', '.');
  const val = parseFloat(raw);
  return Number.isFinite(val) ? Math.round(val) : null;
}

function dedupe(items, key = (x) => (x.url || x.title || x.id || '')) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = key(it);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

export default async function handler(req) {
  const hasOpenAIKey =
    !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

  // Upstash (facultatif pour le tracking /api/r)
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
    // Construit l’origin (pour appeler notre proxy local /api/rss_fetch)
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

    // Sécurise et filtre erreurs
    const items = (Array.isArray(data.items) ? data.items : [])
      .filter(x => !x.error && !/^Erreur RSS:/i.test(x.title || ''));

    // Normalise -> (id, type, title, price, url, updatedAtISO, source)
    feed = items.map(x => {
      const type = guessType(x.url || x.source, x.title || '');
      return {
        id: x.id,
        type,
        title: (x.title || '').trim(),
        price: extractPriceFromTitle(x.title),
        url: x.url || null,
        updatedAtISO: x.updatedAtISO,
        source: x.source,
      };
    });

    // Dédoublonne par (url || title), ordonne par date, coupe à 60 éléments
    feed = dedupe(feed, it => (it.url || it.title || it.id))
      .sort((a, b) => new Date(b.updatedAtISO) - new Date(a.updatedAtISO))
      .slice(0, 60);

  } catch (_e) {
    // En cas de panne RSS -> fallback visuel minimal (ne casse pas la page)
    feed = [
      { id:'demo-1', type:'crypto',  title:'BTC renoue avec les 61k$ — momentum positif', price:61000, url:'https://www.coindesk.com/',       updatedAtISO: serverNowISO, source:'demo' },
      { id:'demo-2', type:'marches', title:'Actions EU: rebond des valeurs bancaires',     price:null,  url:'https://www.reuters.com/markets/', updatedAtISO: serverNowISO, source:'demo' },
      { id:'demo-3', type:'auto',    title:'BMW 320d 2019 • 92 000 km — 17 900€',         price:17900, url:'https://www.ebay.fr/',             updatedAtISO: serverNowISO, source:'demo' },
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
