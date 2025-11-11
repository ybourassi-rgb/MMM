// /api/r.js
export const config = { runtime: "edge" };

function noStore() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
  };
}

// Whitelist optionnelle via env (ex: "amazon.fr,booking.com,awin.com")
// Si vide → on autorise tout HTTPS (recommandé pour démarrer)
const ENV_ALLOW = (process.env.AFFIL_DOMAINS || "")
  .split(",")
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

function isAllowedHost(host) {
  if (ENV_ALLOW.length === 0) return true; // permissif par défaut
  return ENV_ALLOW.some(d => host === d || host.endsWith(`.${d}`));
}

async function incrClick(key) {
  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!restUrl || !restToken) return;
  fetch(`${restUrl}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${restToken}` },
    cache: "no-store",
  }).catch(() => {});
}

export default async function handler(req) {
  try {
    const urlObj = new URL(req.url);
    const u = urlObj.searchParams.get("u");          // URL affiliée (non encodée après parsing)
    const s = urlObj.searchParams.get("s") || "gen"; // source (auto/immo/crypto…)
    const debug = urlObj.searchParams.get("debug");  // ?debug=1 pour inspecter

    if (!u) {
      return new Response("Missing u", { status: 400, headers: noStore() });
    }
    if (!/^https?:\/\//i.test(u)) {
      return new Response("Invalid URL (must be http/https)", { status: 400, headers: noStore() });
    }

    const target = new URL(u);
    const host = target.hostname.toLowerCase();

    // Sécurité de base : refuse les schémas non-https si tu veux être strict
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return new Response("Unsupported protocol", { status: 400, headers: noStore() });
    }

    // Whitelist optionnelle
    if (!isAllowedHost(host)) {
      return new Response(`Domain not allowed: ${host}`, { status: 400, headers: noStore() });
    }

    // Optionnel : ajoute un subid si on n'en a pas déjà
    if (!target.searchParams.has("subid")) {
      target.searchParams.set("subid", `mmm-${s}-${Date.now()}`);
    }

    // Comptage (non bloquant)
    incrClick(`click:${s}:${host}`);

    // Mode debug : renvoie un JSON au lieu de rediriger (utile pour diagnostiquer)
    if (debug) {
      return new Response(JSON.stringify({
        ok: true,
        received: u,
        final: target.toString(),
        host,
        allowedBy: ENV_ALLOW.length ? "ENV_ALLOW" : "permissive-https",
      }, null, 2), { status: 200, headers: { ...noStore(), "Content-Type": "application/json; charset=utf-8" } });
    }

    // 302 vers l’annonceur (tracking OK)
    return Response.redirect(target.toString(), 302);
  } catch (e) {
    return new Response(`Erreur interne: ${e?.message || e}`, { status: 500, headers: noStore() });
  }
}
