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

  // -> lit les bons noms, et accepte l'ancienne variante "REDIS" en fallback
  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  const hasUpstashKV = !!(restUrl && restToken);

  // 🔹 Ajouts non-cassants (pour “Marché en direct”)
  const now = new Date();
  const serverNowISO = now.toISOString();
  const todayFr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // 🔹 Petit “feed” démo/placeholder (à remplacer par tes vraies sources)
  // Laisse vide [] si tu préfères : l’UI gère le cas "aucune opportunité".
  const feed = [
    // { id:'ex-1', type:'auto', title:'BMW 320d 2019 • 92 000 km', price:17900, url:'https://exemple.com/1', updatedAtISO: serverNowISO },
    // { id:'ex-2', type:'immo', title:'Studio Gueliz • 34 m²', price:460000, url:'https://exemple.com/2', updatedAtISO: serverNowISO },
  ];

  const body = {
    // 🟢 Champs historiques (inchangés)
    ok: true,
    status: 'online',
    hasOpenAIKey,
    hasUpstashKV,
    env: process.env.VERCEL_ENV || 'unknown',
    ts: Date.now(),

    // 🆕 Champs ajoutés (optionnels pour l’UI Marché)
    serverNowISO, // horloge serveur (source de vérité)
    todayFr,      // “Aujourd’hui : mardi …”
    feed,         // tableau d’opportunités (peut rester [])
  };

  return new Response(JSON.stringify(body), { status: 200, headers: headers() });
}
