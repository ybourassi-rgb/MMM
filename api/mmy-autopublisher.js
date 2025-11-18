// pages/api/mmy-autopublisher.js

/**
 * Version STABLE MMY AutoPublisher
 * - Amazon + AliExpress
 * - Pas de JSON.parse compliqué
 * - Scraping léger avec regex + fallback
 * - Messages stylés
 */

const AMAZON_PRODUCTS = [
  "https://www.amazon.fr/dp/B0C6JZXQ5J",
  "https://www.amazon.fr/dp/B09G3HRMVB",
  "https://www.amazon.fr/dp/B0B3HRMVB", // tu peux changer/ajouter
  "https://www.amazon.fr/dp/B08W8DGK3X",
  "https://www.amazon.fr/dp/B07PGL2WVS"
];

// ------------ UTILS ------------

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

// ------------ SCRAPING SIMPLE AMAZON (SAFE) ------------

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

    // titre
    let title = "Produit Amazon";
    const t = html.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/);
    if (t) title = t[1].trim();

    // prix
    let price = null;
    const p1 = html.match(/"price"\s*:\s*"([\d.,]+)"/);
    if (p1) price = p1[1];

    // note
    let rating = 0;
    const r1 = html.match(/"ratingValue"\s*:\s*"([\d.]+)"/);
    if (r1) rating = parseFloat(r1[1]) || 0;

    // nombre d'avis
    let reviews = 0;
    const c1 = html.match(/"reviewCount"\s*:\s*"(\d+)"/);
    if (c1) reviews = parseInt(c1[1]) || 0;

    return {
      title,
      price: price ? `${price} €` : null,
      rating,
      reviews
    };
  } catch (e) {
    console.error("scrapeAmazon error (safe fallback):", e);
    return {
      title: "Produit Amazon",
      price: null,
      rating: 0,
      reviews: 0
    };
  }
}

// ------------ Y-SCORE SIMPLE (SAFE) ------------

function computeYScore(info) {
  let score = 0;

  if (info.rating >= 4.5) score += 40;
  else if (info.rating >= 4.0) score += 30;
  else if (info.rating >= 3.5) score += 15;

  if (info.reviews > 500) score += 25;
  else if (info.reviews > 100) score += 15;
  else if (info.reviews > 20) score += 5;

  if (!info.rating && !info.reviews) score = 0;

  return Math.max(0, Math.min(100, score));
}

// ------------ TELEGRAM ------------

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

// ------------ HANDLER ------------

export default async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const amazonTag = process.env.AMAZON_ASSOCIATE_TAG;
    const aliLink =
      process.env.ALIEXPRESS_AFFILIATE_LINK ||
      "https://s.click.aliexpress.com/e/_c4k2HESt";

    const picks = pickRandom(AMAZON_PRODUCTS, 2).map((p) =>
      withAmazonTag(p, amazonTag)
    );

    const messages = [];

    for (let i = 0; i < picks.length; i++) {
      const url = picks[i];
      const info = await scrapeAmazon(url);
      const yscore = computeYScore(info);

      const ratingText =
        info.rating && info.reviews
          ? `⭐ <b>${info.rating.toFixed(1)} / 5</b> (${info.reviews} avis)\n`
          : "⭐ <i>Pas encore d'avis fiables</i>\n";

      const priceText = info.price
        ? `💰 Prix : <b>${info.price}</b>\n`
        : "💰 Prix : <i>Non disponible</i>\n";

      const scoreText = `📊 Y-Score : <b>${yscore}/100</b>\n`;

      const msg =
        `🔥 <b>Bon plan Amazon #${i + 1}</b>\n` +
        `🛒 <b>${info.title}</b>\n\n` +
        ratingText +
        priceText +
        scoreText +
        `👉 <a href="${url}">Voir l'offre</a>\n\n` +
        `<i>Money Motor Y — Deals Auto Boostés</i>`;

      messages.push(msg);
    }

    const aliMsg =
      `💥 <b>Deal AliExpress</b>\n` +
      `🔥 Offre du moment sélectionnée par Money Motor Y\n\n` +
      `👉 <a href="${aliLink}">Voir l'offre</a>\n\n` +
      `<i>Sélection Money Motor Y</i>`;

    for (const msg of messages) {
      await sendToTelegram(msg);
      await new Promise((r) => setTimeout(r, 1000));
    }
    await sendToTelegram(aliMsg);

    return res.status(200).json({
      ok: true,
      sent: messages.length + 1,
      amazon: picks,
      aliexpress: aliLink
    });
  } catch (err) {
    console.error("Erreur AutoPublisher STABLE:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
