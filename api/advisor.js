// api/advisor.js — version Edge, JSON fiable + CORS + no-cache
export const config = { runtime: "edge" };

function headers() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers: headers() });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Méthode non autorisée" }), { status: 405, headers: headers() });
  }

  try {
    const envKey = process.env.OPENAI_API_KEY || process.env.MoneyMotorY || process.env.MMM_Vercel_Key;
    if (!envKey || envKey.length < 10) {
      return new Response(JSON.stringify({ ok: false, error: "Clé API OpenAI manquante." }), { status: 500, headers: headers() });
    }

    // Parse body (Edge)
    let body;
    try { body = await req.json(); } catch { body = {}; }
    const prompt = (body?.prompt || "").trim();
    if (!prompt) {
      return new Response(JSON.stringify({ ok: false, error: "Prompt vide." }), { status: 400, headers: headers() });
    }

    // Appel OpenAI
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${envKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          { role: "system", content:
            "Tu es Money Motor Y, conseiller d’investissement. Réponds de façon concise et actionnable (plan d’action + chiffres)."
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const raw = await r.text();
    if (!r.ok) {
      return new Response(JSON.stringify({ ok: false, error: `Erreur OpenAI: ${raw.slice(0,400)}` }), { status: 502, headers: headers() });
    }
    let data; try { data = JSON.parse(raw); } catch { data = {}; }
    const answer = data?.choices?.[0]?.message?.content?.trim() || "⚠️ Aucune réponse reçue.";

    return new Response(JSON.stringify({ ok: true, reply: answer }), { status: 200, headers: headers() });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Erreur interne" }), { status: 500, headers: headers() });
  }
}
