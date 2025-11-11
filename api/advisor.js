// /api/advisor.js
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  try {
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return res.status(500).json({ ok: false, error: 'Clé API OpenAI manquante.' });
    }

    const body = req.body || {};
    const prompt = (body.prompt || '').trim();
    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'Prompt vide.' });
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
          {
            role: 'system',
            content:
              "Tu es Money Motor Y, un conseiller stratégique d’investissement. Fournis un verdict chiffré + plan d’action clair et exploitable. Réponds en français avec concision.",
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Erreur OpenAI: ${t}`);
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'Aucune réponse.';

    return res.status(200).json({ ok: true, reply });
  } catch (e) {
    console.error('[Advisor error]', e);
    return res.status(500).json({ ok: false, error: e.message || 'Erreur interne' });
  }
}
