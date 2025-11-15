import { makeAffiliate, isHaram } from "../lib/affiliations.js";

export default async function handler(req, res) {
  try {
    const url = decodeURIComponent(req.query.url || "");

    if (!url) {
      return res.status(400).json({ ok: false, error: "Aucun lien fourni" });
    }

    // 🚫 Filtre halal
    if (isHaram(url)) {
      return res.status(403).json({
        ok: false,
        error: "Lien interdit (finance / crédit / haram détecté)."
      });
    }

    // ✔️ Génération du lien affilié
    const affiliateUrl = makeAffiliate(url);

    // Redirection
    return res.redirect(302, affiliateUrl);

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Erreur interne",
      details: err.message
    });
  }
}
