// /lib/affiliator_core.js
// Edge-safe: n'utilise PAS "import { URL } from 'url'"

function buildAffiliateUrl(raw, { network, siteId, subKey, userId, channel }) {
  if (!raw) return "";

  // URL globale (disponible en Edge Runtime)
  let url;
  try {
    url = new URL(raw);
  } catch {
    // si l'URL est relative/invalide, on renvoie brut
    return raw;
  }

  // UTM standards (peuvent être lus par ton analytics)
  if (!url.searchParams.has("utm_source"))  url.searchParams.set("utm_source", "MoneyMotorY");
  if (!url.searchParams.has("utm_medium"))  url.searchParams.set("utm_medium", "aff");
  if (!url.searchParams.has("utm_campaign"))url.searchParams.set("utm_campaign", channel || "deals");

  // SubID / tracking léger
  const subid = [userId || "MMM", subKey || "default"].filter(Boolean).join(":");
  if (subid) {
    // on met dans un param standard souvent accepté par les réseaux
    if (!url.searchParams.has("subid")) url.searchParams.set("subid", subid);
  }

  // Si tu veux des adaptations par réseau, ajoute ici (toujours Edge-safe)
  // Exemple (placeholder): if (network === "awin") { ... }  // à compléter plus tard

  return url.toString();
}

/**
 * Enrichit un item (annonce / deal) avec un lien affilié + normalise quelques champs.
 * Ne jette pas si un champ manque; renvoie l'item d'origine avec les ajouts possibles.
 */
export function enrichItemWithAffiliate(item, opts = {}) {
  const safe = item || {};
  const title = safe.title || safe.name || "";
  const link  = safe.affiliateUrl || safe.url || safe.link || "";
  const price = safe.price ?? null;

  const affiliateUrl = safe.affiliateUrl || buildAffiliateUrl(link, {
    network: opts.network,
    siteId : opts.siteId,
    subKey : opts.subKey,
    userId : opts.userId,
    channel: safe.__channel || "deals"
  });

  return {
    ...safe,
    title,
    price,
    link: link || "",          // on garde le lien original sous "link"
    url: link || "",           // compat
    affiliateUrl               // lien final à publier
  };
}
