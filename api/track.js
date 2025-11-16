// /api/track.js
import { buildAffiliateRedirect } from "../../lib/affiliations";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  const rawUrl = req.query.url;

  if (!rawUrl) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing ?url= parameter" });
  }

  try {
    // ⚡ On fabrique l'URL finale :
    // - halal check
    // - ajout du tag Amazon / AliExpress, etc.
    // - tracking via /api/redirect (source + campagne)
    const finalLink = buildAffiliateRedirect(rawUrl, {
      source: "dashboard",
      campaign: "amazon-dashboard"
    });

    return res.status(200).json({
      ok: true,
      link: finalLink,      // 👈 ton composant lit data.link
      original: rawUrl
    });
  } catch (e) {
    console.error("track error:", e);
    return res.status(500).json({
      ok: false,
      error: e.message || "internal-error"
    });
  }
}
