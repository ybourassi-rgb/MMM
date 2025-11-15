export default async function handler(req, res) {
  try {
    const { url, src } = req.query;

    if (!url) {
      return res.status(200).json({
        ok: true,
        message: "Redirect API fonctionne 🔥"
      });
    }

    // Sécurise l’URL
    const safeUrl = decodeURIComponent(url);

    // Log minimal dans la console Vercel (pas de Redis)
    console.log("REDIRECT CLICK :", {
      url: safeUrl,
      source: src || "unknown",
      at: new Date().toISOString()
    });

    // Redirection
    return res.redirect(302, safeUrl);

  } catch (err) {
    console.error("REDIRECT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
