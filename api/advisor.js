// /api/advisor.js
export const config = { runtime: 'edge' };

function headers(ct = 'application/json; charset=utf-8') {
  return {
    'Content-Type': ct,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default async function handler(req) {
  // Préflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: headers() });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok:false, error:'Méthode non autorisée' }), { status:405, headers: headers() });
  }

  try {
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_KEY ||            // alias possible
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return new Response(JSON.stringify({ ok:false, error:'Clé API OpenAI manquante.' }), { status:500, headers: headers() });
    }

    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const prompt = (body?.prompt || '').trim();
    if (!prompt) {
      return new Response(JSON.stringify({ ok:false, error:'Prompt vide.' }), { status:400, headers: headers() });
    }

    // Timeout doux (évite que l’UI reste bloquée)
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000);

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        messages: [
          {
            role: 'system',
            content:
              "Tu es Money Motor Y, un conseiller stratégique d’investissement. " +
              "Réponds brièvement et actionnablement avec : Verdict (chiffré), Risques, Plan d’action. " +
              "Si l’utilisateur fournit des liens (annonce, article…), garde-les tels quels dans ta réponse (ne les modifie pas)."
          },
          { role: 'user', content: prompt },
        ],
      }),
    }).catch(e => ({ ok:false, statusText: String(e) }));

    clearTimeout(to);

    if (!r || !r.ok) {
      const t = r?.text ? await r.text() : (r?.statusText || 'Erreur OpenAI');
      return new Response(JSON.stringify({ ok:false, error:`OpenAI: ${t}` }), { status:502, headers: headers() });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'Aucune réponse.';

    return new Response(JSON.stringify({ ok:true, reply }), { status:200, headers: headers() });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: e?.message || 'Erreur interne' }), { status:500, headers: headers() });
  }
}
