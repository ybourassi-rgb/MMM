// api/google_image.js

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ ok: false, error: "missing_query" });
  }

  const key = process.env.GOOGLE_SEARCH_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!key || !cx) {
    return res.status(500).json({ ok: false, error: "missing_google_keys" });
  }

  try {
    const url =
      `https://www.googleapis.com/customsearch/v1` +
      `?key=${key}&cx=${cx}&searchType=image&q=${encodeURIComponent(q)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return res.status(200).json({ ok: true, image: null });
    }

    return res.status(200).json({
      ok: true,
      image: data.items[0].link,
    });
  } catch (err) {
    console.error("Google API error:", err);
    return res.status(500).json({ ok: false, error: "google_api_error" });
  }
}
