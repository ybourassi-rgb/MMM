// api/advisor.js
export default async function handler(req, res) {
  // CORS minimal
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Méthode non autorisée" });
  }

  try {
    // 1) Clé API (aucune clé en dur)
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return res.status(500).json({
        ok: false,
        error:
          "Clé API OpenAI manquante. Définis OPENAI_API_KEY (ou MoneyMotorY / MMM_Vercel_Key) dans Vercel → Settings → Environment Variables.",
      });
    }

    // 2) Lecture du prompt
    const { prompt } = (req.body || {});
    const text = (prompt || "").trim();
    if (!text) {
      return res
        .status(400)
        .json({ ok: false, error: "Prompt vide (aucun texte fourni)." });
    }

    // 3) Appel OpenAI
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              "Tu es Money Motor Muslim (alias Money Motor Y), conseiller stratégique & financier halal-friendly. " +
              "Réponds en français, de façon concrète, actionnable, structurée (titres courts, puces), sans jargon inutile.",
          },
          { role: "user", content: text },
        ],
      }),
    });

    // 4) Gestion des erreurs OpenAI
    if (!r.ok) {
      const err = await r.text();
      return res.status(r.status).json({
        ok: false,
        error: `Erreur API OpenAI: ${err}`,
      });
    }

    const data = await r.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ Pas de contenu renvoyé par l'IA.";

    // 5) Réponse JSON (le front fera le rendu propre)
    res.status(200).json({ ok: true, reply });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || "Erreur serveur" });
  }
}
