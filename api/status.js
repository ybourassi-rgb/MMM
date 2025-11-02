export default async function handler(req, res) {
  try {
    const { prompt } = req.body || { prompt: "Bonjour Money Motor Y 👋" };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es Money Motor Y, l'assistant IA stratégique et financier de Yassine Bourassi. Tes réponses doivent être claires, précises et utiles." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    res.status(200).json({ reply: data.choices?.[0]?.message?.content || "Aucune réponse reçue." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur de serveur IA" });
  }
}
