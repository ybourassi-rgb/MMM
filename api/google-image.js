// /api/google-image.js
// Retourne une URL d'image trouvée sur Google Images pour une requête donnée.

export default async function handler(req, res) {
  // Méthode uniquement GET
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Use GET" });
    return;
  }

  const query = req.query.q || req.query.query;
  if (!query) {
    res.status(400).json({ ok: false, error: "Missing query" });
    return;
  }

  const apiKey = process.env.GOOGLE_SEARCH_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    res.status(500).json({
      ok: false,
      error: "Missing GOOGLE_SEARCH_KEY or GOOGLE_SEARCH_CX",
    });
    return;
  }

  try {
    const url =
      "https://www.googleapis.com/customsearch/v1" +
      `?key=${encodeURIComponent(apiKey)}` +
      `&cx=${encodeURIComponent(cx)}` +
      "&searchType=image" +
      `&q=${encodeURIComponent(query)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || !data.items.length) {
      res.status(200).json({ ok: true, image: null });
      return;
    }

    const first = data.items[0];
    res.status(200).json({
      ok: true,
      image: first.link || null,
    });
  } catch (err) {
    console.error("google-image error:", err);
    res.status(500).json({ ok: false, error: "google_image_failed" });
  }
}
