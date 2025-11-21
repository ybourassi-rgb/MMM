export default async function handler(req, res) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ ok: false, error: "Missing query" });
    }

    const url =
      "https://www.googleapis.com/customsearch/v1?" +
      new URLSearchParams({
        key: process.env.GOOGLE_SEARCH_KEY,
        cx: process.env.GOOGLE_SEARCH_CX,
        searchType: "image",
        q
      });

    const googleRes = await fetch(url);
    const data = await googleRes.json();

    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ ok: false, image: null });
    }

    return res.status(200).json({
      ok: true,
      image: data.items[0].link
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}
