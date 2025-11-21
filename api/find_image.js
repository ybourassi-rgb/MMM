// /api/find_image.js
// Cherche une image sur Google Images à partir d'une référence / titre

// ⚠️ À configurer dans Vercel :
// - GOOGLE_SEARCH_KEY  = ta clé API Google
// - GOOGLE_SEARCH_CX   = l'ID de ton Custom Search Engine (CSE)

const GOOGLE_KEY = process.env.GOOGLE_SEARCH_KEY;
const GOOGLE_CX  = process.env.GOOGLE_SEARCH_CX;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Use GET" });
    return;
  }

  if (!GOOGLE_KEY || !GOOGLE_CX) {
    res.status(500).json({
      ok: false,
      error: "Missing GOOGLE_SEARCH_KEY or GOOGLE_SEARCH_CX env vars"
    });
    return;
  }

  const ref =
    (req.query && req.query.ref) ||
    new URL(req.url, `http://${req.headers.host}`).searchParams.get("ref");

  if (!ref) {
    res.status(400).json({ ok: false, error: "Missing ?ref=" });
    return;
  }

  try {
    const apiUrl =
      "https://www.googleapis.com/customsearch/v1" +
      `?key=${encodeURIComponent(GOOGLE_KEY)}` +
      `&cx=${encodeURIComponent(GOOGLE_CX)}` +
      `&searchType=image` +
      `&num=1` +
      `&safe=active` +
      `&q=${encodeURIComponent(ref)}`;

    const gRes = await fetch(apiUrl);
    if (!gRes.ok) {
      const txt = await gRes.text().catch(() => "");
      console.error("[find_image] Google error", gRes.status, txt);
      res
        .status(500)
        .json({ ok: false, error: "google_error", status: gRes.status });
      return;
    }

    const data = await gRes.json();
    const item = data.items && data.items[0];
    const imageUrl = item?.link || null;

    if (!imageUrl) {
      res.status(404).json({ ok: false, error: "no_image_found" });
      return;
    }

    res.status(200).json({
      ok: true,
      imageUrl,
      source: item.image?.contextLink || null,
      ref
    });
  } catch (err) {
    console.error("[find_image] Internal error", err);
    res.status(500).json({ ok: false, error: "internal_error" });
  }
}
