export default function handler(req, res) {
  const { url } = req.query;

  if (url.includes("amazon")) {
    return res.redirect(`/api/affiliation/amazon?url=${encodeURIComponent(url)}`);
  }

  if (url.includes("aliexpress")) {
    return res.redirect(`/api/affiliation/aliexpress?url=${encodeURIComponent(url)}`);
  }

  return res.status(400).json({ error: "Plateforme non reconnue" });
}
