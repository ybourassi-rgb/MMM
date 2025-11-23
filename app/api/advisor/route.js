// app/api/advisor/route.js

export const runtime = "edge"; // tu peux enlever si tu veux du Node runtime

export async function POST(req) {
  try {
    // Récupération de la clé OpenAI depuis plusieurs env possibles
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return Response.json(
        { ok: false, error: "Clé API OpenAI manquante." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Lecture du body JSON
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const prompt = (body.prompt || "").trim();

    if (!prompt) {
      return Response.json(
        { ok: false, error: "Prompt vide." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
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
      return Response.json(
        { ok: false, error: `OpenAI: ${t}` },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = await r.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() || "Aucune réponse.";

    return Response.json(
      { ok: true, reply },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return Response.json(
      { ok: false, error: e?.message || "Erreur interne" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
