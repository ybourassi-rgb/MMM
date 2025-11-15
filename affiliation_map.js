// affiliation_map.js
// ==================
// Ici tu définis les domaines qui peuvent générer des commissions
// ET tu choisis les paramètres d'affiliation à ajouter à l'URL.
//
// IMPORTANT : remplace les valeurs "REMPLACE_CI_DESSUS" par TES vrais IDs
// d'affiliation (Amazon, Booking, AliExpress, etc.)

export const AFFILIATION_MAP = {
  // 🌍 AMAZON (différents pays)
  "amazon.com": ["tag=REMPLACE_AMAZON_COM"],
  "amazon.fr": ["tag=REMPLACE_AMAZON_FR"],
  "amazon.ca": ["tag=REMPLACE_AMAZON_CA"],
  "amazon.de": ["tag=REMPLACE_AMAZON_DE"],
  "amazon.co.uk": ["tag=REMPLACE_AMAZON_UK"],
  "amazon.es": ["tag=REMPLACE_AMAZON_ES"],
  "amazon.it": ["tag=REMPLACE_AMAZON_IT"],
  "amazon.ae": ["tag=REMPLACE_AMAZON_AE"],
  "amazon.sa": ["tag=REMPLACE_AMAZON_SA"],

  // 🌍 ALIEXPRESS (global)
  // Tu adapteras le paramètre selon ton réseau d'affiliation
  "aliexpress.com": ["aff_fcid=REMPLACE_ALIEXPRESS"],

  // 🌍 BOOKING (voyages / hôtels)
  "booking.com": ["aid=REMPLACE_BOOKING"],

  // 🌍 UDEMY (cours en ligne)
  "udemy.com": ["utm_source=MMY", "utm_medium=affiliate"],

  // 🌍 NAMECHEAP (domaine / hosting, neutre)
  "namecheap.com": ["aff=REMPLACE_NAMECHEAP"],

  // Tu peux ajouter d’autres domaines neutres ici
  // "exemple.com": ["param1=valeur", "param2=valeur"],
};

// Liste des domaines à NE JAMAIS monétiser (finance / usure / crédit)
export const HARAM_DOMAINS = [
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

// Petits helpers
export function isHaramDomain(hostname) {
  const domain = hostname.replace(/^www\./, "").toLowerCase();

  if (HARAM_DOMAINS.includes(domain)) return true;

  // Filtre générique : banque / crédit / prêt / loan / broker / trading
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

export function getAffiliationParamsForDomain(hostname) {
  const domain = hostname.replace(/^www\./, "").toLowerCase();
  return AFFILIATION_MAP[domain] || null;
}
