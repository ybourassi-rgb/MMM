// /api/advisor.js
export default async function handler(req, res) {
  // --- 🔐 Sécurité CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    // --- 🧠 Récupération du prompt envoyé par le client ---
    const { prompt } = req.body || {};
    const text = String(prompt || "").trim();
    if (!text) {
      return res.status(400).json({ ok: false, error: "Prompt vide" });
    }

    // 🔴 --- PLACE TA LIGNE ICI ---
    const OPENAI_KEY = process.env.MMM_VERCEL_KEY || process.env.MMM_Vercel_Key;
    // 🔴 ---------------------------

    if (!OPENAI_KEY) {
      return res.status(500).json({
        ok: false,
        error:
          "Clé API manquante. Définis la variable d’environnement MMM_VERCEL_KEY dans Vercel.",
      });
    }

    // --- 🌐 Appel à l’API OpenAI ---
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Tu es Money Motor Muslim (Money Motor Y), un conseiller stratégique et financier. Tu donnes des réponses concrètes, licites et actionnables.",
          },
          { role: "user", content: text },
        ],
        temperature: 0.6,
      }),
    });

    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      return res
        .status(502)
        .json({ ok: false, error: "Erreur OpenAI", details: errBody });
    }

    const data = await r.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      data?.choices?.[0]?.text?.trim() ||
      "";

    if (!reply) {
      return res.status(200).json({
        ok: true,
        reply: "(Pas de réponse générée)",
      });
    }

    return res.status(200).json({ ok: true, reply });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: "Erreur serveur",
      details: String(e?.message || e),
    });
  }
}
