type PublishArgs = {
  title: string;
  link: string;
  summary: string;
  category: string;
  yscore: { globalScore: number; [key: string]: any };
};

export default async function publishTelegram({
  title,
  link,
  summary,
  category,
  yscore,
}: PublishArgs) {
  const text =
    `🔥 *Nouveau Deal ${category.toUpperCase()}*\n\n` +
    `*${title}*\n\n` +
    `${summary}\n\n` +
    `🎯 *Y-Score :* ${yscore.globalScore}/100\n\n` +
    `🔗 ${link}`;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}
