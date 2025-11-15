// mmy-agent/utils/buildAffiliateLink.js

/**
 * Construit un lien affilié à partir d'un lien brut.
 *
 * - Si AFFILIATE_TAG n'est pas défini => retourne le lien original.
 * - Sinon, ajoute un paramètre (par défaut "affid") au query string.
 *
 * Exemple :
 *   raw: https://exemple.com/article
 *   => https://exemple.com/article?affid=MMYDEALS
 */
export default function buildAffiliateLink(rawUrl) {
  const tag = process.env.AFFILIATE_TAG;
  const paramName = process.env.AFFILIATE_PARAM_NAME || "affid";

  if (!tag) {
    // Pas de config d'affiliation, on retourne le lien normal
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    url.searchParams.set(paramName, tag);
    return url.toString();
  } catch (err) {
    console.error("Erreur buildAffiliateLink, URL invalide:", rawUrl, err.message);
    return rawUrl;
  }
}
