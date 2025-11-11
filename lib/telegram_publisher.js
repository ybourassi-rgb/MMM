// lib/telegram_publisher.js
// Publie sur Telegram. Calcule l'URL affiliée si manquante.

import { enrichItemWithAffiliate } from "./affiliator_core.js";

const BOT = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
const MODE = (process.env.AFFILIATOR_MODE || "live").toLowerCase(); // "live" | "debug"

if (!BOT) console.warn("[telegram_publisher] TELEGRAM_BOT_TOKEN manquant");
if (!CHAT) console.warn("[telegram_publisher] TELEGRAM_CHAT_ID manquant");

export async function publishTelegram(item) {
  const enriched =
    item.affiliateUrl
      ? item
      : enrichItemWithAffiliate(item, {
          network: process.env.AFF_NET,
          siteId: process.env.AFF_SITE_ID,
          subKey: process.env.AFF_SUBKEY,
          userId: "MMM",
        });

  const text =
    `🔥 Nouvelle opportunité (${enriched.score_total ?? "?"})\n` +
    `• ${enriched.title || enriched.name || "Sans titre"}\n` +
    `${enriched.affiliateUrl}`;

  if (MODE === "debug") {
    console.log("[Telegram DEBUG] ", text);
    return { ok: true, debug: true };
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text, disable_web_page_preview: false }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram error ${res.status}: ${body || res.statusText}`);
  }

  return await res.json();
}
