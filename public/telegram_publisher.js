export async function publishTelegram(item) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;

  const msg = `🔥 ${item.title}\n${item.link}?utm_source=mmY&utm_medium=aff&utm_campaign=auto`;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: msg })
  });
}
