// pages/api/advisor.js

export default async function handler(req, res) {
  // Autoriser uniquement POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Méthode non autorisée" });
  }

  try {
    // Récupération de la clé OpenAI depuis plusieurs env possibles
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return res
        .status(500)
        .json({ ok: false, error: "Clé API OpenAI manquante." });
    }

    // Lecture du body JSON (Next remplit déjà req.body)
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const prompt = (body.prompt || "").trim();

    if (!prompt) {
      return res
        .status(400)
        .json({ ok: false, error: "Prompt vide." });
    }

    // Appel OpenAI (via fetch)
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
              "Tu es Money Motor Y, conseiller stratégique d’investissement. Réponds en français avec : 1) un verdict chiffré (score/€/%), 2) les risques clés, 3) un plan d’action clair et exploitable en étapes.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`OpenAI: ${t}`);
    }

    const data = await r.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() || "Aucune réponse.";

    res
      .status(200)
      .setHeader("Cache-Control", "no-store")
      .json({ ok: true, reply });
  } catch (e) {
    res
      .status(500)
      .json({ ok: false, error: e?.message || "Erreur interne" });
  }
}
