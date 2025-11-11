// /api/advisor.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Méthode non autorisée' }),
      { status: 405, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Clé API OpenAI manquante.' }),
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const prompt = (body.prompt || '').trim();
    if (!prompt) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Prompt vide.' }),
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // ✅ Date actuelle, format FR (ex: "mardi 11 novembre 2025")
    const todayFr = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // ✅ Contrainte explicite pour empêcher les dates inventées
    const systemMsg =
      `Tu es Money Motor Y, un conseiller stratégique d’investissement. ` +
      `Donne un verdict chifré + plan d’action clair et exploitable. ` +
      `Aujourd’hui, nous sommes le ${todayFr}. ` +
      `Si on te demande la date (ou si tu dois situer "aujourd'hui"), ` +
      `utilise exactement cette date et ne l’invente jamais. ` +
      `Si l’utilisateur te donne une date différente, corrige-le poliment.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: prompt },
        ],
      }),
      // (optionnel) aucune importance pour l'appel sortant, mais explicite
      cache: 'no-store',
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`OpenAI: ${t}`);
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'Aucune réponse.';

    // ✅ Pas de cache HTTP côté client/CDN
    return new Response(
      JSON.stringify({ ok: true, today: todayFr, reply }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message || 'Erreur interne' }),
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
