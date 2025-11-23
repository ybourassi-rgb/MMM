// app/api/advisor_stream/route.js

export const runtime = "edge";

export async function POST(req) {
  try {
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

    const body = await req.json().catch(() => ({}));
    const prompt = (body.prompt || "").trim();

    if (!prompt) {
      return Response.json(
        { ok: false, error: "Prompt vide." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

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
              "Tu es Money Motor Y, conseiller stratégique d’investissement. Réponds en français avec: 1) Verdict chiffré (score/€/%), 2) Risques clés, 3) Plan d’action clair et exploitable en étapes.",
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
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e) {
    return Response.json(
      { ok: false, error: e?.message || "Erreur interne" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
