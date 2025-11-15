export default function handler(req, res) {
  const { url } = req.query;
  const tag = process.env.AMAZON_TAG; // exemple: moneymotory-21

  // Extraction de l’ASIN (ID Amazon)
  const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);

  if (!asinMatch) {
    return res.status(400).json({ error: "ASIN introuvable dans l’URL" });
  }

  const asin = asinMatch[1];

  const affiliatedUrl = `https://www.amazon.fr/dp/${asin}?tag=${tag}`;

  return res.status(200).json({
    original: url,
    affiliated: affiliatedUrl
  });
}
