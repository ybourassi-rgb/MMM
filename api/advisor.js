export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prompt } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es Money Motor Y, une IA experte en finances, automobile et stratégie d’investissement. Tu aides les utilisateurs à analyser des opportunités d’achat, d’enchères et d’investissement au Maroc et ailleurs." },
          { role: "user", content: prompt || "Bonjour Money Motor Y" }
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    res.status(200).json({ reply: data.choices?.[0]?.message?.content || "Pas de réponse reçue." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur de connexion à l’API OpenAI." });
  }
}
