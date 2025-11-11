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

// ⚙️ Si la variable d'env AFFIL_DOMAINS est vide => on autorise TOUS les hôtes HTTPS.
// Sinon, on restreint à la liste fournie (séparée par des virgules).
const ENV_ALLOW = (process.env.AFFIL_DOMAINS || "")
  .split(",")
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

function isAllowedHost(host) {
  if (ENV_ALLOW.length === 0) return true; // mode permissif (tout autorisé)
  return ENV_ALLOW.some(d => host === d || host.endsWith(`.${d}`));
}

async function incrClick(key) {
  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!restUrl || !restToken) return;
  // comptage non bloquant
  fetch(`${restUrl}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${restToken}` },
    cache: "no-store",
  }).catch(() => {});
}

export default async function handler(req) {
  try {
    const urlObj = new URL(req.url);
    const u = urlObj.searchParams.get("u"); // URL affiliée encodée
    const s = urlObj.searchParams.get("s") || "gen"; // source
    const debug = urlObj.searchParams.get("debug");

    if (!u)
      return new Response("Missing u", { status: 400, headers: noStore() });
    if (!/^https?:\/\//i.test(u))
      return new Response("Invalid URL", { status: 400, headers: noStore() });

    const target = new URL(u);
    const host = target.hostname.toLowerCase();

    if (!isAllowedHost(host))
      return new Response(`Domain not allowed: ${host}`, {
        status: 400,
        headers: noStore(),
      });

    // Ajout subid de tracking
    if (!target.searchParams.has("subid")) {
      target.searchParams.set("subid", `mmm-${s}-${Date.now()}`);
    }

    incrClick(`click:${s}:${host}`);

    // Mode debug (pour tests)
    if (debug) {
      return new Response(
        JSON.stringify(
          {
            ok: true,
            received: u,
            final: target.toString(),
            host,
            allowedBy:
              ENV_ALLOW.length > 0 ? "ENV_ALLOW" : "permissive-https",
          },
          null,
          2
        ),
        {
          status: 200,
          headers: {
            ...noStore(),
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    // Redirection finale
    return Response.redirect(target.toString(), 302);
  } catch (e) {
    return new Response(`Erreur interne: ${e?.message || e}`, {
      status: 500,
      headers: noStore(),
    });
  }
}
