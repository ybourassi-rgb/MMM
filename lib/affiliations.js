// lib/affiliations.js

// ⚠️ Domaines interdits (haram / riba)
export const bannedDomains = [
  "bank",
  "credit",
  "loan",
  "finance",
  "insurance",
  "assurance",
  "lending",
  "paypal-credit",
  "sofinco",
  "cofidis",
  "cofinoga",
  "younited-credit",
];

// 🌍 Domaines autorisés + modèles d’affiliation
// Tu pourras en ajouter progressivement
export const affiliateDomains = {
  "amazon": (url) => {
    return url + (url.includes("?") ? "&tag=YOUR_AMAZON_TAG" : "?tag=YOUR_AMAZON_TAG");
  },
  
  "aliexpress": (url) => {
    return "https://s.click.aliexpress.com/deep_link.htm?aff_short_key=YOUR_KEY&dl_target_url=" + encodeURIComponent(url);
  },

  "ebay": (url) => {
    return url + (url.includes("?") ? "&campid=YOUR_EBAY_ID" : "?campid=YOUR_EBAY_ID");
  },

  "temu": (url) => {
    return url + (url.includes("?") ? "&ref=YOUR_TEMU_REF" : "?ref=YOUR_TEMU_REF");
  },

  "rakuten": (url) => {
    return url; // Rakuten auto-affiliation via extension → possible plus tard
  },
};

// Détecte le domaine
export function detectDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace("www.", "");
  } catch {
    return null;
  }
}

// Vérifier haram
export function isHaram(url) {
  const u = url.toLowerCase();
  return bannedDomains.some(domain => u.includes(domain));
}

// Transforme un lien normal → lien affilié
export function makeAffiliate(url) {
  const host = detectDomain(url);
  if (!host) return null;

  const key = Object.keys(affiliateDomains).find(d => host.includes(d));
  if (!key) return url; // pas de modèle → lien normal

  return affiliateDomains[key](url);
}
