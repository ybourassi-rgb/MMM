// pages/api/mmy-autopublisher.js

/**
 * MMY AutoPublisher PRO+ — OPTION C + DEBUG
 *
 * - Analyse tous les produits Amazon de la liste
 * - Bon plan #1 : meilleur produit FILTRÉ (note, avis, Y-Score)
 * - Bon plan #2 : produit Amazon aléatoire (même s'il ne passe pas le filtre)
 * - + 1 deal AliExpress à chaque run
 * - DEBUG : si ?debug=1 dans l'URL, envoie un message récap des scores
 */

// ---------------- CONFIG PRODUITS ----------------

const AMAZON_PRODUCTS = [
  // 🔥 Cartes graphiques premium
  "https://www.amazon.fr/dp/B08W8DGK3X",
  "https://www.amazon.fr/dp/B09G3HRMVB",

  // 🔥 Écrans PC top qualité
  "https://www.amazon.fr/dp/B07Y8M78NN",
  "https://www.amazon.fr/dp/B08DHLTMMW",
  "https://www.amazon.fr/dp/B09MRYHPLZ",

  // 🔥 SSD / NVMe best sellers
  "https://www.amazon.fr/dp/B09J4HLRV5",
  "https://www.amazon.fr/dp/B0BTHZ2CWH",
  "https://www.amazon.fr/dp/B09X4GXXZ3",

  // 🔥 Casques gaming 4,5★+
  "https://www.amazon.fr/dp/B07Q7S7247",
  "https://www.amazon.fr/dp/B09YHGQF4L",

  // 🔥 Souris gaming best sellers
  "https://www.amazon.fr/dp/B07GBZ4Q68",
  "https://www.amazon.fr/dp/B07YQ4XQ9P",

  // 🔥 Claviers mécaniques très bien notés
  "https://www.amazon.fr/dp/B082G5SPR5",
  "https://www.amazon.fr/dp/B07YDLMH6L",

  // 🔥 Webcam / streaming
  "https://www.amazon.fr/dp/B006JH8T3S"
];

// ---------------- SEUILS QUALITÉ (MODE BOOST) ----------------

const MIN_RATING = 3.8;  // note minimum
const MIN_REVIEWS = 20;  // avis minimum
const MIN_YSCORE = 15;   // Y-Score minimum

// ---------------- UTILS ----------------

function withAmazonTag(url, tag) {
  if (!tag) return url;
  return url.includes("?") ? `${url}&tag=${tag}` : `${url}?tag=${tag}`;
}

function pickRandom(arr) {
  if (!arr.length) return null;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

// ---------------- SCRAPING AMAZON PRO+ (safe) ----------------

async function scrapeAmazon(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8"
      }
    });

    const html = await res.text();

    // Titre
    let title = "Produit Amazon";
    const t = html.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/);
    if (t) title = t[1].replace(/\s+/g, " ").trim();

    // Prix
    let price = null;
