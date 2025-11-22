// pages/api/image-real.js
export default async function handler(req, res) {
  try {
    const { q, type = "product", url } = req.query;

    // 1) Si on a une URL -> OpenGraph
    if (url) {
      const og = await fetchOpenGraphImage(url);
      if (og?.imageUrl) {
        return res.status(200).json({
          source: "real",
          imageUrl: og.imageUrl,
          thumbUrl: og.imageUrl,
          contextUrl: url,
          confidence: 0.85
        });
      }
    }

    // 2) Si pas d'URL ou OG vide -> pas d'image réelle ici
    return res.status(200).json({
      source: "real",
      imageUrl: null,
      thumbUrl: null,
      contextUrl: null,
      confidence: 0
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// --- helpers ---
async function fetchOpenGraphImage(pageUrl) {
  const html = await fetch(pageUrl, {
    headers: { "User-Agent": "Mozilla/5.0" }
  }).then(r => r.text());

  // extraction simple OG
  const ogImage =
    matchMeta(html, "property", "og:image") ||
    matchMeta(html, "name", "og:image");

  return ogImage ? { imageUrl: ogImage } : null;
}

function matchMeta(html, attr, value) {
  const regex = new RegExp(
    `<meta[^>]*${attr}=["']${value}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m = html.match(regex);
  return m?.[1] || null;
}
