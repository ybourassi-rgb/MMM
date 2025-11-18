// pages/api/mmy-autopublisher.js

const AMAZON_PRODUCTS = [
  // 🔁 Tu peux ajouter autant de produits Amazon que tu veux (sans ?tag)
  "https://www.amazon.fr/dp/B0C6JZXQ5J",
  "https://www.amazon.fr/dp/B09G3HRMVB",
  "https://www.amazon.fr/dp/B0B3DQZHN8",
  "https://www.amazon.fr/dp/B08W8DGK3X",
  "https://www.amazon.fr/dp/B07PGL2WVS",
];

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
      disable_web_page_preview: false,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const amazonTag = process.env.AMAZON_ASSOCIATE_TAG;
  const aliLink =
    process.env.ALIEXPRESS_AFFILIATE_LINK ||
    "https://s.click.aliexpress.com/e/_c4k2HESt";

  // 1) Choisir 2 produits Amazon
  const amazonPicks = pickRandom(AMAZON_PRODUCTS, 2).map((u) =>
    withAmazonTag(u, amazonTag)
  );

  // 2) Lien AliExpress
  const aliExpressUrl = aliLink;

  // 3) Préparation des messages
  const messages = [];

  amazonPicks.forEach((url, idx) => {
    messages.push(
      `🔥 Bon plan Amazon #${idx + 1}\n` +
        `👉 ${url}\n\n` +
        `<i>Sélection Money Motor Y</i>`
    );
  });

  messages.push(
    `💥 Bon plan AliExpress\n` +
      `👉 ${aliExpressUrl}\n\n` +
      `<i>Deals Money Motor Y</i>`
  );

  try {
    for (const msg of messages) {
      await sendToTelegram(msg);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // anti flood
    }

    return res.status(200).json({
      ok: true,
      sent: messages.length,
      amazon: amazonPicks,
      aliexpress: aliExpressUrl,
    });
  } catch (err) {
    console.error("Erreur AutoPublisher:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
