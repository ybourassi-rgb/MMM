// api/google-image.js
// Retourne une image trouvée sur Google Images pour une requête donnée (?q=...)

export default async function handler(req, res) {
  try {
    const query = (req.query && req.query.q) || "";

    if (!query) {
      return res.status(400).json({ ok: false, error: "Missing q parameter" });
    }

    const apiKey = process.env.GOOGLE_SEARCH_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      return res.status(500).json({
        ok: false,
        error: "Missing GOOGLE_SEARCH_KEY or GOOGLE_SEARCH_CX env vars"
      });
    }

    const url =
      "https://www.googleapis.com/customsearch/v1" +
      `?searchType=image&num=1&q=${encodeURIComponent(query)}` +
      `&key=${apiKey}&cx=${cx}`;

    const gRes = await fetch(url);
    if (!gRes.ok) {
      const txt = await gRes.text().catch(() => "");
      return res.status(500).json({
        ok: false,
        error: "Google API error",
        details: txt.slice(0, 200)
      });
    }

    const data = await gRes.json();
    const first = data.items && data.items[0];

    const imageUrl =
      (first && first.link) ||
      (first && first.image && first.image.thumbnailLink) ||
      null;

    if (!imageUrl) {
      return res
        .status(404)
        .json({ ok: false, error: "No image found for this query" });
    }

    return res.status(200).json({ ok: true, imageUrl });
  } catch (e) {
    console.error("google-image error:", e);
    return res.status(500).json({ ok: false, error: "internal-error" });
  }
}
