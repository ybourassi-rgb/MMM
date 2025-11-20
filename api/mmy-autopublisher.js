// pages/api/mmy-autopublisher.js

/**
 * MMY AutoPublisher PRO+ — OPTION C (Vercel Optimisé + BOOST + Deal #1 forcé)
 *
 * - Analyse tous les produits Amazon de la liste (en parallèle, rapide)
 * - Bon plan #1 : meilleur produit FILTRÉ (note, avis, Y-Score)
 *   → si aucun produit ne passe le filtre, on prend quand même le meilleur Y-Score
 * - Bon plan #2 : produit Amazon aléatoire (découverte)
 * - + 1 deal AliExpress à chaque run
 * - Textes optimisés pour maximiser les clics (mode BOOST)
 *
 * Compatible CRON Vercel (ex: toutes les 30 min)
 */

// ---------------- CONFIG PRODUITS ----------------

const AMAZON_PRODUCTS = [
  // ----- HIGH TECH -----
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

  // ----- GAMING -----
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

  // ----- MAISON & CUISINE -----
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

  // ----- BEAUTÉ & SOINS -----
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

  // ----- SPORT & FITNESS -----
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

  // ----- BRICOLAGE & OUTILS -----
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

  // ----- PRODUITS À FORT CLIC (petit prix, impulse buy) -----
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

// ---------------- SEUILS QUALITÉ (MODE BOOST assoupli) ----------------
// Option C : on garde un filtre, mais on ne bloque jamais le Deal #1

const MIN_RATING = 3.2;  // note minimum
const MIN_REVIEWS = 3;   // avis minimum
const MIN_YSCORE = 5;    // Y-Score minimum

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

// Extraction simple de l'ASIN depuis une URL Amazon
function extractASIN(url) {
  const m = url.match(/\/dp\/([A-Z0-9]{8,10})/i);
  return m ? m[1] : null;
}

// Vérifie si l'ASIN pointe vers une vraie page produit Amazon
async function isValidAmazonASIN(asin) {
  try {
    const testUrl = `https://www.amazon.fr/dp/${asin}`;
    const res = await fetch(testUrl, { method: "GET" });

    // Si la page ne répond pas 200 → on considère invalide
    if (res.status !== 200) return false;

    const html = await res.text();

    // Messages typiques d'Amazon quand la page n'existe plus
    if (
      html.includes(
        "L'adresse Web que vous avez saisie n’est pas une page fonctionnelle"
      ) ||
      html.includes(
        "L'adresse Web que vous avez saisie n'est pas une page fonctionnelle de notre site"
      )
    ) {
      return false;
    }

    return true;
  } catch (e) {
    console.error("isValidAmazonASIN error:", e);
    return false;
  }
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
    return false;
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

  return true;
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

    // 1) Filtrage des ASIN morts + tag de tous les produits Amazon
    const checkedTagged = await Promise.all(
      AMAZON_PRODUCTS.map(async (rawUrl) => {
        const asin = extractASIN(rawUrl);
        if (!asin) {
          console.log("⚠️ Impossible d'extraire l'ASIN :", rawUrl);
          return null;
        }

        const valid = await isValidAmazonASIN(asin);
        if (!valid) {
          console.log("❌ ASIN mort ou invalide, ignoré :", asin, rawUrl);
          return null;
        }

        return withAmazonTag(rawUrl, amazonTag);
      })
    );

    let tagged = checkedTagged.filter(Boolean);

    // Sécurité : si jamais tout est filtré, on garde la liste brute pour ne pas casser le run
    if (tagged.length === 0) {
      console.log(
        "⚠️ Aucun ASIN validé, fallback sur la liste complète non filtrée."
      );
      tagged = AMAZON_PRODUCTS.map((p) => withAmazonTag(p, amazonTag));
    }

    // 2) Scraping + Y-Score en PARALLÈLE (ultra rapide)
    const detailed = await Promise.all(
      tagged.map(async (url) => {
        const info = await scrapeAmazon(url);
        const yscore = computeYScore(info);
        return { url, info, yscore };
      })
    );

    // 3) Sélection OPTION C

    // a) Liste des produits éligibles (bons selon filtre)
    const eligible = detailed
      .filter(
        (d) =>
          d.info.rating >= MIN_RATING &&
          d.info.reviews >= MIN_REVIEWS &&
          d.yscore >= MIN_YSCORE
      )
      .sort((a, b) => b.yscore - a.yscore);

    const messages = [];
    let sentCount = 0;

    // 1er message : meilleur deal filtré SI dispo, sinon meilleur Y-Score global
    let mainDeal = null;

    if (eligible.length > 0) {
      mainDeal = eligible[0];
    } else {
      // Aucun produit ne passe le filtre → on prend le meilleur Y-Score parmi tous
      const sortedAll = [...detailed].sort((a, b) => b.yscore - a.yscore);
      mainDeal = sortedAll[0] || null;
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

    // Construction des messages Amazon (MODE BOOST)

    if (mainDeal) {
      const { url, info, yscore } = mainDeal;
      const ratingText =
        info.rating && info.reviews
          ? `⭐ <b>${info.rating.toFixed(1)} / 5</b> (${info.reviews} avis)\n`
          : "⭐ <i>Peu d'avis disponibles</i>\n";

      const priceText = info.price
        ? `💰 Prix indicatif : <b>${info.price}</b> (peut évoluer)\n`
        : "💰 Prix : <i>À vérifier directement sur Amazon</i>\n";

      const scoreText =
        yscore > 0 ? `📊 Y-Score MMY : <b>${yscore}/100</b>\n` : "";

      const msg =
        `🔥 <b>Bon plan Amazon #1 (sélection Money Motor Y)</b>\n` +
        `⚡ <i>Meilleur produit détecté automatiquement sur ce run</i>\n\n` +
        `🛒 <b>${info.title}</b>\n\n` +
        ratingText +
        priceText +
        scoreText +
        `👉 <a href="${url}">Voir l'offre sur Amazon</a>\n\n` +
        `<i>Money Motor Y — Priorité aux meilleures opportunités</i>`;

      messages.push(msg);
    }

    if (randomDeal) {
      const { url, info, yscore } = randomDeal;
      const ratingText =
        info.rating && info.reviews
          ? `⭐ <b>${info.rating.toFixed(1)} / 5</b> (${info.reviews} avis)\n`
          : "⭐ <i>Découverte avec peu d'avis (à explorer)</i>\n";

      const priceText = info.price
        ? `💰 Prix indicatif : <b>${info.price}</b>\n`
        : "💰 Prix : <i>Non affiché, à vérifier</i>\n";

      const scoreText =
        yscore > 0 ? `📊 Y-Score MMY : <b>${yscore}/100</b>\n` : "";

      const msg =
        `🌀 <b>Bon plan Amazon #2 (découverte)</b>\n` +
        `🎯 <i>Sélection aléatoire pour trouver des pépites</i>\n\n` +
        `🛒 <b>${info.title}</b>\n\n` +
        ratingText +
        priceText +
        scoreText +
        `👉 <a href="${url}">Voir l'offre sur Amazon</a>\n\n` +
        `<i>Money Motor Y — Découverte automatique</i>`;

      messages.push(msg);
    }

    // 4) AliExpress (toujours envoyé)
    const aliMsg =
      `💥 <b>Deal AliExpress du moment</b>\n` +
      `🔥 <i>Offre trouvée automatiquement par Money Motor Y</i>\n\n` +
      `👉 <a href="${aliLink}">Voir l'offre sur AliExpress</a>\n\n` +
      `<i>Sélection Money Motor Y — Vérifie toujours les frais et délais</i>`;

    // 5) Envoi Telegram (deals + AliExpress)
    for (const msg of messages) {
      const ok = await sendToTelegram(msg);
      if (ok) sentCount++;
      await new Promise((r) => setTimeout(r, 300));
    }
    const okAli = await sendToTelegram(aliMsg);
    if (okAli) sentCount++;

    return res.status(200).json({
      ok: true,
      sent: sentCount,
      amazon_checked: detailed.length,
      amazon_eligible: eligible.length,
      aliexpress: aliLink
    });
  } catch (err) {
    console.error(
      "Erreur AutoPublisher PRO+ OPTION C (Vercel Optimisé + BOOST + Deal forcé):",
      err
    );
    return res.status(500).json({ ok: false, error: err.message });
  }
}
