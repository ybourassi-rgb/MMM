export default async function handler(req, res) {
  try {
    const query = req.query.query;
    const key = process.env.GOOGLE_SEARCH_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    const url =
      `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}` +
      `&searchType=image&q=${encodeURIComponent(query)}`;

    const g = await fetch(url);
    const d = await g.json();

    const image = d?.items?.[0]?.link || null;

    res.status(200).json({ ok: true, image });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
