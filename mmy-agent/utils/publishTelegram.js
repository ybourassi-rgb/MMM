// mmy-agent/utils/publishTelegram.js
import { saveDeal } from "./saveLog.js";

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
 * Publie un item (news ou deal)
 * - news => Telegram AUTO (pas de Redis deals)
 * - deal => Redis deals + Telegram DEALS
 */
export async function publishDeal(item, mode = "deals") {
  // ✅ accepte "type" (runAgent) ou "sourceType" (ancien format)
  const isNews =
    item?.type === "news" ||
    item?.sourceType === "news";

  // ✅ 1) News → pas de saveDeal, juste Telegram AUTO
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
      mode: "auto",
      tgMessageId: tgRes?.result?.message_id,
    });

    return { ...item, publishedTo: "auto" };
  }

  // ✅ 2) Deal → save Redis canonique + Telegram DEALS
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
    mode: "deals",
    tgMessageId: tgRes?.result?.message_id,
  });

  return saved;
}

/**
 * Export default pour matcher:
 * import publishTelegram from "./utils/publishTelegram.js"
 */
export default async function publishTelegram(item) {
  const isNews =
    item?.type === "news" ||
    item?.sourceType === "news";

  // auto-routing
  return publishDeal(item, isNews ? "auto" : "deals");
}

/**
 * Message Telegram standardisé
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
