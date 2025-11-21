// api/googleimage.js
// Retourne une image Google Images pour une requête donnée (q=...)

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: "Use GET" });
      return;
    }

    const query = req.query.q || req.query.query;
    if (!query) {
      res.status(400).json({ ok: false, error: "Missing ?q=..." });
      return;
    }

    const key = process.env.GOOGLE_SEARCH_KEY;
    const cx  = process.env.GOOGLE_SEARCH_CX;

    if (!key || !cx) {
      res.status(500).json({ ok: false, error: "Missing Google env vars" });
      return;
    }

    const apiUrl =
      "https://www.googleapis.com/customsearch/v1"
      + `?key=${encodeURIComponent(key)}`
      + `&cx=${encodeURIComponent(cx)}`
      + "&searchType=image"
      + `&q=${encodeURIComponent(query)}`;

    const r = await fetch(apiUrl);
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      console.error("Google API error:", r.status, txt);
      res.status(502).json({ ok: false, error: "google_api_error" });
      return;
    }

    const data = await r.json();

    const firstImage = data.items && data.items[0] && data.items[0].link
      ? data.items[0].link
      : null;

    res.status(200).json({
      ok: true,
      query,
      image: firstImage,
    });
  } catch (err) {
    console.error("googleimage handler error:", err);
    res.status(500).json({ ok: false, error: "internal_error" });
  }
}
