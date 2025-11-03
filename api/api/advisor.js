export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée (POST requis)' });
  }

  const { prompt } = req.body || {};

  // Vérifier la clé API
  if (!process.env.MMM_Vercel_Key) {
    return res.status(500).json({ error: 'Clé MMM_Vercel_Key manquante sur Vercel' });
  }

  // Vérifier le prompt
  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ error: 'Prompt vide' });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MMM_Vercel_Key}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Tu es Money Motor Muslim, un conseiller stratégique et financier." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 300
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({ reply: data.choices[0].message.content });
    } else {
      return res.status(502).json({ error: "Aucune réponse générée par OpenAI", detail: data });
    }
  } catch (error) {
    console.error("Erreur advisor:", error);
    return res.status(500).json({ error: "Erreur serveur", message: String(error) });
  }
}
