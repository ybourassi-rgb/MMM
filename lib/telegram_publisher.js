// /lib/telegram_publisher.js
export async function publishTelegram(item, channel = "deals") {
  const token =
    channel === "deals"
      ? process.env.TELEGRAM_BOT_TOKEN_DEALS
      : process.env.TELEGRAM_BOT_TOKEN;

  const chatId =
    channel === "deals"
      ? process.env.TELEGRAM_CHAT_ID_DEALS
      : process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { ok: false, error: "telegram_env_missing" };
  }

  const text =
    `🚨 ${item.title || "Nouveau message"}\n` +
    (item.link ? `👉 ${item.link}\n` : "") +
    (item.desc ? `\n${item.desc}` : "");

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });

  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, data };
}
