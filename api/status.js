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

/**
 * On charge par PETITS GROUPES pour éviter FUNCTION_INVOCATION_TIMEOUT.
 * Tu peux ajuster/ajouter des URLs : max ~4 par groupe pour rester safe.
 */
const SOURCE_GROUPS = [
  // 1) Crypto
  [
    'https://fr.cointelegraph.com/rss',
    'https://cointelegraph.com/rss',
    'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
    'https://bitcoinmagazine.com/.rss/full/',
  ],

  // 2) Marchés/Finance (monde)
  [
    'https://finance.yahoo.com/news/rssindex',
    'https://www.reuters.com/markets/rss',
    'https://www.cnbc.com/id/100003114/device/rss',
    'https://www.cnbc.com/id/10000664/device/rss',
  ],

  // 3) Auto (idées d’affaires)
  [
    'https://www.ebay.fr/sch/i.html?_nkw=BMW+320d&_sop=10&_rss=1',
    'https://www.ebay.fr/sch/i.html?_nkw=Mercedes+C220&_sop=10&_rss=1',
    'https://www.ebay.fr/sch/i.html?_nkw=Audi+A3&_sop=10&_rss=1',
  ],

  // 4) Finance FR / Immo / Business (FR)
  [
    'https://www.lesechos.fr/rss/rss_une.xml',
    'https://www.boursorama.com/rss/flux-actualites-bourse/',
    'https://www.latribune.fr/rss/latest',
    'https://investir.lesechos.fr/rss/flux-actualites.xml',
  ],

  // 5) Tech / IA
  [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://www.wired.com/feed/rss',
    'https://arstechnica.com/feed/',
  ],
];

// ---------- helpers ----------
function guessType(u = '', t = '') {
  const s = (u + ' ' + t).toLowerCase();
  if (s.includes('ebay')) return 'auto';
  if (s.includes('immo') || s.includes('immobil') || s.includes('seloger') || s.includes('real estate')) return 'immo';
  if (s.includes('coin') || s.includes('crypto') || s.includes('bitcoin') || s.includes('btc')) return 'crypto';
  if (s.includes('cnbc') || s.includes('reuters') || s.includes('yahoo') || s.includes('boursorama') || s.includes('lesechos') || s.includes('investir')) return 'marches';
  if (s.includes('techcrunch') || s.includes('verge') || s.includes('wired') || s.includes('arstechnica') || s.includes('ai') || s.includes('artificial intelligence')) return 'tech';
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

// Traduction FR optionnelle via OpenAI (si clé dispo) — timeout strict pour ne pas dépasser la limite Edge
async function translateFRIfPossible(titles, OPENAI_KEY, timeoutMs = 2500) {
  if (!OPENAI_KEY || !titles?.length) return null;

  // On tronque à 24 titres max pour rester rapide
  const toTranslate = titles.slice(0, 24);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Tu es un traducteur. Traduis des titres de news en français, de façon naturelle, sans perdre les symboles (€/$). Réponds en JSON: {"t":[]}' },
          { role: 'user', content: JSON.stringify({ t: toTranslate }) },
        ],
      }),
    });
    clearTimeout(id);
    if (!r.ok) return null;
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed.t) ? parsed.t : null;
    return arr && arr.length === toTranslate.length ? arr : null;
  } catch {
    clearTimeout(id);
    return null;
  }
}

// -------------- handler --------------
export default async function handler(req) {
  const now = new Date();
  const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.MoneyMotorY || process.env.MMM_Vercel_Key || '';

  const host = req.headers.get('host') || process.env.VERCEL_URL;
  const origin = host?.startsWith('http') ? host : `https://${host}`;

  let all = [];

  try {
    // On boucle par groupes (séquentiel) pour éviter le timeout global
    for (const group of SOURCE_GROUPS) {
      const r = await fetch(`${origin}/api/rss_fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: group }),
        cache: 'no-store',
      });

      if (r.ok) {
        const data = await r.json();
        const items = (data.items || []).map(x => ({
          id: x.id,
          type: guessType(x.url, x.title),
          title: (x.title || '').trim(),
          url: x.url || null,
          source: x.source || '',
          updatedAtISO: x.updatedAtISO || now.toISOString(),
          price: extractPrice(x.title || ''),
        }));
        all.push(...items);
      }

      // mini pause entre groupes pour ne pas saturer (200ms)
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, 200));
    }

    // Dédoublonne + tri date + limite
    all = dedupe(all).sort((a,b)=> new Date(b.updatedAtISO) - new Date(a.updatedAtISO)).slice(0, 60);

    // Traduction partielle FR (si clé) sur les premiers titres
    const fr = await translateFRIfPossible(all.map(x=>x.title), OPENAI_KEY, 2500);
    if (fr) {
      for (let i=0;i<fr.length && i<all.length;i++) {
        all[i].title = fr[i] || all[i].title;
      }
    }
  } catch (e) {
    // Fallback visuel si jamais tout casse
    all = [
      { id: 'demo-crypto',  type: 'crypto',  title: 'Bitcoin rebondit au-dessus de 61 000 $', url: 'https://www.coindesk.com', updatedAtISO: now.toISOString() },
      { id: 'demo-marches', type: 'marches', title: 'Les marchés européens clôturent en hausse', url: 'https://www.reuters.com/markets', updatedAtISO: now.toISOString() },
      { id: 'demo-tech',    type: 'tech',    title: 'Nouveau modèle d’IA : percée en vision', url: 'https://techcrunch.com', updatedAtISO: now.toISOString() },
      { id: 'demo-auto',    type: 'auto',    title: 'BMW 320d 2019 • 92 000 km — 17 900 €', url: 'https://www.ebay.fr', updatedAtISO: now.toISOString() },
      { id: 'demo-immo',    type: 'immo',    title: 'Location meublée : les rendements se maintiennent', url: 'https://www.lesechos.fr', updatedAtISO: now.toISOString() },
    ];
  }

  const body = {
    ok: true,
    ts: Date.now(),
    env: process.env.VERCEL_ENV || 'unknown',
    todayFr: now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    serverNowISO: now.toISOString(),
    feed: all,
    count: all.length,
  };

  return new Response(JSON.stringify(body), { status: 200, headers: headers() });
}
