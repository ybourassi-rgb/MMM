// lib/affiliations.js

// --- Outils de base ---

// Récupère le domaine à partir d'une URL
export function getDomainFromUrl(input) {
  try {
    const u = new URL(input);
    return u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch (e) {
    return "";
  }
}

// Quelques mots-clés à éviter (banque / crédit / usure)
const HARAM_KEYWORDS = [
  "banque",
  "bank",
  "credit",
  "crédit",
  "loan",
  "loans",
  "assurance",
  "assurances",
  "insurance",
  "microcredit",
  "micro-crédit",
  "bourse",
  "trading",
  "broker",
  "forex"
];

// Vérifie si le domaine est problématique
export function isHaramDomain(domain) {
  if (!domain) return false;
  return HARAM_KEYWORDS.some((kw) => domain.includes(kw));
}

// --- Variables d'environnement utilisées ---
// On mappe tes variables existantes pour éviter d'en créer 50 nouvelles.

const AMAZON_TAG_GLOBAL =
  process.env.AMAZON_ASSOCIATE_TAG || process.env.AMAZON_TAG_GLOBAL || "";

const ALIEXPRESS_PID =
  process.env.ALIEXPRESS_PID || process.env.ALIEXPRESS_AFFILIATE_LINK || "";

const EBAY_CAMPAIGN_ID = process.env.EBAY_CAMPAIGN_ID || "";

const AFFILIATOR_BASE_URL =
  process.env.AFFILIATOR_BASE_URL || "https://mmm-alpha-one.vercel.app";

// --- Règles d'affiliation ---
// ⚠️ Ici on ne met que des marchands "classiques" : marketplaces, e-commerce, etc.
//   → PAS de banques, PAS de crédit.

const AFFILIATION_RULES = [
  {
    id: "amazon",
    label: "Amazon global",
    enabled: true,
    match: (domain) =>
      domain.endsWith("amazon.fr") ||
      domain.endsWith("amazon.com") ||
      domain.endsWith("amazon.de") ||
      domain.endsWith("amazon.it") ||
      domain.endsWith("amazon.es") ||
      domain.endsWith("amazon.co.uk"),
    buildUrl: (rawUrl) => {
      const u = new URL(rawUrl);

      const host = u.hostname.toLowerCase();
      let tagEnv = AMAZON_TAG_GLOBAL;

      // Si un jour tu veux des tags par pays, tu peux rajouter d'autres env :
      // AMAZON_TAG_FR, AMAZON_TAG_DE, etc.
      if (host.endsWith("amazon.fr")) {
        tagEnv = process.env.AMAZON_TAG_FR || tagEnv;
      } else if (host.endsWith("amazon.de")) {
        tagEnv = process.env.AMAZON_TAG_DE || tagEnv;
      } else if (host.endsWith("amazon.it")) {
        tagEnv = process.env.AMAZON_TAG_IT || tagEnv;
      } else if (host.endsWith("amazon.es")) {
        tagEnv = process.env.AMAZON_TAG_ES || tagEnv;
      } else if (host.endsWith("amazon.co.uk")) {
        tagEnv = process.env.AMAZON_TAG_UK || tagEnv;
      } else if (host.endsWith("amazon.com")) {
        tagEnv = process.env.AMAZON_TAG_US || tagEnv;
      }

      if (!tagEnv) {
        // Pas encore de tag : on ne modifie pas l'URL
        return rawUrl;
      }

      u.searchParams.set("tag", tagEnv);
      return u.toString();
    }
  },
  {
    id: "aliexpress",
    label: "AliExpress",
    enabled: true,
    match: (domain) => domain.includes("aliexpress."),
    buildUrl: (rawUrl) => {
      const u = new URL(rawUrl);

      // On utilise ALIEXPRESS_PID si défini, sinon ALIEXPRESS_AFFILIATE_LINK
      const pid = ALIEXPRESS_PID;
      if (!pid) return rawUrl;

      // Exemple simple : ajout d’un paramètre d’affiliation
      // (à adapter si ton programme AliExpress demande un autre paramètre)
      u.searchParams.set("aff_fcid", pid);
      return u.toString();
    }
  },
  {
    id: "ebay",
    label: "eBay",
    enabled: true,
    match: (domain) => domain.includes("ebay."),
    buildUrl: (rawUrl) => {
      if (!EBAY_CAMPAIGN_ID) return rawUrl;
      const u = new URL(rawUrl);
      u.searchParams.set("mkcid", EBAY_CAMPAIGN_ID);
      return u.toString();
    }
  }
];

// --- Fonction principale ---
// Prend une URL d’annonce et renvoie :
//   { finalUrl, applied, program, halalBlocked, reason }

export function applyAffiliation(rawUrl) {
  let cleanUrl = rawUrl;
  try {
    cleanUrl = new URL(rawUrl).toString();
  } catch (e) {
    // URL bizarre → on renvoie tel quel
    return {
      finalUrl: rawUrl,
      applied: false,
      program: null,
      halalBlocked: false,
      reason: "invalid-url"
    };
  }

  const domain = getDomainFromUrl(cleanUrl);

  // 1) Sécurité halal : si domaine sensible → on ne touche pas au lien
  if (isHaramDomain(domain)) {
    return {
      finalUrl: cleanUrl,
      applied: false,
      program: null,
      halalBlocked: true,
      reason: "haram-domain"
    };
  }

  // 2) On essaie d'appliquer une règle d'affiliation
  for (const rule of AFFILIATION_RULES) {
    try {
      if (!rule.enabled) continue;

      if (rule.match(domain)) {
        const affUrl = rule.buildUrl(cleanUrl) || cleanUrl;
        const changed = affUrl !== cleanUrl;

        return {
          finalUrl: affUrl,
          applied: changed,
          program: rule.id,
          halalBlocked: false,
          reason: changed ? "affiliated" : "no-tag-configured"
        };
      }
    } catch (e) {
      // En cas de bug dans une règle, on ne casse pas la redirection
      continue;
    }
  }

  // 3) Aucun programme trouvé → on renvoie l’URL d’origine
  return {
    finalUrl: cleanUrl,
    applied: false,
    program: null,
    halalBlocked: false,
    reason: "no-program"
  };
}

// --- Helper option 1 : construire le lien /api/redirect ---
// buildAffiliateRedirect(rawUrl, { source, campaign })
// → renvoie un lien prêt à coller dans Telegram / sur le site

export function buildAffiliateRedirect(rawUrl, options = {}) {
  const { source = "telegram", campaign = "default" } = options;

  // 1) On applique les règles d'affiliation (Amazon, AliExpress, eBay, halal…)
  const { finalUrl } = applyAffiliation(rawUrl);

  // 2) On construit l'URL vers /api/redirect
  const base = AFFILIATOR_BASE_URL.replace(/\/$/, ""); // enlève un / final si besoin

  const params = new URLSearchParams({
    u: finalUrl,
    source,
    campaign
  });

  // IMPORTANT :
  // - URLSearchParams gère déjà l'encodage.
  // - Dans /api/redirect, tu récupéreras `u` déjà décodé par Next.
  return `${base}/api/redirect?${params.toString()}`;
}
