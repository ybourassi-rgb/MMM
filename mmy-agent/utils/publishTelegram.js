// mmy-agent/utils/publishTelegram.js
import buildAffiliateLink from "./buildAffiliateLink.js";

export default async function publishTelegram({
  title,
  link,
  summary,
  category,
  yscore,
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("❌ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant");
    return;
  }

  const finalLink = link ? buildAffiliateLink(link) : "";
  const score = yscore?.globalScore ?? 0;

  const text =
    `🔥 *Nouveau Deal ${category?.toUpperCase() || ""}*\n\n` +
    `*${title || "Sans titre"}*\n\n` +
    `${summary || ""}\n\n` +
    `🎯 *Y-Score :* ${score}/100\n\n` +
    (finalLink ? `🔗 [Ouvrir le deal](${finalLink})` : "");

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  console.log("📤 Envoi Telegram vers", chatId, "avec lien :", finalLink);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Erreur Telegram:", res.status, data);
    } else {
      console.log("✅ Telegram OK:", data.result?.message_id || "no id");
    }
  } catch (err) {
    console.error("❌ Exception Telegram:", err.message);
  }
}
