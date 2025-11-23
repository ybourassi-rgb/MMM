// app/api/image-fallback/route.js
export const runtime = "edge";

/**
 * MMM Image Fallback
 * - GET /api/image-fallback?q=xxx&meta=yyy
 * - utilise Upstash REST si dispo
 * - renvoie une image de secours "illustration"
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function clean(q, max = 120) {
  return String(q || "").replace(/\s+/g, " ").trim().slice(0, max);
}

// ---------- Upstash KV (REST) ----------
const REST_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.UPSTASH_REST_URL ||
  "";
const REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.UPSTASH_REST_TOKEN ||
  "";

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 jours

async function cacheGet(key) {
  if (!REST_URL || !REST_TOKEN) return null;
  try {
    const r = await fetch(`${REST_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REST_TOKEN}` },
      cache: "no-store",
    }).then((x) => x.json());

    if (!r?.result) return null;
    return JSON.parse(r.result);
  } catch {
    return null;
  }
}

async function cacheSet(key, payload) {
  if (!REST_URL || !REST_TOKEN) return;
  try {
    await fetch(`${REST_URL}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: payload,
        ex: CACHE_TTL_SECONDS,
      }),
      cache: "no-store",
    });
  } catch {
    // non bloquant
  }
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

// ---------- IA / Placeholder ----------
async function generate3DCard(q, meta) {
  /**
   * TODO 2026:
   * - brancher un provider d’image (OpenAI Images / Replicate / other)
   * - ou générer une carte dynamique interne (Canvas/OG)
   *
   * Pour l’instant, placeholder propre + lisible.
   */
  const text = encodeURIComponent(clean(q, 40));
  const sub = encodeURIComponent(clean(meta, 28));
  return `https://dummyimage.com/900x600/0a0a0a/ffffff&text=${text}%0A${sub}`;
}

// ---------- Handler ----------
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = clean(searchParams.get("q"));
    const meta = clean(searchParams.get("meta"), 200);

    if (!q) return json({ ok: false, error: "missing_q" }, 400);

    const key = "image:fallback:" + hash(q);

    // 1) cache lookup
    const cached = await cacheGet(key);
    if (cached) {
      return json({ ok: true, ...cached, cached: true });
    }

    // 2) génération fallback
    const imageUrl = await generate3DCard(q, meta);

    const payload = {
      source: "ai-fallback",
      imageUrl,
      style: "3d-card",
      warning: "illustration",
      confidence: 0.55,
      q,
      meta,
      ts: Date.now(),
    };

    // 3) cache set
    await cacheSet(key, payload);

    return json({ ok: true, ...payload, cached: false });
  } catch (e) {
    console.error("[image-fallback] error:", e?.message || e);
    return json({ ok: false, error: "internal_error" }, 500);
  }
}

export async function POST() {
  return json({ ok: false, error: "Use GET" }, 405);
}
