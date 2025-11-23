export const runtime = "edge";

/**
 * /api/image-real?q=...&type=product&url=https://...
 * - Si url est fourni => tente og:image
 * - Sinon renvoie null (pas de recherche Google ici)
 */

// (Optionnel mais recommandé) : domaines autorisés pour éviter abus
const ALLOW_HOSTS = [
  "amazon.fr", "www.amazon.fr", "amzn.to",
  "ebay.fr", "www.ebay.fr",
  "coindesk.com", "www.coindesk.com",
  "cointelegraph.com", "www.cointelegraph.com",
  "lesechos.fr", "www.lesechos.fr",
  "zonebourse.com", "www.zonebourse.com",
  "boursorama.com", "www.boursorama.com",
  "reuters.com", "www.reuters.com",
  "cnbc.com", "www.cnbc.com",
  "techcrunch.com", "www.techcrunch.com",
  "theverge.com", "www.theverge.com"
];

function isAllowed(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return ALLOW_HOSTS.some(d => h === d || h.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const type = (searchParams.get("type") || "product").trim();
    const url = (searchParams.get("url") || "").trim();

    // 1) Si on a une URL -> OpenGraph
    if (url) {
      if (!isAllowed(url)) {
        return json({
          ok: false,
          error: "Domain not allowed",
          source: "real",
          imageUrl: null,
          confidence: 0
        }, 400);
      }

      const og = await fetchOpenGraphImage(url);
      if (og?.imageUrl) {
        return json({
          ok: true,
          source: "real",
          imageUrl: og.imageUrl,
          thumbUrl: og.imageUrl,
          contextUrl: url,
          q,
          type,
          confidence: 0.9
        });
      }
    }

    // 2) Si pas d'URL ou OG vide -> pas d'image réelle ici
    return json({
      ok: true,
      source: "real",
      imageUrl: null,
      thumbUrl: null,
      contextUrl: null,
      q,
      type,
      confidence: 0
    });

  } catch (e) {
    return json({ ok: false, error: e?.message || "internal_error" }, 500);
  }
}

// --- helpers ---
async function fetchOpenGraphImage(pageUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  let html = "";
  try {
    const r = await fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (MMM Bot)",
        "Accept": "text/html"
      },
      signal: controller.signal,
      cache: "no-store"
    });
    html = await r.text();
  } catch {
    clearTimeout(timeout);
    return null;
  }
  clearTimeout(timeout);

  // extraction OG (plus tolérante)
  const ogImage =
    matchMeta(html, "property", "og:image") ||
    matchMeta(html, "name", "og:image") ||
    matchMeta(html, "property", "twitter:image") ||
    matchMeta(html, "name", "twitter:image");

  if (!ogImage) return null;

  // si URL relative -> on la rend absolue
  try {
    const abs = new URL(ogImage, pageUrl).toString();
    return { imageUrl: abs };
  } catch {
    return { imageUrl: ogImage };
  }
}

function matchMeta(html, attr, value) {
  // gère content avant/après + espaces
  const regex = new RegExp(
    `<meta[^>]*${attr}\\s*=\\s*["']${value}["'][^>]*content\\s*=\\s*["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m = html.match(regex);
  if (m?.[1]) return m[1];

  // fallback si content vient avant l'attr
  const regex2 = new RegExp(
    `<meta[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*${attr}\\s*=\\s*["']${value}["'][^>]*>`,
    "i"
  );
  const m2 = html.match(regex2);
  return m2?.[1] || null;
}
