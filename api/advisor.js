// /api/advisor.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok:false, error:'Méthode non autorisée' }), { status:405 });
  }

  try {
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return new Response(JSON.stringify({ ok:false, error:'Clé API OpenAI manquante.' }), { status:500 });
    }

    const body = await req.json().catch(()=> ({}));
    const prompt = (body.prompt || '').trim();
    if (!prompt) {
      return new Response(JSON.stringify({ ok:false, error:'Prompt vide.' }), { status:400 });
    }

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
          { role: 'system', content: 'Tu es Money Motor Y, un conseiller stratégique d’investissement. Donne un verdict chiffré + plan d’action clair et exploitable.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`OpenAI: ${t}`);
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'Aucune réponse.';

    return new Response(JSON.stringify({ ok:true, reply }), { status:200, headers:{ 'Content-Type':'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: e.message || 'Erreur interne' }), { status:500 });
  }
}
