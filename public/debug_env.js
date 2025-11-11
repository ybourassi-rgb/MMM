


// api/debug_env.js
export const config = { runtime: "edge" };

// masque les secrets: garde 4 premiers/derniers caractères
const mask = (v) => {
  if (!v) return null;
  const s = String(v);
  if (s.length <= 8) return "*".repeat(s.length);
  return s.slice(0, 4) + "…" + s.slice(-4);
};

export default async function handler() {
  const env = process.env.VERCEL_ENV || "production";

  // récupère les valeurs telles que l'app les lit
  const OPENAI_API_KEY       = process.env.OPENAI_API_KEY || null;
  const UPSTASH_REST_URL     = process.env.UPSTASH_REST_URL || null;
  const UPSTASH_REST_TOKEN   = process.env.UPSTASH_REST_TOKEN || null;

  // variantes parfois utilisées par erreur
  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || null;

  const body = {
    ok: true,
    env,
    // booléens utiles
    hasOpenAIKey: !!OPENAI_API_KEY,
    hasUpstashKV: !!(UPSTASH_REST_URL && UPSTASH_REST_TOKEN),
    // aperçu masqué (pour vérifier qu'une valeur existe sans la révéler)
    preview: {
      OPENAI_API_KEY: mask(OPENAI_API_KEY),
      UPSTASH_REST_URL: mask(UPSTASH_REST_URL),
      UPSTASH_REST_TOKEN: mask(UPSTASH_REST_TOKEN),
      // champs “pièges” fréquemment utilisés par erreur
      UPSTASH_REDIS_REST_URL: mask(UPSTASH_REDIS_REST_URL)
    },
    ts: Date.now()
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
