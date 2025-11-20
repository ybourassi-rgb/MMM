/**
 * API MMY — Générateur de script TikTok à partir d’un lien Amazon/AliExpress
 */

import { OPENAI_API_KEY } from "../../lib/env";

export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing ?url=" }),
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing OPENAI_API_KEY" }),
        { status: 500 }
      );
    }

    // Appel OpenAI : génère un script TikTok EN TEXTE SIMPLE
    const prompt = `
      Génère un script TikTok viral pour ce produit :
      URL : ${url}

      Donne :
      - un HOOK très fort (2 secondes)
      - 3 phrases simples pour la voix off
      - un CTA dynamique

      Réponds en JSON :
      {
        "hook": "...",
        "lines": ["...", "...", "..."],
        "cta": "..."
      }
    `.trim();

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: prompt
      })
    });

    const data = await res.json();
    let text = data.output_text || "";

    return new Response(
      JSON.stringify({ ok: true, script: JSON.parse(text) }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500 }
    );
  }
}
