// /api/advisor.js
export default async function handler(req, res) {
  // 1) Méthode requise
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée (POST requis)" });
  }

  // 2) Corps JSON
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: "Prompt vide" });
  }

  // 3) Clé API
  const key = process.env.MMM_Vercel_Key;
  if (!key) {
    return res.status(500).json({ error: "Clé MMM_Vercel_Key manquante sur Vercel" });
  }

  try {
    // 4) Appel OpenAI (Chat Completions classique)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        // Choisis un modèle disponible sur ton compte.
        // "gpt-3.5-turbo" est sûr pour commencer.
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Tu es Money Motor Y, un conseiller stratégique et financier, éthique et pragmatique. " +
              "Tu réponds de façon concise, actionnable, avec étapes et chiffres réalistes quand c’est pertinent."
          },
          { role: "user", content: String(prompt) }
        ],
        temperature: 0.5,
        max_tokens: 500
      }),
    });

    // 5) Lecture de la réponse
    const data = await response.json();

    // Erreur côté OpenAI → on renvoie le détail
    if (!response.ok) {
      const message = data?.error?.message || `Erreur OpenAI (${response.status})`;
      return res.status(502).json({ error: message, detail: data });
    }

    // Réponse OK
    const reply = data?.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({ reply: reply || "(réponse vide)" });
  } catch (err) {
    // 6) Sécurité
    console.error("Erreur /api/advisor:", err);
    return res.status(500).json({ error: "Erreur serveur", message: String(err) });
  }
}
