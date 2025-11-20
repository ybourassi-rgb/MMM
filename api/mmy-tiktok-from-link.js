// api/mmy-tiktok-from-link.js
// Génère un plan de vidéo TikTok à partir d’un lien produit (Amazon, AliExpress, etc.)

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // On n’accepte que POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "Use POST with JSON body" });
  }

  // Lecture du body
  let body;
  try {
    body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }

  const { productUrl, extraInfo } = body;

  if (!productUrl) {
    return res
      .status(400)
      .json({ ok: false, error: "Field 'productUrl' is required" });
  }

  const prompt = `
Tu es un expert TikTok qui crée des vidéos d'affiliation.
Génère un plan de vidéo au format JSON **SANS INDICATIONS TECHNIQUES** (pas de "VO", pas de timings, pas de "gros plan", etc.).

Données :
- Lien produit : ${productUrl}
- Contexte / infos en plus (optionnel) : ${extraInfo || "aucun"}

Règles :
- Style : unboxing / test produit SANS visage
- Durée cible : 25-40 secondes
- Ton : simple, dynamique, concret
- Le texte doit être directement utilisable pour une voix off.

Format JSON STRICT :
{
  "hook": "Phrase d'accroche très courte",
  "scenes": [
    "Texte continu de voix off pour la scène 1",
    "Texte continu de voix off pour la scène 2",
    "Texte continu de voix off pour la scène 3"
  ],
  "cta": "Phrase finale pour inciter à cliquer sur le lien en bio"
}
  `.trim();

  try {
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const raw = response.output_text;
    let data;

    try {
      data = JSON.parse(raw);
    } catch (e) {
      // Si le modèle renvoie un texte pas 100% JSON, on renvoie brut
      return res.status(200).json({
        ok: true,
        mode: "raw",
        raw,
      });
    }

    return res.status(200).json({
      ok: true,
      mode: "json",
      script: data,
      productUrl,
    });
  } catch (err) {
    console.error("mmy-tiktok-from-link error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Unknown error",
    });
  }
}
