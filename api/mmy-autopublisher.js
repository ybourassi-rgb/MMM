// pages/api/mmy-autopublisher.js

/**
 * MMY AutoPublisher PRO
 * - Amazon + AliExpress
 * - Scraping hybride Amazon (JSON-LD + fallback)
 * - Prix, réduction, étoiles, avis, Y-Score
 * - Messages Telegram stylés
 */

const AMAZON_PRODUCTS = [
  "https://www.amazon.fr/dp/B0C6JZXQ5J",
  "https://www.amazon.fr/dp/B09G3HRMVB",
  "https://www.amazon.fr/dp/B0B3DQZHN8",
  "https://www.amazon.fr/dp/B08W8DGK3X",
  "https://www.amazon.fr/dp/B07PGL2WVS"
];

// ---------- UTIL ----------

function withAmazonTag(url, tag) {
  if (!tag) return url;
  return url.includes("?") ? `${url}&tag=${tag}` : `${url}?tag=${tag}`;
}

function pickRandom(arr, count) {
  const copy = [...arr];
  const result = [];
  while (copy.length && result.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// ---------- SCRAPING AMAZON (HYBRIDE) ----------

async function scrapeAmazon(url) {
  try {
    const res = await fetch(url, {
      headers: {
        // user-agent "humain" pour ne pas être bloqué trop vite
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8"
      }
    });

    const html = await res.text();

    // 1) On cherche les blocs JSON-LD
    const scripts = [...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    )];

    let product = null;

    for (const m of scripts) {
      try {
        const json = JSON.parse(m[1].trim());
        // parfois c'est un tableau de JSON-LD
        if (Array.isArray(json)) {
          for (const item of json) {
            if (item && (item["@type"] === "Product" || item.aggregateRating)) {
              product = item;
              break;
            }
          }
        } else if (json && (json["@type"] === "Product" || json.aggregateRating)) {
          product = json;
        }
        if (product) break;
      } catch {
        // ignore parse errors
      }
    }

    let title = null;
    let price = null;
    let oldPrice = null;
    let currency = "€";
    let rating = 0;
    let reviews = 0;

    if (product) {
      title = product.name || null;

      // prix : plusieurs structures possibles
      if (product.offers) {
        if (Array.isArray(product.offers)) {
          const offer = product.offers[0];
          price = offer.price || offer.priceSpecification?.price || null;
          oldPrice =
            offer.priceSpecification?.priceCurrency === "EUR" &&
            offer.priceSpecification?.priceBeforeDiscount
              ? offer.priceSpecification.priceBeforeDiscount
              : null;
          currency = offer.priceCurrency || "€";
        } else {
          const offer = product.offers;
          price = offer.price || offer.priceSpecification?.price || null;
          oldPrice =
            offer.priceSpecification?.priceBeforeDiscount ||
            offer.priceSpecification?.referencePrice ||
            null;
          currency = offer.priceCurrency || "€";
        }
      }

      if (product.aggregateRating) {
        rating = parseFloat(product.aggregateRating.ratingValue || "0") || 0;
        reviews = parseInt(product.aggregateRating.reviewCount || "0") || 0;
      }
    }

    // 2) fallback : regex rapides si JSON-LD vide
    if (!title) {
      const m = html.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/);
      if (m) title = m[1].trim();
    }

    if (!price) {
      const mp = html.match(
       
