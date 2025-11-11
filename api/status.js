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

export default async function handler() {
  const hasOpenAIKey =
    !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

  // Lecture des variables Upstash si présentes
  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  const hasUpstashKV = !!(restUrl && restToken);

  // 🔹 Informations serveur
  const now = new Date();
  const serverNowISO = now.toISOString();

  // 🔹 Formatage date FR (avec mois en toutes lettres)
  const todayFr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // 🔹 Exemples de données du marché (à remplacer par tes flux réels)
  const feed = [
    {
      id: 'bmw-320d-2019',
      type: 'auto',
      title: 'BMW 320d 2019 • 92 000 km',
      price: 17900,
      url: 'https://www.amazon.fr/?tag=ton-tag-affil', // 🔗 lien affilié (Amazon)
      updatedAtISO: serverNowISO,
    },
    {
      id: 'studio-gueliz-34m2',
      type: 'immo',
      title: 'Studio Gueliz • 34 m² • 460 000 MAD',
      price: 460000,
      url: 'https://www.booking.com/?aid=TON_AID', // 🔗 lien affilié (Booking)
      updatedAtISO: serverNowISO,
    },
    {
      id: 'btc-analysis',
      type: 'crypto',
      title: 'Bitcoin — signal achat confirmé (RSI : 48,9 %)',
      price: 61750,
      url: 'https://coinmarketcap.com/',
      updatedAtISO: serverNowISO,
    },
  ];

  // 🔹 Réponse API
  const body = {
    ok: true,
    status: 'online',
    hasOpenAIKey,
    hasUpstashKV,
    env: process.env.VERCEL_ENV || 'unknown',
    ts: Date.now(),
    serverNowISO,
    todayFr, // ex. "mardi 11 novembre 2025"
    feed,
  };

  return new Response(JSON.stringify(body), { status: 200, headers: headers() });
}
