export default async function handler(req, res) {
  // 🧱 Anti-cache global
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  // 🔐 Autorisations CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });

  try {
    // 🔑 Lecture de la clé API
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY)
      return res.status(500).json({ ok: false, error: 'Clé API OpenAI manquante.' });

    const { prompt } = req.body || {};
    if (!prompt || !prompt.trim())
      return res.status(400).json({ ok: false, error: 'Prompt vide.' });

    // 🤖 Appel à OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Tu es Money Motor Muslim (alias Money Motor Y), un conseiller stratégique et financier. ' +
              'Tu donnes des réponses précises, concrètes et exploitables, notamment pour les investissements, enchères et reventes halal.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erreur API OpenAI: ${errText}`);
    }

    const data = await response.json();
    const answer =
      data?.choices?.[0]?.message?.content?.trim() || '⚠️ Aucune réponse reçue.';

    res.status(200).json({ ok: true, reply: answer });
  } catch (error) {
    console.error('Erreur advisor.js:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Erreur interne du serveur',
    });
  }
}
