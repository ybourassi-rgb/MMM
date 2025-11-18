// pages/api/mmy-autopublisher.js

/**
 * MMY AutoPublisher PRO+ — OPTION C
 *
 * - Analyse tous les produits Amazon de la liste
 * - 1er deal : meilleur produit FILTRÉ (note, avis, Y-Score)
 * - 2e deal : produit Amazon aléatoire (même s'il ne passe pas le filtre)
 * - + 1 deal AliExpress à chaque run
 *
 * Résultat : mélange QUALITÉ + DIVERSITÉ (meilleur pour le long terme)
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
    const pJson = html.match(/"price"\s*:\s*"([\d.,]+)"/);
    if (pJson) price = pJson[1];

    if (!price) {
      const pSpan = html.match(
        /<span class="a-offscreen">([\d.,]+)\s*€<\/span>/
      );
      if (pSpan) price = pSpan[1];
    }

    // Note
    let rating = 0;
    const rJson = html.match(/"ratingValue"\s*:\s*"([\d.]+)"/);
    if (rJson) rating = parseFloat(rJson[1]) || 0;

    if (!rating) {
      const rSpan = html.match(
        /<span[^>]*class="a-icon-alt"[^>]*>([\d.,]+) sur 5 étoiles<\/span>/
      );
      if (rSpan) rating = parseFloat(rSpan[1].replace(",", ".")) || 0;
    }

    // Avis
    let reviews = 0;
    const cJson = html.match(/"reviewCount"\s*:\s*"(\d+)"/);
    if (cJson) reviews = parseInt(cJson[1]) || 0;

    if (!reviews) {
      const cSpan = html.match(/(\d[\d\s]*) évaluations?/);
      if (cSpan) reviews = parseInt(cSpan[1].replace(/\s/g, "")) || 0;
    }

    return {
      title,
      price: price ? `${price} €` : null,
      rating,
      reviews
    };
  } catch (e) {
    console.error("scrapeAmazon PRO+ error:", e);
    return {
      title: "Produit Amazon",
      price: null,
      rating: 0,
      reviews: 0
    };
  }
}

// ---------------- Y-SCORE PRO+ ----------------

function computeYScore(info) {
  let score = 0;

  // Rating
  if (info.rating >= 4.7) score += 45;
  else if (info.rating >= 4.3) score += 35;
  else if (info.rating >= 4.0) score += 25;
  else if (info.rating >= 3.5) score += 10;

  // Avis
  if (info.reviews > 2000) score += 30;
  else if (info.reviews > 500) score += 20;
  else if (info.reviews > 100) score += 10;
  else if (info.reviews > 20) score += 5;

  // Bonus si on a un prix
  if (info.price) score += 5;

  if (!info.rating && !info.reviews) score = 0;

  return Math.max(0, Math.min(100, score));
}

// ---------------- TELEGRAM ----------------

async function sendToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN_DEALS;
  const chatId = process.env.TELEGRAM_CHAT_ID_DEALS;

  if (!token || !chatId) {
    console.error("Manque TELEGRAM_BOT_TOKEN_DEALS ou TELEGRAM_CHAT_ID_DEALS");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false
    })
  });
}

// ---------------- HANDLER ----------------

export default async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const amazonTag = process.env.AMAZON_ASSOCIATE_TAG;
    const aliLink =
      process.env.ALIEXPRESS_AFFILIATE_LINK ||
      "https://s.click.aliexpress.com/e/_c4k2HESt";

    // 1) On tag tous les produits Amazon
    const tagged = AMAZON_PRODUCTS.map((p) => withAmazonTag(p, amazonTag));

    // 2) On scrape tous les produits et on calcule Y-Score
    const detailed = [];
    for (const url of tagged) {
      const info = await scrapeAmazon(url);
      const yscore = computeYScore(info);
      detailed.push({ url, info, yscore });
    }

    // 3) Sélection OPTION C

    // a) Liste des produits éligibles (bons)
    const eligible = detailed
      .filter(
        (d) =>
          d.info.rating >= MIN_RATING &&
          d.info.reviews >= MIN_REVIEWS &&
          d.yscore >= MIN_YSCORE
      )
      .sort((a, b) => b.yscore - a.yscore);

    const messages = [];

    // 1er message : meilleur deal filtré (si dispo)
    let mainDeal = null;
    if (eligible.length > 0) {
      mainDeal = eligible[0];
    }

    // 2e message : deal aléatoire (dans tous les cas)
    let randomDeal = pickRandom(detailed);

    // Si le random est le même que le best deal, on en prend un autre si possible
    if (mainDeal && randomDeal && randomDeal.url === mainDeal.url) {
      const others = detailed.filter((d) => d.url !== mainDeal.url);
      if (others.length > 0) {
        randomDeal = pickRandom(others);
      }
    }

    // Construction des messages Amazon

    if (mainDeal) {
      const { url, info, yscore } = mainDeal;
      const ratingText =
        info.rating && info.reviews
          ? `⭐ <b>${info.rating.toFixed(1)} / 5</b> (${info.reviews} avis)\n`
          : "⭐ <i>Pas encore d'avis fiables</i>\n";

      const priceText = info.price
        ? `💰 Prix : <b>${info.price}</b>\n`
        : "💰 Prix : <i>Non disponible</i>\n";

      const scoreText = `📊 Y-Score : <b>${yscore}/100</b>\n`;

      const msg =
        `🔥 <b>Bon plan Amazon #1 (sélection MMY)</b>\n` +
        `🛒 <b>${info.title}</b>\n\n` +
        ratingText +
        priceText +
        scoreText +
        `👉 <a href="${url}">Voir l'offre</a>\n\n` +
        `<i>Money Motor Y — Meilleure sélection du run</i>`;

      messages.push(msg);
    }

    if (randomDeal) {
      const { url, info, yscore } = randomDeal;
      const ratingText =
        info.rating && info.reviews
          ? `⭐ <b>${info.rating.toFixed(1)} / 5</b> (${info.reviews} avis)\n`
          : "⭐ <i>Peu d'avis disponibles</i>\n";

      const priceText = info.price
        ? `💰 Prix : <b>${info.price}</b>\n`
        : "💰 Prix : <i>Non disponible</i>\n";

      const scoreText =
        yscore > 0 ? `📊 Y-Score : <b>${yscore}/100</b>\n` : "";

      const msg =
        `🌀 <b>Bon plan Amazon #2 (découverte)</b>\n` +
        `🛒 <b>${info.title}</b>\n\n` +
        ratingText +
        priceText +
        scoreText +
        `👉 <a href="${url}">Voir l'offre</a>\n\n` +
        `<i>Money Motor Y — Découverte aléatoire</i>`;

      messages.push(msg);
    }

    // 4) AliExpress (toujours envoyé)
    const aliMsg =
      `💥 <b>Deal AliExpress</b>\n` +
      `🔥 Offre du moment sélectionnée par Money Motor Y\n\n` +
      `👉 <a href="${aliLink}">Voir l'offre</a>\n\n` +
      `<i>Sélection Money Motor Y</i>`;

    // 5) Envoi Telegram
    for (const msg of messages) {
      await sendToTelegram(msg);
      await new Promise((r) => setTimeout(r, 1000));
    }
    await sendToTelegram(aliMsg);

    return res.status(200).json({
      ok: true,
      sent: messages.length + 1, // +1 pour AliExpress
      amazon_checked: detailed.length,
      amazon_eligible: eligible.length,
      aliexpress: aliLink
    });
  } catch (err) {
    console.error("Erreur AutoPublisher PRO+ OPTION C:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
