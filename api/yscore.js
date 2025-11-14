// API Y-Score pour MMM / MMY
// Route Vercel: POST https://mmm-alpha-one.vercel.app/api/yscore

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Use POST" });
    return;
  }

  try {
    const { link, summary, category } = req.body || {};

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ ok: false, error: "Missing OPENAI_API_KEY" });
      return;
    }

    const prompt = `
Tu es le moteur Y-Score de Money Motor Y.
Analyse cette opportunité d'investissement et renvoie UNIQUEMENT du JSON valide.

Données:
- Lien: ${link || "N/A"}
- Catégorie: ${category || "N/A"}
- Résumé: ${summary || "N/A"}

Calcule:
- globalScore: score global de 0 à 100 (plus haut = meilleur)
- riskScore: risque de 0 à 100 (plus haut = plus risqué)
- opportunityScore: potentiel de gain de 0 à 100
- halalScore: conformité halal de 0 à 100
- reasoning: explication courte en français

Réponds UNIQUEMENT avec un JSON de la forme:

{
  "globalScore": 0,
  "riskScore": 0,
  "opportunityScore": 0,
  "halalScore": 0,
  "reasoning": "texte..."
}
    `.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
      }),
    });

    const data = await response.json();

    const text =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Erreur parse JSON Y-Score:", e, text);
      res.status(500).json({ ok: false, error: "parse_failed", raw: text });
      return;
    }

    // On s'assure qu'il y a bien globalScore pour l'agent
    if (typeof parsed.globalScore !== "number") {
      parsed.globalScore = 0;
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Erreur API Y-Score:", err);
    res.status(500).json({ ok: false, error: "yscore_internal_error" });
  }
};
