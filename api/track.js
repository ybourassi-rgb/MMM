// pages/api/track.js
import { buildAffiliateRedirect } from "../../lib/affiliations";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);

  const url = searchParams.get("url");
  const platform = searchParams.get("platform");
  const product = searchParams.get("product");
  const redirect = searchParams.get("redirect");

  // MODE 1 — Génération du lien affilié
  if (url) {
    try {
      const finalLink = buildAffiliateRedirect(url, {
        source: "dashboard",
        campaign: "amazon-dashboard",
      });

      return new Response(
        JSON.stringify({
          ok: true,
          link: finalLink,
          original: url,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({ ok: false, error: e.message || "internal-error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }
  }

  // MODE 2 — Redirection affiliée
  if (platform && redirect) {
    let redirectUrl = redirect;
    try {
      redirectUrl = decodeURIComponent(redirect);
    } catch {}

    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl },
    });
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: "Missing ?url= or ?platform=&redirect= parameters",
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    }
  );
}
