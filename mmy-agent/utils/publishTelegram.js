import { saveDeal } from "./saveLog.js";
import fetch from "node-fetch";

const TG_TOKEN_AUTO = process.env.TELEGRAM_BOT_TOKEN_AUTO;
const TG_CHAT_AUTO = process.env.TELEGRAM_CHAT_ID_AUTO;

const TG_TOKEN_DEALS = process.env.TELEGRAM_BOT_TOKEN_DEALS;
const TG_CHAT_DEALS = process.env.TELEGRAM_CHAT_ID_DEALS;

/**
 * Envoie un message Telegram
 */
async function sendTelegram({ token, chatId, text, image }) {
  if (!token || !chatId) throw new Error("Telegram env missing");

  if (image) {
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    const body = {
      chat_id: chatId,
      photo: image,
      caption: text?.slice(0, 1024) || "",
      parse_mode: "HTML",
      disable_web_page_preview: false,
    };
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: false,
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

/**
 * Publie un item
 * - type: "news" => Telegram AUTO (pas Redis deals)
 * - type: "deal" => Redis deals + Telegram DEALS
 */
export async function publishDeal(item) {
  const type = item?.type || "news";
  const isNews = type === "news";

  // ✅ News → Telegram AUTO uniquement
  if (isNews) {
    const text = buildTelegramMessage(item, true);

    const tgRes = await sendTelegram({
      token: TG_TOKEN_AUTO,
      chatId: TG_CHAT_AUTO,
      text,
      image: item.image,
    });

    console.log("✅ Sent NEWS to Telegram:", {
      ok: tgRes?.ok,
      chatId: TG_CHAT_AUTO,
      tgMessageId: tgRes?.result?.message_id,
    });

    return { ...item, publishedTo: "auto" };
  }

  // ✅ Deal → save Redis canonique + Telegram DEALS
  const saved = await saveDeal(item);

  console.log("✅ Saved DEAL to Redis:", {
    id: saved.id,
    title: saved.title,
    category: saved.category,
    ts: saved.ts,
  });

  const text = buildTelegramMessage(saved, false);

  const tgRes = await sendTelegram({
    token: TG_TOKEN_DEALS,
    chatId: TG_CHAT_DEALS,
    text,
    image: saved.image,
  });

  console.log("✅ Sent DEAL to Telegram:", {
    ok: tgRes?.ok,
    chatId: TG_CHAT_DEALS,
    tgMessageId: tgRes?.result?.message_id,
  });

  return saved;
}

export default async function publishTelegram(item) {
  return publishDeal(item);
}

/**
 * Message Telegram standardisé 2026
 */
function buildTelegramMessage(d, isNews = false) {
  const link = d.affiliateUrl || d.url || d.link || "";

  const badgeType = isNews ? "📰 Actu" : "🔥 Deal";
  const halalBadge =
    d.halal === true
      ? "✅ Halal"
      : d.halal === false
      ? "⚠️ Non Halal"
      : "ℹ️ Halal ?";

  const score = d.score ?? d.yscore?.globalScore ?? d.yscore ?? "?";

  return `
<b>${d.title || "Opportunité"}</b>
<b>Type:</b> ${badgeType}
<b>Y-Score:</b> ${score} | ${halalBadge}

<b>Catégorie:</b> ${d.category || (isNews ? "News" : "Deals")}
<b>Source:</b> ${d.source || "-"}

${link ? `<a href="${link}">🔗 Ouvrir</a>` : ""}
`.trim();
}
