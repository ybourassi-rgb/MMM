// mmy-agent/utils/buildAffiliateLink.js

/**
 * Construit un lien de redirection via MMM.
 *
 * - REDIRECT_BASE_URL doit pointer vers ton redirect, ex :
 *   https://mmm-alpha-one.vercel.app/api/redirect
 *
 * - AFFILIATE_TAG permet de tagguer la source (ex : MMYDEALS1)
 */
export default function buildAffiliateLink(rawUrl) {
  const base = process.env.REDIRECT_BASE_URL; // ex: https://mmm-alpha-one.vercel.app/api/redirect
  const tag = process.env.AFFILIATE_TAG || "MMYDEALS1";
  const src = "tg"; // Telegram

  if (!base) {
    // Pas de redirect configuré → lien brut
    return rawUrl;
  }

  try {
    const redirectUrl = new URL(base);
    redirectUrl.searchParams.set("url", rawUrl);
    redirectUrl.searchParams.set("src", src);
    redirectUrl.searchParams.set("tag", tag);
    return redirectUrl.toString();
  } catch (err) {
    console.error("Erreur buildAffiliateLink:", err.message);
    return rawUrl;
  }
}
