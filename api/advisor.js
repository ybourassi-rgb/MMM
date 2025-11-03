export default async function handler(req, res) {
  // Autorisations CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 🔑 Clés d’environnement disponibles
    const OPENAI_KEY =
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key ||
      process.env.OPENAI_API_KEY;

    if (!OPENAI_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Clé API OpenAI manquante sur le serveur.",
      });
    }

    // 🧠 Lecture du texte envoyé par l’utilisateur
    const { prompt } = req.body || {};
    const text = (prompt || "").trim();
    if (!text) {
      return res
        .status(400)
        .json({ ok: false, error: "Prompt vide (aucun texte fourni)." });
    }

    // ⚙️ Appel à l’API OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Tu es Money Motor Muslim (alias Money Motor Y), un conseiller stratégique et financier. " +
              "Tu aides à optimiser les investissements, les enchères, les reventes et la gestion de patrimoine halal.",
          },
          { role: "user", content: text },
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
      data?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ Aucune réponse reçue de l’IA.";

    res.status(200).json({ ok: true, reply: answer });
  } catch (error) {
    console.error("Erreur advisor.js:", error);
    res.status(500).json({
      ok: false,
      error: error.message || "Erreur interne du serveur",
    });
  }
}
