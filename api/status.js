// /api/status.js
export const config = { runtime: 'edge' };

export default async function handler() {
  try {
    // Détection multi-noms (OpenAI, MoneyMotorY, MMM, etc.)
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key ||
      process.env.OPENAI_KEY ||
      '';

    const hasKey = OPENAI_KEY && OPENAI_KEY.length > 10;

    // Exemple de statut du système
    const status = {
      ok: true,
      hasOpenAI: hasKey,
      time: new Date().toISOString(),
      env: {
        openai_key_present: hasKey,
        upstash_url: !!process.env.UPSTASH_REST_URL,
        telegram_auto: !!process.env.TELEGRAM_BOT_TOKEN_AUTO,
        affiliator_mode: process.env.AFFILIATOR_MODE || 'default',
      },
    };

    return new Response(JSON.stringify(status, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
