// api/amazon.js
export default async function handler(req, res) {
  try {
    const asin = req.query.asin;
    if (!asin) {
      return res.status(400).json({ ok: false, error: "Missing asin" });
    }

    const apiKey = process.env.RAINFOREST_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "Missing RAINFOREST_API_KEY" });
    }

    const url =
      "https://api.rainforestapi.com/request" +
      `?api_key=${apiKey}` +
      `&amazon_domain=amazon.fr` +
      `&type=product` +
      `&asin=${encodeURIComponent(asin)}`;

    const rfRes = await fetch(url);
    const data = await rfRes.json();

    // Si Rainforest renvoie une erreur / quota / etc.
    if (data?.request_info?.success === false) {
      return res.status(502).json({
        ok: false,
        error: data.request_info?.message || "Rainforest error",
        request_info: data.request_info
      });
    }

    const p = data?.product || {};

    // Mapping robuste (Rainforest varie selon les produits)
    const rating =
      p.rating ??
      p.rating_summary?.rating ??
      p.reviews?.rating ??
      null;

    const reviewsCount =
      p.ratings_total ??
      p.reviews_total ??
      p.rating_summary?.total_ratings ??
      null;

    const price =
      p.buybox_winner?.price?.value ??
      p.price?.value ??
      null;

    return res.status(200).json({
      ok: true,
      asin,
      title: p.title || null,
      rating,
      reviewsCount,
      price,
      currency: p.buybox_winner?.price?.currency || p.price?.currency || "EUR",
      productUrl: p.link || `https://www.amazon.fr/dp/${asin}`
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message || "Server error"
    });
  }
}
