// /api/redirect.js
// =================
// Route de redirection MMY + affiliation globale + filtre halal
// - Ajoute UTM pour ton tracking
// - Ajoute paramètres d'affiliation pour certains domaines neutres
// - Ne monétise pas banques / crédit / brokers / trading (haram)

import { Redis } from "@upstash/redis";

// 🌍 MAP AFFILIATION (remplace les REMPLACE_... par TES IDs)
const AFFILIATION_MAP = {
  // AMAZON (multi-pays)
  "amazon.com": ["tag=REMPLACE_AMAZON_COM"],
  "amazon.fr": ["tag=REMPLACE_AMAZON_FR"],
  "amazon.ca": ["tag=REMPLACE_AMAZON_CA"],
  "amazon.de": ["tag=REMPLACE_AMAZON_DE"],
  "amazon.co.uk": ["tag=REMPLACE_AMAZON_UK"],
  "amazon.es": ["tag=REMPLACE_AMAZON_ES"],
  "amazon.it": ["tag=REMPLACE_AMAZON_IT"],
  "amazon.ae": ["tag=REMPLACE_AMAZON_AE"],
  "amazon.sa": ["tag=REMPLACE_AMAZON_SA"],

  // ALIEXPRESS
  "aliexpress.com": ["aff_fcid=REMPLACE_ALIEXPRESS"],

  // BOOKING
  "booking.com": ["aid=REMPLACE_BOOKING"],

  // UDEMY
  "udemy.com": ["utm_source=MMY", "utm_medium=affiliate"],

  // NAMECHEAP (domaines / hosting)
  "namecheap.com": ["aff=REMPLACE_NAMECHEAP"],

  // ➕ Tu peux ajouter d'autres domaines neutres ici :
  // "exemple.com": ["param1=valeur", "param2=valeur"],
};

// ❌ DOMAINES INTERDITS (banques, trading, crédit, etc.)
const HARAM_DOMAINS = [
  "binance.com",
  "binance.us",
  "coinbase.com",
  "kraken.com",
  "etoro.com",
  "plus500.com",
  "revolut.com",
  "wise.com",
  "paypal.com",
  "visa.com",
  "mastercard.com",
  "americanexpress.com",
  "hsbc.com",
  "citibank.com",
  "ing.com",
  "barclays.com",
  "santander.com",
  "credit-agricole.fr",
  "societegenerale.fr",
];

// Helpers
function normalizeDomain(hostname) {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function isHaramDomain(hostname) {
  const domain = normalizeDomain(hostname);

  if (HARAM_DOMAINS.includes(domain)) return true;

  const suspiciousWords = [
    "bank",
    "credit",
    "loan",
    "broker",
    "trading",
    "forex",
    "cfd",
    "derivative",
  ];

  return suspiciousWords.some((w) => domain.includes(w));
}

function getAffiliationParamsForDomain(hostname) {
  const domain = normalizeDomain(hostname);
  return AFFILIATION_MAP[domain] || null;
}

// =======================
//  HANDLER PRINCIPAL
// =======================
export default async function handler(req, res) {
  try {
    // Méthode
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "Use GET" });
    }

    // Paramètre url
    const raw = req.query.url;
    if (!raw) {
      return res.status(400).json({ ok: false, error: "Missing url" });
    }

    // Normalisation de l'URL
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
      return res.redirect(302, "https://google.com"); // fallback safe
    }

    const urlObj = new URL(target);
    const hostname = urlObj.hostname;

    // --- FILTRE HALAL + AFFILIATION ---
    let affiliationParams = null;

    if (!isHaramDomain(hostname)) {
      affiliationParams = getAffiliationParamsForDomain(hostname);
    } else {
      console.log("🛑 Domaine exclu (haram) → pas d'affiliation:", hostname);
    }

    if (affiliationParams && Array.isArray(affiliationParams)) {
      affiliationParams.forEach((entry) => {
        try {
          const [k, v] = entry.split("=");
          if (k && v) {
            urlObj.searchParams.set(k, v);
          }
        } catch (e) {
          console.warn("⚠️ Mauvais format param affiliation:", entry);
        }
      });
      console.log("💰 Affiliation appliquée pour:", hostname);
    }

    // UTM global MMY
    urlObj.searchParams.set("utm_source", "MMY");
    urlObj.searchParams.set("utm_medium", "telegram");
    urlObj.searchParams.set("utm_campaign", "MMY_DEALS");

    const finalUrl = urlObj.toString();

    // --- Redis (optionnel) ---
    let redis = null;
    try {
      const url =
        process.env.UPSTASH_REDIS_REST_URL ||
        process.env.UPSTASH_REDIS_URL ||
        process.env.UPSTASH_REST_URL;

      const token =
        process.env.UPSTASH_REDIS_REST_TOKEN ||
        process.env.UPSTASH_REDIS_TOKEN ||
        process.env.UPSTASH_REST_TOKEN;

      if (url && token) {
        redis = new Redis({ url, token });
      }
    } catch (e) {
      console.warn("⚠️ Redis init error:", e.message);
    }

    if (redis) {
      redis
        .lpush(
          "mmy:clicks",
          JSON.stringify({
            ts: Date.now(),
            hostname: normalizeDomain(hostname),
            finalUrl,
            ua: req.headers["user-agent"] || "",
          })
        )
        .catch((err) =>
          console.warn("⚠️ Redis push error (redirect):", err.message)
        );
    }

    console.log("🔀 Redirect →", finalUrl);
    return res.redirect(302, finalUrl);
  } catch (fatal) {
    console.error("🔥 FATAL REDIRECT ERROR:", fatal);
    return res.redirect(302, "https://google.com");
  }
}
