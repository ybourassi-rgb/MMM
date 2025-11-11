// /api/status.js
export const config = { runtime: 'edge' };

export default async function handler() {
  try {
    // Vérifie plusieurs noms possibles + fallback via import.meta.env (Edge compat)
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key ||
      import.meta.env?.OPENAI_API_KEY ||
      import.meta.env?.MoneyMotorY ||
      import.meta.env?.MMM_Vercel_Key ||
      '';

    const hasKey = OPENAI_KEY && OPENAI_KEY.length > 10;

    const data = {
      ok: true,
      hasOpenAI: hasKey,
      status: hasKey ? '✅ Clé OpenAI détectée' : '❌ Clé manquante',
      checkedAt: new Date().toISOString(),
      env: {
        openai_key_present: hasKey,
        upstash: !!process.env.UPSTASH_REST_URL,
        affiliator_mode: process.env.AFFILIATOR_MODE || 'default',
      },
    };

    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
