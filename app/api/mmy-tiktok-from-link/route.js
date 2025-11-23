import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// extrait un JSON même si la réponse contient du texte autour
function extractJson(text = "") {
  if (!text) return null;

  const cleaned = text
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1));
    } catch {}
  }
  return null;
}

export async function POST(req) {
  try {
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return json({ ok: false, error: "Missing OPENAI_API_KEY" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const url = (body.url || body.productUrl || "").trim();

    if (!url) {
      return json(
        { ok: false, error: "Body missing 'url' or 'productUrl'." },
        400
      );
    }

    const prompt = `
Tu es un créateur TikTok spécialisé dans les vidéos d'unboxing et présentation produit SANS visage.

Lien produit :
${url}

Génère un plan de vidéo TikTok au format JSON STRICT :

{
  "productUrl": "...",
  "style": "A_UNBOXING_NO_FACE",
  "hook": "...",
  "overlayScreens": ["...", "...", "..."],
  "tiktokDescription": "...",
  "hashtags": ["...", "..."]
}

Contraintes :
- Réponds UNIQUEMENT avec un JSON valide.
- overlayScreens : 3 à 4 phrases courtes punchy.
- tiktokDescription : 2 lignes max + "Lien en bio".
- hashtags : 5 à 10 hashtags FR + EN, pertinents.
- Ton direct, vendeur, naturel, sans blabla inutile.
`.trim();

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "Tu es un planificateur de contenu TikTok. Tu renvoies UNIQUEMENT du JSON valide.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return json({ ok: false, error: "openai_error", raw: t }, 500);
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    const plan = extractJson(raw);

    if (!plan) {
      return json(
        { ok: false, error: "parse_failed", raw },
        500
      );
    }

    // normalisation soft (au cas où)
    plan.productUrl = plan.productUrl || url;
    plan.style = plan.style || "A_UNBOXING_NO_FACE";
    plan.overlayScreens = Array.isArray(plan.overlayScreens)
      ? plan.overlayScreens.slice(0, 4)
      : [];
    plan.hashtags = Array.isArray(plan.hashtags)
      ? plan.hashtags.slice(0, 12)
      : [];

    return json({ ok: true, plan, ts: Date.now() }, 200);
  } catch (e) {
    console.error("mmy-tiktok-from-link error:", e);
    return json(
      { ok: false, error: e?.message || "internal_error" },
      500
    );
  }
}
