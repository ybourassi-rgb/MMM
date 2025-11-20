// pages/api/track.js
import { buildAffiliateRedirect } from "../../lib/affiliations";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  const { url, platform, product, redirect } = req.query;

  // MODE 1 — génération de lien affilié
  if (url) {
    try {
      const finalLink = buildAffiliateRedirect(url, {
        source: "dashboard",
        campaign: "amazon-dashboard",
      });

      return res.status(200).json({
        ok: true,
        link: finalLink,
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

  // MODE 2 — redirection affiliée
  if (platform && redirect) {
    let redirectUrl = redirect;
    try {
      redirectUrl = decodeURIComponent(redirect);
    } catch {}

    res.writeHead(302, { Location: redirectUrl });
    return res.end();
  }

  return res.status(400).json({
    ok: false,
    error: "Missing ?url= or ?platform=&redirect=",
  });
}
