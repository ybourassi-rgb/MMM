// lib/telegram_publisher.js
// Publie un item vers le bon canal Telegram (deals, auto, immo, crypto, halal)
// Variables d'env attendues (Vercel):
//   - TELEGRAM_BOT_TOKEN (+ optionnel _DEALS/_AUTO/_IMMO/_CRYPTO/_HALAL)
//   - TELEGRAM_CHAT_ID (+ optionnel _DEALS/_AUTO/_IMMO/_CRYPTO/_HALAL)
//   - AFFILIATOR_MODE=debug|live (debug => log sans envoyer)

import { enrichItemWithAffiliate } from "./affiliator_core.js";

const MODE = (process.env.AFFILIATOR_MODE || "live").toLowerCase();

const MAP = {
  deals: {
    token: process.env.TELEGRAM_BOT_TOKEN_DEALS || process.env.TELEGRAM_BOT_TOKEN,
    chat:  process.env.TELEGRAM_CHAT_ID_DEALS  || process.env.TELEGRAM_CHAT_ID,
  },
  auto: {
    token: process.env.TELEGRAM_BOT_TOKEN_AUTO || process.env.TELEGRAM_BOT_TOKEN,
    chat:  process.env.TELEGRAM_CHAT_ID_AUTO  || process.env.TELEGRAM_CHAT_ID,
  },
  immo: {
    token: process.env.TELEGRAM_BOT_TOKEN_IMMO || process.env.TELEGRAM_BOT_TOKEN,
    chat:  process.env.TELEGRAM_CHAT_ID_IMMO  || process.env.TELEGRAM_CHAT_ID,
  },
  crypto: {
    token: process.env.TELEGRAM_BOT_TOKEN_CRYPTO || process.env.TELEGRAM_BOT_TOKEN,
    chat:  process.env.TELEGRAM_CHAT_ID_CRYPTO  || process.env.TELEGRAM_CHAT_ID,
  },
  halal: {
    token: process.env.TELEGRAM_BOT_TOKEN_HALAL || process.env.TELEGRAM_BOT_TOKEN,
    chat:  process.env.TELEGRAM_CHAT_ID_HALAL  || process.env.TELEGRAM_CHAT_ID,
  },
};

const FALLBACK_CHANNEL = "deals";

function getCfg(channel) {
  const key = MAP[channel] ? channel : FALLBACK_CHANNEL;
  const cfg = MAP[key];
  if (!cfg?.token || !cfg?.chat) {
    throw new Error(`[telegram_publisher] Missing token/chat for "${key}". Check your env vars.`);
  }
  return { key, ...cfg };
}

function formatMessage(item) {
  const title = item.title || item.name || "Nouvelle opportunité";
  const score = (item.score_total != null) ? ` (${item.score_total})` : "";
  const link  = item.affiliateUrl || item.url || item.link || "";
  const price = item.price ? ` • ${item.price}` : "";
  return `🔥 ${title}${score}${price}\n${link}`;
}

async function sendTelegram({ token, chat }, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = { chat_id: chat, text, disable_web_page_preview: false };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Telegram error ${res.status}: ${err || res.statusText}`);
  }
  return res.json();
}

/**
 * Publie un item sur Telegram
 * @param {object} item - Objet avec title, link/url, score_total, price, etc.
 * @param {"deals"|"auto"|"immo"|"crypto"|"halal"} channel
 */
export async function publishTelegram(item, channel = FALLBACK_CHANNEL) {
  const cfg = getCfg(channel);

  // Ajoute l'URL affiliée si manquante
  const finalItem = item.affiliateUrl
    ? item
    : enrichItemWithAffiliate(item, {
        network: process.env.AFF_NET,
        siteId: process.env.AFF_SITE_ID,
        subKey: process.env.AFF_SUBKEY,
        userId: "MMM",
      });

  const text = formatMessage(finalItem);

  if (MODE === "debug") {
    console.log(`[Telegram DEBUG][${cfg.key}]`, text);
    return { ok: true, debug: true, channel: cfg.key };
  }

  return await sendTelegram(cfg, text);
}
