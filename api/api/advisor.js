export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prompt } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Clé API OpenAI manquante' });
  }

  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ error: 'Prompt vide' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Tu es un conseiller financier intelligent et bienveillant.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Erreur API OpenAI');
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || 'Pas de réponse reçue.';
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Erreur advisor:', error);
    return res.status(500).json({ error: error.message });
  }
}
