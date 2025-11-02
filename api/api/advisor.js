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
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Tu es Money Motor Muslim, un conseiller stratégique et financier." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();

  if (data.choices && data.choices.length > 0) {
    return res.status(200).json({ reply: data.choices[0].message.content });
  } else {
    return res.status(500).json({ reply: "Erreur : aucune réponse générée." });
  }
} catch (error) {
  return res.status(500).json({ reply: "Erreur serveur : " + error.message });
}
