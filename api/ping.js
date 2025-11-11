// /api/ping.js
export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const OPENAI = !!(
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key
    );
    const UPSTASH = !!(
      process.env.UPSTASH_REST_URL &&
      process.env.UPSTASH_REST_TOKEN
    );

    return new Response(
      JSON.stringify({
        ok: true,
        message: "✅ API opérationnelle",
        env: {
          openaiKey: OPENAI ? "✅ détectée" : "❌ manquante",
          upstash: UPSTASH ? "✅ détecté" : "❌ manquant",
          runtime: "edge",
          timestamp: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e.message || "Erreur interne",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
