export default async function handler(req, res) {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "Missing query" });
    }

    const key = process.env.GOOGLE_SEARCH_KEY;
    const cx  = process.env.GOOGLE_SEARCH_CX;

    const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&searchType=image&q=${encodeURIComponent(query)}`;

    try {
        const googleRes = await fetch(url);
        const data = await googleRes.json();

        if (!data.items || !data.items.length) {
            return res.status(200).json({ image: null });
        }

        return res.status(200).json({ image: data.items[0].link });

    } catch (e) {
        return res.status(500).json({ error: "Google API error" });
    }
}
