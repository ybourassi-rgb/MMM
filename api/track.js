// pages/api/track.js
import { buildAffiliateRedirect } from "../../lib/affiliations";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  const { url, platform, product, redirect } = req.query;

  // 🟦 MODE 1 : génération de lien affilié → ?url=...
  if (url) {
    try {
      const finalLink = buildAffiliateRedirect(url, {
        source: "dashboard",
        campaign: "amazon-dashboard",
      });

      return res.status(200).json({
        ok: true,
        link: finalLink, // ton composant lit data.link
        original: url,
      });
    } catch (e) {
      console.error("track generate error:", e);
      return res.status(500).json({
        ok: false,
        error: e.message || "internal-error",
      });
    }
  }

  // 🟩 MODE 2 : clic tracké → ?platform=...&product=...&redirect=...
  if (platform && redirect) {
    let redirectUrl = redirect;
    try {
      // si c'est encodé (https%3A%2F%2F...), on le décode
      redirectUrl = decodeURIComponent(redirect);
    } catch (e) {
      console.error("decode redirect error:", e);
      // on garde redirect brut si decodeURIComponent plante
    }

    // Redirection vers le lien affilié final
    res.writeHead(302, { Location: redirectUrl });
    return res.end();
  }

  // Si aucun des 2 modes ne matche
  return res.status(400).json({
    ok: false,
    error: "Missing ?url= or ?platform=&redirect= parameters",
  });
}
