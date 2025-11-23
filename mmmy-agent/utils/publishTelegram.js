import { saveDeal } from "./saveLog.js"; // Step A
import fetch from "node-fetch"; // Node18+ peut s'en passer, mais OK

const TG_TOKEN_AUTO = process.env.TELEGRAM_BOT_TOKEN_AUTO;
const TG_CHAT_AUTO = process.env.TELEGRAM_CHAT_ID_AUTO;

const TG_TOKEN_DEALS = process.env.TELEGRAM_BOT_TOKEN_DEALS;
const TG_CHAT_DEALS = process.env.TELEGRAM_CHAT_ID_DEALS;

/**
 * Envoie un message Telegram (simple et robuste)
 */
async function sendTelegram({ token, chatId, text, image }) {
  if (!token || !chatId) throw new Error("Telegram env missing");

  // Si image → sendPhoto, sinon sendMessage
  if (image) {
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    const body = {
      chat_id: chatId,
      photo: image,
      caption: text?.slice(0, 1024) || "", // Telegram limite caption
      parse_mode: "HTML",
      disable_web_page_preview: false,
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return r.json();
  } else {
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
}

/**
 * PUBLIC: publier un deal
 * - 1) save Redis (canonique)
 * - 2) push Telegram (diffusion)
 */
export async function publishDeal(deal, mode = "deals") {
  // 1) Save deal canonique
  const saved = await saveDeal(deal);

  // ✅ LOG 1 : confirme que Redis a bien enregistré
  console.log("✅ Saved deal to Redis:", {
    id: saved.id,
    title: saved.title,
    category: saved.category,
    ts: saved.ts,
  });

  // 2) Construire un message lisible + parseable
  const text = buildTelegramMessage(saved);

  // 3) Choix canal
  const isAuto = mode === "auto";
  const token = isAuto ? TG_TOKEN_AUTO : TG_TOKEN_DEALS;
  const chatId = isAuto ? TG_CHAT_AUTO : TG_CHAT_DEALS;

  // 4) Envoi Telegram
  const tgRes = await sendTelegram({
    token,
    chatId,
    text,
    image: saved.image,
  });

  // ✅ LOG 2 : confirme Telegram OK
  console.log("✅ Sent deal to Telegram:", {
    ok: tgRes?.ok,
    chatId,
    mode,
    tgMessageId: tgRes?.result?.message_id,
  });

  return saved;
}

/**
 * Message Telegram standardisé 2026
 * lisible humain + stable machine
 */
function buildTelegramMessage(d) {
  const link = d.affiliateUrl || d.url || "";
  const halalBadge =
    d.halal === true
      ? "✅ Halal"
      : d.halal === false
      ? "⚠️ Non Halal"
      : "ℹ️ Halal ?";

  const score = d.score ?? d.yscore ?? "?";

  return `
<b>${d.title || "Opportunité"}</b>
<b>Y-Score:</b> ${score} | ${halalBadge}
<b>Prix:</b> ${d.price || "?"}
<b>Catégorie:</b> ${d.category || "Deals"}
<b>Ville:</b> ${d.city || "-"}

<b>Marge:</b> ${d.margin || "-"} 
<b>Risque:</b> ${d.risk || "-"}
<b>Horizon:</b> ${d.horizon || "-"} 

${link ? `<a href="${link}">🔗 Voir l'opportunité</a>` : ""}
`.trim();
}
