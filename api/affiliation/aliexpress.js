export default async function handler(req, res) {
  const { url } = req.query;

  const apiUrl = `https://api.aliexpress.com/api/link/generate?app_key=${process.env.ALIX_APPKEY}&tracking_id=${process.env.ALIX_TRACKING}&url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    return res.status(200).json({
      original: url,
      affiliated: data.data.promotion_link
    });
  } catch (err) {
    return res.status(500).json({ error: "Erreur génération AliExpress" });
  }
}
