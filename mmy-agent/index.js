import fetchFeeds from "./utils/fetchFeeds.js";
import summarize from "./utils/summarize.js";
import classify from "./utils/classify.js";
import score from "./utils/score.js";
import publishTelegram from "./utils/publishTelegram.js";
import saveLog from "./utils/saveLog.js";

async function main() {
  console.log("🚀 MMY Agent : cycle démarré");

  const items = await fetchFeeds();
  console.log(`📡 ${items.length} éléments récupérés`);

  for (const item of items) {
    try {
      const summary = await summarize(item);
      const category = await classify(summary);
      const yscore = await score(item.link, summary, category);

      if (yscore.globalScore >= 75) {
        console.log(`🔥 Deal détecté (${yscore.globalScore}) → publication`);

        await publishTelegram({
          title: item.title,
          link: item.link,
          summary,
          category,
          yscore,
        });

        await saveLog({
          title: item.title,
          category,
          yscore,
          link: item.link,
        });
      } else {
        console.log(`🟡 Ignoré (${yscore.globalScore})`);
      }
    } catch (error) {
      console.error("❌ Erreur sur un item :", error);
    }
  }

  console.log("✨ Cycle terminé");
}

main().catch((e) => {
  console.error("❌ Erreur globale MMY Agent :", e);
});
