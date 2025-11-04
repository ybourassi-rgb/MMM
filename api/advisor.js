export const config = { runtime: "edge" };

export default async function handler(req) {
  const headers = {
    "Cache-Control":"no-store, no-cache, must-revalidate",
    "Pragma":"no-cache","Expires":"0",
    "CDN-Cache-Control":"no-store","Vercel-CDN-Cache-Control":"no-store",
    "Content-Type":"application/json; charset=utf-8"
  };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok:false, error:'Méthode non autorisée' }), { status:405, headers });
  }

  try {
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return new Response(JSON.stringify({ ok:false, error:'Clé API OpenAI manquante.' }), { status:500, headers });
    }

    const { prompt } = await req.json();
    if (!prompt || !String(prompt).trim()) {
      return new Response(JSON.stringify({ ok:false, error:'Prompt vide.' }), { status:400, headers });
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        messages: [
          { role:'system', content: 'Tu es Money Motor Y, un conseiller stratégique d’investissement. Tu donnes des réponses chiffrées, concrètes, actionnables, pour arbitrer achat/vente, enchères, revente, et gestion du risque.' },
          { role:'user', content: String(prompt) }
        ]
      })
    });

    const raw = await r.text();
    if (!r.ok) {
      let err = raw;
      try { err = JSON.parse(raw).error?.message || raw; } catch {}
      throw new Error('Erreur API OpenAI: ' + err);
    }

    let data; try { data = JSON.parse(raw); } catch { throw new Error('Réponse OpenAI invalide'); }
    const answer = data?.choices?.[0]?.message?.content?.trim() || '⚠️ Aucune réponse reçue.';
    return new Response(JSON.stringify({ ok:true, reply: answer }), { status:200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: e.message || 'Erreur interne' }), { status:500, headers });
  }
}
