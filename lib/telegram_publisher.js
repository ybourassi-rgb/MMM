// lib/telegram_publisher.js
// Version multi-bots : deals / auto / immo / crypto / halal
// Nécessite des variables d'env Vercel pour chaque bot (voir plus bas).

import { enrichItemWithAffiliate } from "./affiliator_core.js";

const MODE = (process.env.AFFILIATOR_MODE || "live").toLowerCase(); // "live" | "debug"

// Map des bots (token + chat)
const MAP = {
  deals: {
    token: process.env.TELEGRAM_BOT_TOKEN_DEALS || process.env.TELEGRAM_BOT_TOKEN,
    chat:  process.env.TELEGRAM_CHAT_ID_DEALS  || process.env.TELEGRAM_CHAT_ID,
  },
  auto: {
    token: process.env.TELEGRAM_BOT_TOKEN_AUTO,
    chat:  process.env.TELEGRAM_CHAT_ID_AUTO,
  },
  immo: {
    token: process.env.TELEGRAM_BOT_TOKEN_IMMO,
    chat:  process.env.TELEGRAM_CHAT_ID_IMMO,
  },
  crypto: {
    token: process.env.TELEGRAM_BOT_TOKEN_CRYPTO,
    chat:  process.env.TELEGRAM_CHAT_ID_CRYPTO,
  },
  halal: {
    token: process.env.TELEGRAM_BOT_TOKEN_HALAL,
    chat:  process.env.TELEGRAM_CHAT_ID_HALAL,
  },
};

// fallback si channel inconnu
const fallbackChannel = "deals";

// vérification minimale
function getCfg(channel) {
  const key = MAP[channel] ? channel : fallbackChannel;
  const cfg = MAP[key];
  if (!cfg?.token || !cfg?.chat) {
    throw new Error(`[telegram_publisher] Missing token/chat for channel "${key}". Check your env vars.`);
  }
  return { key, ...cfg };
}

// Construit le texte final du message
function formatMessage(item) {
  const title = item.title || item.name || "Nouvelle opportunité";
  const score = (typeof item.score_total !== "undefined") ? ` (${item.score_total})` : "";
  const link  = item.affiliateUrl || item.url || item.link || "";
  return `🔥 ${title}${score}\n${link}`;
}

// Envoi vers Telegram
async function sendTelegram({ token, chat }, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = { chat_id: chat, text, disable_web_page_preview: false };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Telegram error ${res.status}: ${errText || res.statusText}`);
  }
  return res.json();
}

// API publique : publishTelegram(item, channel?)
export async function publishTelegram(item, channel = fallbackChannel) {
  const cfg = getCfg(channel);

  // Ajoute l'URL affiliée si manquante
  const enriched = item.affiliateUrl
    ? item
    : enrichItemWithAffiliate(item, {
        network: process.env.AFF_NET,
        siteId: process.env.AFF_SITE_ID,
        subKey: process.env.AFF_SUBKEY,
        userId: "MMM",
      });

  const text = formatMessage(enriched);

  if (MODE === "debug") {
    console.log(`[Telegram DEBUG][${cfg.key}]`, text);
    return { ok: true, debug: true, channel: cfg.key };
  }

  // Anti-dup (optionnel) : à brancher si tu stockes les IDs publiés
  // await maybePreventDuplicate(enriched);

  return await sendTelegram(cfg, text);
}
