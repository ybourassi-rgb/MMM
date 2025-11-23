export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------- CONFIG PRODUITS ----------------
const AMAZON_PRODUCTS = [
  "https://www.amazon.fr/dp/B09G3HRMVB",
  "https://www.amazon.fr/dp/B08W8DGK3X",
  "https://www.amazon.fr/dp/B0B3DQZHN8",
  // ... garde ta liste ici (inchangée)
  "https://www.amazon.fr/dp/B08TWZPN7V"
];

// Seuils Boost++ (version PRO)
const MIN_RATING = 4.1;
const MIN_REVIEWS = 50;
const MIN_YSCORE = 50;

// Concurrency (Rainforest)
const MAX_CONCURRENCY = 8;

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

// Dédupe URL/ASIN
function dedupeAmazon(urls) {
  const seen = new Set();
  const out = [];
  for (const u of urls) {
    const asin = extractASIN(u) || u;
    if (seen.has(asin)) continue;
    seen.add(asin);
    out.push(u);
  }
  return out;
}

async function mapLimit(arr, limit, fn) {
  const res = [];
  let i = 0;
  const workers = new Array(limit).fill(0).map(async () => {
    while (i < arr.length) {
      const idx = i++;
      res[idx] = await fn(arr[idx], idx);
    }
  });
  await Promise.all(workers);
  return res;
}

// ---------------- SCRAPING AMAZON (Rainforest) ----------------
async function scrapeAmazon(url) {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey) throw new Error("Missing RAINFOREST_API_KEY env var");

  const asin = extractASIN(url);

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "product",
    amazon_domain: "amazon.fr",
  });

  if (asin) params.append("asin", asin);
  else params.append("url", url);

  const apiUrl = `https://api.rainforestapi.com/request?${params.toString()}`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    console.error("Rainforest API HTTP error:", res.status);
    return { title: "Produit Amazon", price: null, rating: 0, reviews: 0 };
  }

  const data = await res.json();
  const p = data.product || {};

  const title = p.title || "Produit Amazon";

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

  if (rating >= 4.7) score += 45;
  else if (rating >= 4.4) score += 38;
  else if (rating >= 4.1) score += 30;
  else if (rating >= 3.8) score += 18;
  else if (rating >= 3.5) score += 8;

  if (reviews > 2000) score += 35;
  else if (reviews > 1000) score += 28;
  else if (reviews > 300) score += 20;
  else if (reviews > 100) score += 12;
  else if (reviews > 50) score += 6;

  if (hasPrice) score += 10;
  if (rating < 3.5 || reviews < 20) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// ---------------- TELEGRAM ----------------
async function sendToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN_DEALS;
  const chatId = process.env.TELEGRAM_CHAT_ID_DEALS;
  if (!token || !chatId) return false;

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  }).catch((e) => {
    console.error("Telegram error:", e);
    return null;
  });

  return !!r?.ok;
}

// ---------------- MAIN LOGIC ----------------
async function runCycle() {
  const amazonTag = process.env.AMAZON_ASSOCIATE_TAG;
  const aliLink =
    process.env.ALIEXPRESS_AFFILIATE_LINK ||
    "https://s.click.aliexpress.com/e/_c3evi6xr";

  // 1) Dedupe + tag
  const tagged = dedupeAmazon(AMAZON_PRODUCTS).map((u) =>
    withAmazonTag(u, amazonTag)
  );

  // 2) Scraping Rainforest avec limite de concurrence
  const detailed = await mapLimit(tagged, MAX_CONCURRENCY, async (url) => {
    const info = await scrapeAmazon(url);
    return { url, info, yscore: computeYScore(info) };
  });

  // 2bis) vire les produits vides
  const cleaned = detailed.filter(
    (d) => !(d.info.rating === 0 && d.info.reviews === 0 && !d.info.price)
  );
  const baseList = cleaned.length ? cleaned : detailed;

  // 3) produits éligibles
  const eligible = baseList
    .filter(
      (d) =>
        d.info.rating >= MIN_RATING &&
        d.info.reviews >= MIN_REVIEWS &&
        d.yscore >= MIN_YSCORE
    )
    .sort((a, b) => b.yscore - a.yscore);

  let mainDeal =
    eligible[0] || baseList.sort((a, b) => b.yscore - a.yscore)[0] || null;

  const messages = [];

  if (mainDeal) {
    const psy = (s) =>
      s >= 80
        ? "🥇 <i>Un des meilleurs deals du moment.</i>\n"
        : s >= 60
        ? "✅ <i>Bon équilibre qualité/avis/prix.</i>\n"
        : "🧐 <i>Deal à vérifier par toi-même.</i>\n";

    const { url, info, yscore } = mainDeal;

    messages.push(
      `🚨 <b>BON PLAN AMAZON #1</b>\n` +
        `⚡ <i>Sélection Money Motor Y : top rapport note/avis/potentiel.</i>\n\n` +
        `🛒 <b>${info.title}</b>\n\n` +
        `⭐ ${info.rating.toFixed(1)} / 5 (${info.reviews} avis)\n` +
        `💰 Prix : ${info.price || "<i>À vérifier</i>"}\n` +
        `📊 Score : <b>${yscore}/100</b>\n` +
        psy(yscore) +
        `👉 <b>Voir l’offre :</b>\n<a href="${url}">${url}</a>\n\n` +
        `<i>Passer par ce lien soutient Money Motor Y ❤️</i>`
    );

    let randomPool = eligible.filter((d) => d.url !== mainDeal.url);
    if (!randomPool.length)
      randomPool = baseList.filter((d) => d.url !== mainDeal.url);

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

  const aliMsg =
    `💥 <b>Deal AliExpress du moment</b>\n` +
    `🔥 <i>Sélection Money Motor Y : potentiel petit prix.</i>\n\n` +
    `👉 <b>Voir l’offre :</b>\n<a href="${aliLink}">${aliLink}</a>\n\n` +
    `<i>Vérifie toujours les frais et délais avant d’acheter.</i>`;

  for (const m of messages) await sendToTelegram(m);
  await sendToTelegram(aliMsg);

  return { ok: true, sent: messages.length + 1 };
}

// ---------------- ROUTE ----------------
function checkSecret(req) {
  const url = new URL(req.url);
  const provided = (url.searchParams.get("secret") || "").trim();
  const expected = (process.env.CRON_SECRET || "").trim();
  if (!expected) return true;
  return provided === expected;
}

export async function GET(req) {
  if (!checkSecret(req)) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await runCycle();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (e) {
    console.error("AutoPublisher error:", e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}

export async function POST(req) {
  return GET(req);
}
