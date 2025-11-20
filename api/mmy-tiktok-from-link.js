// pages/api/mmy-tiktok-from-link.js

// On reste en Edge pour être compatible avec le reste de ton API
export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Utilise POST avec un JSON { url }" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  try {
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "Clé OpenAI manquante." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const url = (body.url || body.productUrl || "").trim();

    if (!url) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Champ 'url' ou 'productUrl' manquant dans le body.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    const prompt = `
Tu es un créateur TikTok spécialisé dans les vidéos d'unboxing et de présentation produit SANS visage.

À partir de ce lien produit :

${url}

Génère un plan de vidéo TikTok au format JSON STRICT :

{
  "productUrl": "...",
  "style": "A_UNBOXING_NO_FACE",
  "hook": "...",
  "overlayScreens": ["...", "...", "..."],
  "tiktokDescription": "...",
  "hashtags": ["...", "...", "..."]
}

Contraintes :
- Réponds UNIQUEMENT avec un JSON valide, pas de texte autour.
- "overlayScreens" : 3 à 4 phrases courtes, affichées à l'écran.
- "tiktokDescription" : 2 lignes max, avec appel à l'action "Lien en bio".
- "hashtags" : liste de 5 à 10 hashtags pertinents en français et anglais.
`.trim();

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "Tu es un planificateur de contenu TikTok. Tu produis UNIQUEMENT du JSON valide.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      throw new Error(`OpenAI error: ${text}`);
    }

    const data = await r.json();
    const raw =
      data?.choices?.[0]?.message?.content?.trim() || '{"error":"empty"}';

    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      // Si le modèle a ajouté du texte autour, on essaye d’extraire le JSON
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Réponse OpenAI non parsable en JSON.");
      json = JSON.parse(match[0]);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        plan: json,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e?.message || "Erreur interne mmy-tiktok-from-link",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
}
