// /api/advisor_node.js
export const config = { runtime: 'nodejs' }; // ✅ serverless Node (pas Edge)

function setHeaders(res, ct = 'application/json; charset=utf-8') {
  res.setHeader('Content-Type', ct);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Méthode non autorisée' });

  try {
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key || '';

    if (!OPENAI_KEY || OPENAI_KEY.length < 12) {
      return res.status(500).json({ ok:false, error:'Clé API OpenAI manquante.' });
    }

    // Lecture body robuste (selon Vercel, req.body peut être string ou objet)
    let body = {};
    try {
      if (typeof req.body === 'string') body = JSON.parse(req.body);
      else body = req.body || {};
    } catch { body = {}; }

    const prompt = (body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ ok:false, error:'Prompt vide.' });

    // Appel OpenAI (avec timeout)
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 15000);

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
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
              'Tu es Money Motor Y, conseiller stratégique d’investissement. ' +
              'Réponds brièvement avec : Verdict (chiffré), Risques, Plan d’action. ' +
              'Si l’utilisateur fournit des liens (annonce, article…), garde-les tels quels.'
          },
          { role: 'user', content: prompt },
        ],
      }),
    }).catch(e => ({ ok:false, statusText:String(e) }));

    clearTimeout(to);

    if (!r || !r.ok) {
      const t = r?.text ? await r.text() : (r?.statusText || 'Erreur OpenAI');
      return res.status(502).json({ ok:false, error:`OpenAI: ${t}` });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'Aucune réponse.';

    return res.status(200).json({ ok:true, reply });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e?.message || e) });
  }
}
