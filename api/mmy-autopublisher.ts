// pages/api/mmy-autopublisher.ts
import type { NextApiRequest, NextApiResponse } from "next";

const AMAZON_PRODUCTS: string[] = [
  // 🔁 Remplace / ajoute tes produits Amazon ici (sans tag ou avec, comme tu veux)
  "https://www.amazon.fr/dp/B0C6JZXQ5J",
  "https://www.amazon.fr/dp/B09G3HRMVB",
  "https://www.amazon.fr/dp/B0B3DQZHN8",
  "https://www.amazon.fr/dp/B08W8DGK3X",
  "https://www.amazon.fr/dp/B07PGL2WVS",
];

function withAmazonTag(url: string, tag: string | undefined) {
  if (!tag) return url;
  return url.includes("?") ? `${url}&tag=${tag}` : `${url}?tag=${tag}`;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  while (copy.length && result.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

async function sendToTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN_DEALS;
  const chatId = process.env.TELEGRAM_CHAT_ID_DEALS;

  if (!token || !chatId) {
    console.error("TELEGRAM env vars manquantes");
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // On autorise GET pour test + POST pour le cron
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const amazonTag = process.env.AMAZON_ASSOCIATE_TAG;
  const aliLink = process.env.ALIEXPRESS_AFFILIATE_LINK;

  if (!aliLink) {
    console.error("ALIEXPRESS_AFFILIATE_LINK manquant");
  }

  // 1) On choisit 2 produits Amazon
  const amazonPicks = pickRandom(AMAZON_PRODUCTS, 2).map((u) =>
    withAmazonTag(u, amazonTag)
  );

  // 2) On prend 1 lien AliExpress (le tien global)
  const aliExpressUrl = aliLink || "https://s.click.aliexpress.com/e/_c4k2HESt";

  // 3) Messages à envoyer
  const messages: string[] = [];

  amazonPicks.forEach((url, idx) => {
    messages.push(
      `🔥 Bon plan Amazon #${idx + 1}\n` +
        `Découvre l'offre ici 👉 ${url}\n\n` +
        `<i>Alerte deals by Money Motor Y</i>`
    );
  });

  messages.push(
    `💥 Bon plan AliExpress\n` +
      `Voir l'offre 👉 ${aliExpressUrl}\n\n` +
      `<i>Sélection Money Motor Y</i>`
  );

  try {
    for (const msg of messages) {
      await sendToTelegram(msg);
      // petite pause pour éviter le flood
      await new Promise((r) => setTimeout(r, 1000));
    }

    return res.status(200).json({
      ok: true,
      sent: messages.length,
      amazon: amazonPicks,
      aliexpress: aliExpressUrl,
    });
  } catch (e: any) {
    console.error("Erreur Auto-Publisher:", e);
    return res.status(500).json({ ok: false, error: e?.message || "error" });
  }
}
