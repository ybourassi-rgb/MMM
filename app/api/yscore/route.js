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

// petite fonction pour extraire un JSON même si OpenAI renvoie du texte autour
function extractJson(text = "") {
  if (!text) return null;

  // enlève ```json ``` ou ```
  const cleaned = text
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();

  // essaie direct
  try {
    return JSON.parse(cleaned);
  } catch {}

  // sinon on cherche le premier bloc {...}
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const slice = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
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
    const link = (body.link || "").trim();
    const summary = (body.summary || "").trim();
    const category = (body.category || "gen").trim();

    if (!link && !summary) {
      return json(
        { ok: false, error: "Missing link or summary" },
        400
      );
    }

    const prompt = `
Tu es le moteur Y-Score de Money Motor Y.
Analyse cette opportunité d'investissement et renvoie UNIQUEMENT un JSON valide, sans texte autour.

Données:
- Lien: ${link || "N/A"}
- Catégorie: ${category || "N/A"}
- Résumé: ${summary || "N/A"}

Tu dois calculer:
- globalScore: 0–100 (plus haut = meilleur deal)
- riskScore: 0–100 (plus haut = plus risqué)
- opportunityScore: 0–100 (potentiel de gain)
- halalScore: 0–100 (conformité halal)
- reasoning: explication courte, claire, en français

Contraintes:
- Renvoie uniquement ce JSON (pas de markdown, pas d'explication en plus).
- Les scores doivent être des nombres entiers (0–100).

Format EXACT attendu :
{
  "globalScore": 0,
  "riskScore": 0,
  "opportunityScore": 0,
  "halalScore": 0,
  "reasoning": "texte..."
}
`.trim();

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return json({ ok: false, error: "openai_error", raw: t }, 500);
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || "";
    const parsed = extractJson(text);

    if (!parsed) {
      return json(
        { ok: false, error: "parse_failed", raw: text },
        500
      );
    }

    // normalisation ultra safe
    const safeInt = (v) =>
      Number.isFinite(Number(v))
        ? Math.max(0, Math.min(100, Math.round(Number(v))))
        : 0;

    const result = {
      ok: true,
      globalScore: safeInt(parsed.globalScore),
      riskScore: safeInt(parsed.riskScore),
      opportunityScore: safeInt(parsed.opportunityScore),
      halalScore: safeInt(parsed.halalScore),
      reasoning: String(parsed.reasoning || "").slice(0, 500),
      link: link || null,
      category,
      ts: Date.now(),
    };

    return json(result, 200);
  } catch (err) {
    console.error("Erreur API Y-Score:", err);
    return json(
      { ok: false, error: "yscore_internal_error", msg: err?.message },
      500
    );
  }
}
