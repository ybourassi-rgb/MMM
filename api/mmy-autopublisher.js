// pages/api/mmy-autopublisher.js

/**
 * MMY AutoPublisher PRO+ — OPTION C (Vercel Optimisé + BOOST++)
 *
 * - Utilise Rainforest API pour les données Amazon (fiable)
 * - Filtre les ASIN morts avant appel API
 * - Analyse tous les produits Amazon (en parallèle)
 * - Bon plan #1 : meilleur produit filtré (YSCORE + avis + note)
 * - Bon plan #2 : produit Amazon "découverte" (moins strict, mais jamais totalement vide)
 * - + 1 deal AliExpress
 * - Messages optimisés conversion : version BOOST++
 *
 * Compatible CRON Vercel (toutes les 30 min conseillé)
 */

// ---------------- CONFIG PRODUITS ----------------

const AMAZON_PRODUCTS = [
  "https://www.amazon.fr/dp/B09G3HRMVB",
  "https://www.amazon.fr/dp/B08W8DGK3X",
  "https://www.amazon.fr/dp/B0B3DQZHN8",
  "https://www.amazon.fr/dp/B07PGL2WVS",
  "https://www.amazon.fr/dp/B09J4HLRV5",
  "https://www.amazon.fr/dp/B0BTHZ2CWH",
  "https://www.amazon.fr/dp/B09X4GXXZ3",
  "https://www.amazon.fr/dp/B08N5WRWNW",
  "https://www.amazon.fr/dp/B07Y8M78NN",
  "https://www.amazon.fr/dp/B08DHLTMMW",
  "https://www.amazon.fr/dp/B09MRYHPLZ",
  "https://www.amazon.fr/dp/B0BLTB5B9B",
  "https://www.amazon.fr/dp/B0B3MMMW5P",
  "https://www.amazon.fr/dp/B096Y98M4Z",
  "https://www.amazon.fr/dp/B07WFQVPVW",
  "https://www.amazon.fr/dp/B08L8L9TCW",
  "https://www.amazon.fr/dp/B07GBZ4Q68",
  "https://www.amazon.fr/dp/B07YQ4XQ9P",
  "https://www.amazon.fr/dp/B07Q7S7247",
  "https://www.amazon.fr/dp/B09YHGQF4L",
  "https://www.amazon.fr/dp/B082G5SPR5",
  "https://www.amazon.fr/dp/B07YDLMH6L",
  "https://www.amazon.fr/dp/B0BM74PX44",
  "https://www.amazon.fr/dp/B09L8XG9Y3",
  "https://www.amazon.fr/dp/B07KQXHC64",
  "https://www.amazon.fr/dp/B09VSFPHL9",
  "https://www.amazon.fr/dp/B0B6QXZG9G",
  "https://www.amazon.fr/dp/B0B7P8GF3F",
  "https://www.amazon.fr/dp/B07K33BPV5",
  "https://www.amazon.fr/dp/B0BWNJ6BYH",
  "https://www.amazon.fr/dp/B09F2X3Y7H",
  "https://www.amazon.fr/dp/B07N2ZHF4J",
  "https://www.amazon.fr/dp/B07T2GMBJ5",
  "https://www.amazon.fr/dp/B08N6ZJ6L2",
  "https://www.amazon.fr/dp/B0725GYNG6",
  "https://www.amazon.fr/dp/B0B6G75RHT",
  "https://www.amazon.fr/dp/B07M7N6LB3",
  "https://www.amazon.fr/dp/B009P48JOC",
  "https://www.amazon.fr/dp/B08SWZPVQX",
  "https://www.amazon.fr/dp/B01M0C3D0W",
  "https://www.amazon.fr/dp/B09NQZB8G7",
  "https://www.amazon.fr/dp/B073V9MZ6A",
  "https://www.amazon.fr/dp/B07Q6CPQ6S",
  "https://www.amazon.fr/dp/B07PPDG1VW",
  "https://www.amazon.fr/dp/B07N1HCW4B",
  "https://www.amazon.fr/dp/B07T2GMBJ5",
  "https://www.amazon.fr/dp/B08CVTTNNH",
  "https://www.amazon.fr/dp/B07BJ41D3R",
  "https://www.amazon.fr/dp/B01LTHM8LG",
  "https://www.amazon.fr/dp/B07PPD2F3D",
  "https://www.amazon.fr/dp/B0B1WFCQHD",
  "https://www.amazon.fr/dp/B07H9L29N8",
  "https://www.amazon.fr/dp/B099W51K3B",
  "https://www.amazon.fr/dp/B07W4QJ2DT",
  "https://www.amazon.fr/dp/B07P6LM4BW",
  "https://www.amazon.fr/dp/B086Q24GT2",
  "https://www.amazon.fr/dp/B097BCGQ8R",
  "https://www.amazon.fr/dp/B08HGRQ268",
  "https://www.amazon.fr/dp/B099KN4LTN",
  "https://www.amazon.fr/dp/B0B9LT2MDJ",
  "https://www.amazon.fr/dp/B08FYZ3P3F",
  "https://www.amazon.fr/dp/B07KPNGQBK",
  "https://www.amazon.fr/dp/B07H4VWJRM",
  "https://www.amazon.fr/dp/B06XKCH3VD",
  "https://www.amazon.fr/dp/B07RBF59J8",
  "https://www.amazon.fr/dp/B0B6BF8S72",
  "https://www.amazon.fr/dp/B08S8WRTLY",
  "https://www.amazon.fr/dp/B07CVTV2X9",
  "https://www.amazon.fr/dp/B0751K39Y1",
  "https://www.amazon.fr/dp/B07GQ1C6KJ",
  "https://www.amazon.fr/dp/B07M6MFXM6",
  "https://www.amazon.fr/dp/B081TT7J12",
  "https://www.amazon.fr/dp/B09GQD3FRB",
  "https://www.amazon.fr/dp/B07GVDMJH8",
  "https://www.amazon.fr/dp/B07GQWZFQS",
  "https://www.amazon.fr/dp/B08C5J7Q8Z",
  "https://www.amazon.fr/dp/B01N7S0IPR",
  "https://www.amazon.fr/dp/B08CXP5LXW",
  "https://www.amazon.fr/dp/B08FRG5J3Y",
  "https://www.amazon.fr/dp/B08H6WQX6Z",
  "https://www.amazon.fr/dp/B000RFDZMU",
  "https://www.amazon.fr/dp/B07GWZ4GQF",
  "https://www.amazon.fr/dp/B08XLPD4PT",
  "https://www.amazon.fr/dp/B089QHBR1Y",
  "https://www.amazon.fr/dp/B07NPBHB7Z",
  "https://www.amazon.fr/dp/B08LGCP4TQ",
  "https://www.amazon.fr/dp/B07XVXQ8D8",
  "https://www.amazon.fr/dp/B08FDN1XQY",
  "https://www.amazon.fr/dp/B07W5VQGW8",
  "https://www.amazon.fr/dp/B08R9LQF4Q",
  "https://www.amazon.fr/dp/B08TWZPN7V"
];

