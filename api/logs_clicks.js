// /api/log_click.js
export const config = { runtime: "edge" };

function headers() {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function domainOf(url="") {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default async function handler(req) {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: headers() });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok:false, error:"Méthode non autorisée" }), {
      status: 405, headers: headers()
    });
  }

  const restUrl =
    process.env.UPSTASH_REST_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const restToken =
    process.env.UPSTASH_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

  if (!restUrl || !restToken) {
    return new Response(JSON.stringify({ ok:false, error:"Upstash non configuré." }), {
      status: 400, headers: headers()
    });
  }

  try {
    const body = await req.json().catch(()=>({}));
    const url = body?.url || "";
    const category = body?.category || "unknown";
    const domain = domainOf(url);
    if (!domain) {
      return new Response(JSON.stringify({ ok:false, error:"URL invalide" }), {
        status: 400, headers: headers()
      });
    }

    // clé principale par domaine
    const key = `click:${domain}`;

    // incrément
    await fetch(`${restUrl}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${restToken}` },
      cache: "no-store",
    });

    // optionnel: stats par catégorie
    await fetch(`${restUrl}/incr/${encodeURIComponent(`clickcat:${category}`)}`, {
      headers: { Authorization: `Bearer ${restToken}` },
      cache: "no-store",
    });

    return new Response(JSON.stringify({ ok:true, domain, category }), {
      status: 200, headers: headers()
    });

  } catch(e){
    return new Response(JSON.stringify({ ok:false, error:e.message || "Erreur interne" }), {
      status: 500, headers: headers()
    });
  }
}
