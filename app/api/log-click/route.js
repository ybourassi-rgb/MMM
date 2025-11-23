export const runtime = "edge";

/**
 * POST /api/log-click
 * body: { url: "https://...", category?: "crypto|auto|..." }
 * -> incr click:<domain> et clickcat:<category>
 */

function baseHeaders() {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: baseHeaders(),
  });
}

function domainOf(url = "") {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

// Optionnel: whitelist (tu peux l’aligner avec r.js)
const ALLOW_HOSTS = [
  "ebay.fr", "amazon.fr", "amzn.to",
  "booking.com", "airbnb.fr",
  "coindesk.com", "cointelegraph.com",
  "lesechos.fr", "zonebourse.com", "boursorama.com",
  "reuters.com", "cnbc.com",
  "techcrunch.com", "theverge.com",
];

function isAllowed(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return ALLOW_HOSTS.some(d => h === d || h.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: baseHeaders() });
}

export async function POST(req) {
  const restUrl =
    process.env.UPSTASH_REST_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";

  if (!restUrl || !restToken) {
    return json({ ok: false, error: "Upstash non configuré." }, 400);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const url = (body?.url || "").trim();
    const category = (body?.category || "unknown").trim().toLowerCase();

    if (!url) {
      return json({ ok: false, error: "Missing url" }, 400);
    }

    // sécurité minimale + cohérence avec redirect
    if (!isAllowed(url)) {
      return json({ ok: false, error: "Domain not allowed" }, 400);
    }

    const domain = domainOf(url);
    if (!domain) {
      return json({ ok: false, error: "URL invalide" }, 400);
    }

    const auth = { Authorization: `Bearer ${restToken}` };

    // incr en parallèle (plus rapide)
    await Promise.allSettled([
      fetch(`${restUrl}/incr/${encodeURIComponent(`click:${domain}`)}`, {
        headers: auth,
        cache: "no-store",
      }),
      fetch(`${restUrl}/incr/${encodeURIComponent(`clickcat:${category}`)}`, {
        headers: auth,
        cache: "no-store",
      }),
    ]);

    return json({ ok: true, domain, category });
  } catch (e) {
    return json(
      { ok: false, error: e?.message || "Erreur interne" },
      500
    );
  }
}
