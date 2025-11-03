// /api/advisor.js
export default async function handler(req, res) {
  // CORS (autorise tous les domaines — mets ton domaine si besoin)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Préflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // Anti-cache
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const { prompt } = req.body || {};
    const text = String(prompt || "").trim();
    if (!text) {
      return res.status(400).json({ ok: false, error: "Prompt vide" });
    }

    const OPENAI_KEY = process.env.MMM_VERCEL_KEY || process.env.MMM_Vercel_Key;
    if (!OPENAI_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Clé API manquante. Définis la variable d’environnement MMM_VERCEL_KEY dans Vercel.",
      });
    }

    // Appel OpenAI (Chat Completions)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        // Tu peux remplacer par un autre modèle si besoin
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Tu es Money Motor Muslim (Money Motor Y), un conseiller stratégique et financier. Tu donnes des réponses concrètes, licites, et actionnables.",
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
    return res
      .status(500)
      .json({ ok: false, error: "Erreur serveur", details: String(e?.message || e) });
  }
}
