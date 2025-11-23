export const runtime = "edge";

/**
 * Proxy d'image sécurisé (Amazon / autres CDNs)
 * Usage:
 *  /api/image-proxy?url=https%3A%2F%2Fm.media-amazon.com%2Fimages%2F...
 */

const ALLOW_HOSTS = [
  // Amazon media
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
  "images-eu.ssl-images-amazon.com",
  // autres CDNs si besoin
  "i.ebayimg.com",
  "upload.wikimedia.org",
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function isAllowedHost(hostname) {
  const h = hostname.toLowerCase();
  return ALLOW_HOSTS.some(d => h === d || h.endsWith(`.${d}`));
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const urlParam = (searchParams.get("url") || "").trim();

    if (!urlParam) {
      return json({ ok: false, error: "Missing url parameter" }, 400);
    }

    let target;
    try {
      target = new URL(urlParam);
    } catch {
      return json({ ok: false, error: "Invalid url" }, 400);
    }

    if (!["http:", "https:"].includes(target.protocol)) {
      return json({ ok: false, error: "Invalid protocol" }, 400);
    }

    // Sécurité: on n'autorise que certains domaines
    if (!isAllowedHost(target.hostname)) {
      return json({ ok: false, error: "Host not allowed" }, 400);
    }

    const upstream = await fetch(target.toString(), {
      cache: "force-cache",
    });

    if (!upstream.ok) {
      return json(
        { ok: false, error: "Upstream error", status: upstream.status },
        upstream.status
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const bytes = await upstream.arrayBuffer();

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache CDN 1 jour (tu peux monter à 7j si tu veux)
        "Cache-Control": "public, s-maxage=86400, max-age=86400",
      },
    });
  } catch (err) {
    return json({ ok: false, error: "Proxy error" }, 500);
  }
}
