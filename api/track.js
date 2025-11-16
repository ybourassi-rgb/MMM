// /api/track.js
import { buildAffiliateRedirect } from "../../lib/affiliations";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  const rawUrl = req.query.url;

  if (!rawUrl) {
    return res.status(400).json({
      ok: false,
      error: "Missing ?url= parameter"
    });
  }

  try {
    const finalLink = buildAffiliateRedirect(rawUrl, {
      source: "dashboard",
      campaign: "dashboard-test"
    });

    return res.status(200).json({
      ok: true,
      link: finalLink
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message
    });
  }
}
