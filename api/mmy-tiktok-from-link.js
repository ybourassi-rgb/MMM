export const config = {
  runtime: "edge",
};

import OpenAI from "openai";

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Use POST with JSON body" }),
        { status: 405 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON body" }),
        { status: 400 }
      );
    }

    const { productUrl, extraInfo } = body;

    if (!productUrl) {
      return new Response(
        JSON.stringify({ ok: false, error: "productUrl is required" }),
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Tu es un expert TikTok qui crée des vidéos pour l’affiliation.
Génère un script clair, sans indications techniques (pas de VO, pas de plans), utilisable en voix off.

Lien produit : ${productUrl}
Infos supplémentaires : ${extraInfo || "aucune"}

Format JSON obligatoire :
{
  "hook": "...',
  "scenes": ["...", "...", "..."],
  "cta": "..."
}
    `.trim();

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const raw = response.output_text;
    let script;

    try {
      script = JSON.parse(raw);
    } catch {
      return new Response(
        JSON.stringify({ ok: true, mode: "raw", raw }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, mode: "json", script }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500 }
    );
  }
}
