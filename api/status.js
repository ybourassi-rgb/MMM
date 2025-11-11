// /api/status.js
export const config = { runtime: 'edge' };

function headers() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  };
}

// Groupes courts (4 URLs max) => une requête = un petit lot
const GROUPS = [
  // 1) Crypto
  [
    'https://fr.cointelegraph.com/rss',
    'https://cointelegraph.com/rss',
    'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
    'https://bitcoinmagazine.com/.rss/full/',
  ],
  // 2) Marchés/Finance
  [
    'https://finance.yahoo.com/news/rssindex',
    'https://www.reuters.com/markets/rss',
    'https://www.cnbc.com/id/100003114/device/rss',
  ],
  // 3) Auto (affaires)
  [
    'https://www.ebay.fr/sch/i.html?_nkw=BMW+320d&_sop=10&_rss=1',
    'https://www.ebay.fr/sch/i.html?_nkw=Mercedes+C220&_sop=10&_rss=1',
  ],
  // 4) Finance FR / Immo
  [
    'https://www.lesechos.fr/rss/rss_une.xml',
    'https://www.boursorama.com/rss/flux-actualites-bourse/',
    'https://www.latribune.fr/rss/latest',
  ],
  // 5) Tech / IA
  [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://www.wired.com/feed/rss',
  ],
];

function guessType(u = '', t = '') {
  const s = (u + ' ' + t).toLowerCase();
  if (s.includes('ebay')) return 'auto';
  if (s.includes('immo') || s.includes('immobil') || s.includes('seloger') || s.includes('real estate')) return 'immo';
  if (s.includes('coin') || s.includes('crypto') || s.includes('bitcoin') || s.includes('btc')) return 'crypto';
  if (s.includes('yahoo') || s.includes('reuters') || s.includes('cnbc') || s.includes('boursorama') || s.includes('lesechos')) return 'marches';
  if (s.includes('techcrunch') || s.includes('verge') || s.includes('wired') || s.includes('ai')) return 'tech';
  return 'gen';
}

function extractPrice(title = '') {
  const m = title.replace(/\u00A0/g,' ').match(/(\d[\d\s.,’']+)\s?(€|eur|usd|\$|mad|dhs)?/i);
  if (!m) return null;
  const cleaned = m[1].replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function dedupe(list, key = x => x.url || x.title || x.id) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    const k = key(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

async function callRSS(origin, urls, timeoutMs = 3500) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${origin}/api/rss_fetch`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
      cache: 'no-store',
    });
    clearTimeout(tid);
    if (!r.ok) throw new Error(`rss_fetch ${r.status}`);
    return await r.json();
  } catch (e) {
    clearTimeout(tid);
    return { items: [], error: String(e.message || e) };
  }
}

export default async function handler(req) {
  const url = new URL(req.url);
  const g = Math.max(1, Math.min(GROUPS.length, parseInt(url.searchParams.get('g') || '0', 10) || 1)); // g=1..N
  const metaOnly = url.searchParams.get('meta') === '1'; // /api/status?meta=1 => juste les infos

  const now = new Date();
  const host = req.headers.get('host') || process.env.VERCEL_URL;
  const origin = host?.startsWith('http') ? host : `https://${host}`;

  if (metaOnly) {
    return new Response(JSON.stringify({
      ok: true,
      groups: GROUPS.length,
      serverNowISO: now.toISOString(),
      todayFr: now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }),
    }), { status: 200, headers: headers() });
  }

  // Une seule “petite” charge par appel => pas de timeout
  const urls = GROUPS[g - 1] || [];
  const data = await callRSS(origin, urls);

  const items = (data.items || []).map(x => ({
    id: x.id,
    type: guessType(x.url, x.title),
    title: (x.title || '').trim(),
    url: x.url || null,
    source: x.source || '',
    updatedAtISO: x.updatedAtISO || now.toISOString(),
    price: extractPrice(x.title || ''),
  }));

  const feed = dedupe(items).sort((a,b)=> new Date(b.updatedAtISO) - new Date(a.updatedAtISO));

  return new Response(JSON.stringify({
    ok: true,
    group: g,
    groups: GROUPS.length,
    count: feed.length,
    feed,
  }), { status: 200, headers: headers() });
}
