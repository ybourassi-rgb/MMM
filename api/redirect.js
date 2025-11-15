import { Redis } from "@upstash/redis";

// ❌ Domaines à éviter pour rester halal (banques / crédit / prêts)
const HALAL_BLOCKED_KEYWORDS = [
  "bank",
  "banque",
  "credit",
  "crédit",
  "loan",
  "pret",
  "prêt",
  "mortgage",
  "microcredit",
  "micro-crédit",
  "microcredit",
  "payday"
];

// 🔗 Map domaines -> variables d'affiliation (à remplir dans Vercel)
const AFFILIATE_MAP = {
  // Exemple : e-commerce / tech / voyage, etc. (PAS de banques)
  "amazon.fr": process.env.AFFILIATE_AMAZON_FR,
  "amazon.com": process.env.AFFILIATE_AMAZON_COM,
  "aliexpress.com": process.env.AFFILIATE_ALIEXPRESS,
  "booking.com": process.env.AFFILIATE_BOOKING,
  // tu pourras en rajouter ici au fur et à mesure
};

// ⚙️ Création sécurisée du client Redis (optionnel)
function getRedisClient() {
  try {
    const url =
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_URL ||
      process.env.UPSTASH_REST_URL;

    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.UPSTASH_REDIS_TOKEN ||
      process.env.UPSTASH_REST_TOKEN;

    if (!url || !token) return null;

    return new Redis({ url, token });
  } catch (e) {
    console.warn("⚠️ Redis init error:", e.message);
    return null;
  }
}

// 🔍 Applique affiliation + UTM + filtre halal
function buildAffiliateUrl(rawUrl) {
  const urlObj = new URL(rawUrl);
  const host = urlObj.hostname.toLowerCase();

  // 1) Filtre halal : si ça ressemble à une banque / crédit → pas d’affiliation
  const isBlocked = HALAL_BLOCKED_KEYWORDS.some((word) =>
    host.includes(word)
  );

  if (isBlocked) {
    // On ne touche pas au lien, juste on ajoute UTM propres
    urlObj.searchParams.set("utm_source", "MMY");
    urlObj.searchParams.set("utm_medium", "telegram");
    urlObj.searchParams.set("utm_campaign", "MMY_DEALS_HALAL_ONLY");

    return {
      finalUrl: urlObj.toString(),
      halalBlocked: true,
      affiliateApplied: false,
      program: null,
    };
  }

  // 2) Essaye d'appliquer une affiliation spécifique au domaine
  let affiliateApplied = false;
  let programUsed = null;

  for (const [domain, affiliateId] of Object.entries(AFFILIATE_MAP)) {
    if (!affiliateId) continue; // variable non configurée → on skip

    const isSameDomain =
      host === domain || host.endsWith("." + domain.replace(/^\./, ""));

    if (!isSameDomain) continue;

    // Règles simples par domaine (tu peux les affiner si besoin)
    if (domain.startsWith("amazon.")) {
      // Amazon : param "tag"
      urlObj.searchParams.set("tag", affiliateId);
    } else if (domain.includes("aliexpress")) {
      // Exemple AliExpress (à adapter selon ton programme)
      urlObj.searchParams.set("aff_fcid", affiliateId);
    } else if (domain.includes("booking.com")) {
      // Exemple Booking.com
      urlObj.searchParams.set("aid", affiliateId);
    } else {
      // Générique : param "ref"
      urlObj.searchParams.set("ref", affiliateId);
    }

    affiliateApplied = true;
    programUsed = domain;
    break;
  }

  // 3) Ajout UTM tracking global (même sans affiliation)
  urlObj.searchParams.set("utm_source", "MMY");
  urlObj.searchParams.set("utm_medium", "telegram");
  urlObj.searchParams.set("utm_campaign", affiliateApplied
    ? "MMY_DEALS_AFFILIATE"
    : "MMY_DEALS_ORG");

  return {
    finalUrl: urlObj.toString(),
    halalBlocked: false,
    affiliateApplied,
    program: programUsed,
  };
}

// 🔀 Handler principal
export default async function handler(req, res) {
  try {
    // 1) Méthode
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "Use GET" });
    }

    // 2) Paramètre URL
    const raw = req.query.url;
    if (!raw) {
      return res.status(400).json({ ok: false, error: "Missing url" });
    }

    // 3) Normalisation de l’URL
    let target;
    try {
      const normalized = Array.isArray(raw) ? raw[0] : raw;

      try {
        target = new URL(normalized).toString();
      } catch {
        target = new URL(decodeURIComponent(normalized)).toString();
      }
    } catch (err) {
      console.error("❌ URL invalid:", err.message);
      // Fallback ultra safe
      return res.redirect(302, "https://google.com");
    }

    // 4) Appliquer affiliation + UTM + filtre halal
    const { finalUrl, halalBlocked, affiliateApplied, program } =
      buildAffiliateUrl(target);

    // 5) Tracking Redis (non bloquant)
    const redis = getRedisClient();
    if (redis) {
      redis
        .lpush(
          "mmy:clicks",
          JSON.stringify({
            ts: Date.now(),
            rawUrl: target,
            finalUrl,
            halalBlocked,
            affiliateApplied,
            program,
            ua: req.headers["user-agent"] || "",
          })
        )
        .catch((err) =>
          console.warn("⚠️ Redis push error redirect:", err.message)
        );
    }

    console.log("🔀 Redirect →", finalUrl, {
      halalBlocked,
      affiliateApplied,
      program,
    });

    // 6) Redirect final
    return res.redirect(302, finalUrl);
  } catch (fatal) {
    console.error("🔥 FATAL REDIRECT ERROR:", fatal);
    return res.redirect(302, "https://google.com");
  }
}