// Seuils Boost++ (version PRO)
const MIN_RATING = 4.1;   // minimum 4,1 / 5
const MIN_REVIEWS = 50;   // minimum 50 avis
const MIN_YSCORE = 50;    // minimum 50 / 100

// ---------------- UTILS ----------------

function withAmazonTag(url, tag) {
  if (!tag) return url;
  return url.includes("?") ? `${url}&tag=${tag}` : `${url}?tag=${tag}`;
}

function pickRandom(arr) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function extractASIN(url) {
  const m = url.match(/\/dp\/([A-Z0-9]{8,10})/i);
  return m ? m[1] : null;
}

async function isValidAmazonASIN(asin) {
  try {
    const testUrl = `https://www.amazon.fr/dp/${asin}`;
    const res = await fetch(testUrl);
    if (res.status !== 200) return false;

    const html = await res.text();
    if (
      html.includes("n’est pas une page fonctionnelle") ||
      html.includes("n'est pas une page fonctionnelle")
    )
      return false;

    return true;
  } catch {
    return false;
  }
}

// ---------------- SCRAPING AMAZON (via Rainforest API) ----------------

async function scrapeAmazon(url) {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RAINFOREST_API_KEY env var");
  }

  const asin = extractASIN(url);

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "product",
    amazon_domain: "amazon.fr"
  });

  if (asin) {
    params.append("asin", asin);
  } else {
    params.append("url", url);
  }

  const apiUrl = `https://api.rainforestapi.com/request?${params.toString()}`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    console.error("Rainforest API HTTP error:", res.status);
    return { title: "Produit Amazon", price: null, rating: 0, reviews: 0 };
  }

  const data = await res.json();
  const p = data.product || {};

  const title = p.title || "Produit Amazon";

  // Prix : on essaie d'abord le buybox, sinon prix générique
  const priceValue =
    p.buybox_winner?.price?.value ??
    p.price?.value ??
    null;

  const price =
    typeof priceValue === "number"
      ? `${priceValue.toFixed(2).replace(".", ",")} €`
      : null;

  const rating = typeof p.rating === "number" ? p.rating : 0;

  const reviews =
    typeof p.ratings_total === "number"
      ? p.ratings_total
      : typeof p.reviews_total === "number"
      ? p.reviews_total
      : 0;

  return { title, price, rating, reviews };
}

