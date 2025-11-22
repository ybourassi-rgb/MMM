// /api/amazon.js
export default async function handler(req, res) {
  try {
    const asin = (req.query.asin || "").trim();
    if (!asin) {
      return res.status(400).json({ ok: false, error: "asin_missing" });
    }

    const RF_KEY = process.env.RAINFOREST_API_KEY;
    if (!RF_KEY) {
      // fallback propre si pas de clé
      return res.status(200).json({
        ok: true,
        route: "amazon",
        asin,
        mode: "mock",
        product: {
          asin,
          title: "Produit mock (clé Rainforest absente)",
          price: null,
          images: [],
          url: `https://www.amazon.com/dp/${asin}`
        }
      });
    }

    const url =
      `https://api.rainforestapi.com/request?api_key=${RF_KEY}` +
      `&type=product&amazon_domain=amazon.com&asin=${encodeURIComponent(asin)}`;

    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok || data.request_info?.success === false) {
      return res.status(502).json({
        ok: false,
        route: "amazon",
        asin,
        error: "rainforest_error",
        details: data
      });
    }

    const p = data.product || {};
    return res.status(200).json({
      ok: true,
      route: "amazon",
      asin,
      mode: "rainforest",
      product: {
        asin: p.asin || asin,
        title: p.title,
        brand: p.brand,
        price: p.buybox_winner?.price?.value || p.price?.value || null,
        currency: p.buybox_winner?.price?.currency || p.price?.currency || null,
        rating: p.rating || null,
        ratings_total: p.ratings_total || null,
        images:
          (p.main_image && [p.main_image.link]) ||
          (p.images?.map(x => x.link)) ||
          [],
        url: p.link || `https://www.amazon.com/dp/${asin}`
      },
      raw: data
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error", message: e.message });
  }
}
