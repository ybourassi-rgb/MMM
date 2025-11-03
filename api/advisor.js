// /api/advisor.js
export default async function handler(req, res) {
  // --- CORS de base ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // --- Clé API via variables d'env ---
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MMM_Vercel_Key ||
      process.env.MMM_Vercel_KEY ||
      process.env.MoneyMotorY;

    if (!OPENAI_KEY) {
      return res.status(500).json({ ok: false, error: "Clé API OpenAI manquante." });
    }

    // --- Récupération du prompt (GET ou POST) ---
    const promptFromGet  = (req.query?.prompt ?? "").toString();
    const promptFromPost = (req.body?.prompt ?? "").toString();
    const text = (promptFromPost || promptFromGet).trim();

    if (!text) {
      return res.status(400).json({ ok: false, error: "Prompt vide (aucun texte fourni)." });
    }

    // --- Appel OpenAI ---
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
              "Tu es Money Motor Muslim (Money Motor Y), conseiller stratégique et financier. " +
              "Réponds de façon concrète, actionnable, halal-friendly (investissement, enchères, revente, patrimoine).",
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ ok: false, error: `Erreur API OpenAI: ${err}` });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "Pas de réponse.";
    return res.status(200).json({ ok: true, reply });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || "Erreur interne" });
  }
}