// ---------------- Y-SCORE ----------------

function computeYScore(info) {
  const rating = Number(info.rating) || 0;
  const reviews = Number(info.reviews) || 0;
  const hasPrice = !!info.price;

  let score = 0;

  // 1) Note ⭐ — max 45 pts
  if (rating >= 4.7) score += 45;
  else if (rating >= 4.4) score += 38;
  else if (rating >= 4.1) score += 30;
  else if (rating >= 3.8) score += 18;
  else if (rating >= 3.5) score += 8;

  // 2) Volume d'avis 👥 — max 35 pts
  if (reviews > 2000) score += 35;
  else if (reviews > 1000) score += 28;
  else if (reviews > 300) score += 20;
  else if (reviews > 100) score += 12;
  else if (reviews > 50) score += 6;

  // 3) Prix présent 💰 — max 10 pts
  if (hasPrice) score += 10;

  // 4) Malus si rating faible ou très peu d'avis
  if (rating < 3.5 || reviews < 20) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// ---------------- TELEGRAM ----------------

async function sendToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN_DEALS;
  const chatId = process.env.TELEGRAM_CHAT_ID_DEALS;

  if (!token || !chatId) return false;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false
    })
  });

  return true;
}

// ---------------- HANDLER ----------------

export default async function handler(req, res) {
  try {
    const amazonTag = process.env.AMAZON_ASSOCIATE_TAG;
    const aliLink =
      process.env.ALIEXPRESS_AFFILIATE_LINK ||
      "https://s.click.aliexpress.com/e/_c3evi6xr";

    // 1) Filtrage ASIN morts
    const checked = await Promise.all(
      AMAZON_PRODUCTS.map(async (url) => {
        const asin = extractASIN(url);
        if (!asin) return null;
        const valid = await isValidAmazonASIN(asin);
        return valid ? withAmazonTag(url, amazonTag) : null;
      })
    );

    let tagged = checked.filter(Boolean);
    if (!tagged.length)
      tagged = AMAZON_PRODUCTS.map((u) => withAmazonTag(u, amazonTag));

    // 2) Scraping via Rainforest
    const detailed = await Promise.all(
      tagged.map(async (url) => {
        const info = await scrapeAmazon(url);
        return { url, info, yscore: computeYScore(info) };
      })
    );

    // 2bis) On vire les produits complètement vides : 0 étoile, 0 avis, pas de prix
    const cleaned = detailed.filter(
      (d) =>
        !(d.info.rating === 0 && d.info.reviews === 0 && !d.info.price)
    );

    // Si vraiment tout est vide, on garde quand même detailed
    const baseList = cleaned.length ? cleaned : detailed;

    // 3) Sélection des deals éligibles (bons plans sérieux)
    const eligible = baseList
      .filter(
        (d) =>
          d.info.rating >= MIN_RATING &&
          d.info.reviews >= MIN_REVIEWS &&
          d.yscore >= MIN_YSCORE
      )
      .sort((a, b) => b.yscore - a.yscore);

    // mainDeal = meilleur plan (sinon le meilleur produit de baseList)
    let mainDeal =
      eligible[0] || baseList.sort((a, b) => b.yscore - a.yscore)[0] || null;

    const messages = [];

    if (mainDeal) {
      // Psyline dynamique
      const psy = (s) =>
        s >= 80
          ? "🥇 <i>Un des meilleurs deals du moment.</i>\n"
          : s >= 60
          ? "✅ <i>Bon équilibre qualité/avis/prix.</i>\n"
          : "🧐 <i>Produits à vérifier par toi-même.</i>\n";

      // ----------- MESSAGE AMAZON #1 -----------
      {
        const { url, info, yscore } = mainDeal;

        messages.push(
          `🚨 <b>BON PLAN AMAZON #1</b>\n` +
            `⚡ <i>Sélection Money Motor Y : meilleur rapport note/avis/potentiel.</i>\n\n` +
            `🛒 <b>${info.title}</b>\n\n` +
            `⭐ ${info.rating.toFixed(1)} / 5 (${info.reviews} avis)\n` +
            `💰 Prix : ${info.price || "<i>À vérifier</i>"}\n` +
            `📊 Score : <b>${yscore}/100</b>\n` +
            psy(yscore) +
            `👉 <b>Voir l’offre :</b>\n<a href="${url}">${url}</a>\n\n` +
            `<i>Si tu passes par ce lien avant d’acheter, tu soutiens Money Motor Y ❤️</i>`
        );
      }

      // ----------- MESSAGE AMAZON #2 (Découverte) -----------
      // 1) On essaie de prendre un autre "bon plan" parmi les éligibles
      let randomPool = eligible.filter(
        (d) => d.url !== (mainDeal?.url || null)
      );

      // 2) Si pas de second bon plan, on élargit à n'importe quel autre produit de baseList
      if (!randomPool.length) {
        randomPool = baseList.filter(
          (d) => d.url !== (mainDeal?.url || null)
        );
      }

      const randomDeal = pickRandom(randomPool);

      if (randomDeal) {
        const { url, info, yscore } = randomDeal;

        messages.push(
          `🌀 <b>AMAZON #2 — Découverte</b>\n` +
            `🎯 <i>Pépites potentielles détectées automatiquement.</i>\n\n` +
            `🛒 <b>${info.title}</b>\n\n` +
            `⭐ ${info.rating.toFixed(1)} / 5 (${info.reviews} avis)\n` +
            `💰 Prix : ${info.price || "<i>À vérifier</i>"}\n` +
            `📊 Score : <b>${yscore}/100</b>\n` +
            `👉 <b>Voir l’offre :</b>\n<a href="${url}">${url}</a>\n\n`
        );
      }
    }

    // ----------- MESSAGE ALIEXPRESS -----------
    const aliMsg =
      `💥 <b>Deal AliExpress du moment</b>\n` +
      `🔥 <i>Sélection Money Motor Y : fort potentiel petit prix.</i>\n\n` +
      `👉 <b>Voir l’offre :</b>\n<a href="${aliLink}">${aliLink}</a>\n\n` +
      `<i>Vérifie toujours les frais et délais avant d’acheter.</i>`;

    // Envoi Telegram
    for (const m of messages) await sendToTelegram(m);
    await sendToTelegram(aliMsg);

    return res
      .status(200)
      .json({ ok: true, message: "Deals envoyés sur Telegram" });
  } catch (err) {
    console.error("AutoPublisher error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
