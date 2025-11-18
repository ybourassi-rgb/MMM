// pages/api/mmy-autopublisher.js

/**
 * 🔥 Version améliorée MMY AutoPublisher
 * Options activées :
 *  A = Messages stylés
 *  B = Mini Y-Score
 *  C = Récupération prix, promo, étoiles Amazon
 */

const AMAZON_PRODUCTS = [
  "https://www.amazon.fr/dp/B0C6JZXQ5J",
  "https://www.amazon.fr/dp/B09G3HRMVB",
  "https://www.amazon.fr/dp/B0B3DQZHN8",
  "https://www.amazon.fr/dp/B08W8DGK3X",
  "https://www.amazon.fr/dp/B07PGL2WVS"
];

// ---------------------------------------------------------------------------
// A) AJOUTER TON TAG AMAZON
// ---------------------------------------------------------------------------
function withAmazonTag(url, tag) {
  if (!tag) return url;
  return url.includes("?") ? `${url}&tag=${tag}` : `${url}?tag=${tag}`;
}

// ---------------------------------------------------------------------------
// B) MINI Y-SCORE : (simple mais efficace) 0 à 100
// ---------------------------------------------------------------------------
function computeYScore({ price, stars, reviews }) {
  let score = 0;

  if (!price) score += 20;
  if (price < 20) score += 20;
  if (price < 50) score += 10;

  if (stars >= 4.5) score += 30;
  else if (stars >= 4.0) score += 20;

  if (reviews > 500) score += 20;
  else if (reviews > 100) score += 10;

  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// C) SCRAP AMAZON : prix + promo + étoiles + reviews
// ---------------------------------------------------------------------------
async function scrapeAmazon(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const get = (regex) => {
      const m = html.match(regex);
      return m ? m[1] : null;
    };

    const price = get(/"price":"([\d.,]+)"/);
    const stars = get(/"ratingValue":"([\d.]+)"/);
    const reviews = get(/"reviewCount":"(\d+)"/);

    return {
      price: price ? `${price} €` : "Non disponible",
      stars: stars ? parseFloat(stars) : 0,
      reviews: reviews ? parseInt(reviews) : 0
    };

  } catch (e) {
    return {
      price: "Indispo",
      stars: 0,
      reviews: 0
    };
  }
}

// ---------------------------------------------------------------------------
// TELEGRAM
// ---------------------------------------------------------------------------
async function sendToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN_DEALS;
  const chatId = process.env.TELEGRAM_CHAT_ID_DEALS;

  if (!token || !chatId) return;

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

// ---------------------------------------------------------------------------
// RANDOM PICK
// ---------------------------------------------------------------------------
function pickRandom(arr, count) {
  const copy = [...arr];
  const result = [];
  while (copy.length && result.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const amazonTag = process.env.AMAZON_ASSOCIATE_TAG;
  const aliLink =
    process.env.ALIEXPRESS_AFFILIATE_LINK ||
    "https://s.click.aliexpress.com/e/_c4k2HESt";

  // --- AMAZON ---
  const picks = pickRandom(AMAZON_PRODUCTS, 2).map((p) =>
    withAmazonTag(p, amazonTag)
  );

  const amazonMessages = [];

  for (let i = 0; i < picks.length; i++) {
    const url = picks[i];
    const info = await scrapeAmazon(url);
    const yscore = computeYScore(info);

    amazonMessages.push(
      `🔥 <b>Bon plan Amazon #${i + 1}</b>\n` +
      `⭐ <b>${info.stars} / 5</b> (${info.reviews} avis)\n` +
      `💸 Prix : <b>${info.price}</b>\n` +
      `📊 Y-Score : <b>${yscore}/100</b>\n\n` +
      `👉 <a href="${url}">Voir l'offre</a>\n\n` +
      `<i>Money Motor Y — Deals Auto Boostés</i>`
    );
  }

  // --- ALIEXPRESS ---
  const aliMsg =
    `💥 <b>Deal AliExpress</b>\n` +
    `🔥 Offre du moment\n` +
    `👉 <a href="${aliLink}">Voir l'offre</a>\n\n` +
    `<i>Sélection Money Motor Y</i>`;

  // ENVOI
  try {
    for (const m of amazonMessages) {
      await sendToTelegram(m);
      await new Promise((r) => setTimeout(r, 1000));
    }

    await sendToTelegram(aliMsg);

    return res.status(200).json({
      ok: true,
      sent: amazonMessages.length + 1,
      amazon: picks,
      aliexpress: aliLink
    });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
