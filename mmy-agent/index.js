import fetchFeeds from "./utils/fetchFeeds.js";
import summarize from "./utils/summarize.js";
import classify from "./utils/classify.js";
import score from "./utils/score.js";
import publishTelegram from "./utils/publishTelegram.js";
import saveLog from "./utils/saveLog.js";

async function main() {
  console.log("🚀 MMY Agent : cycle démarré");

  // 1. RÉCUPÉRATION DES FLUX
  const items = await fetchFeeds();
  console.log(`📡 ${items.length} éléments récupérés`);

  for (const item of items) {
    try {
      // 2. RÉSUMÉ
      const summary = await summarize(item);

      // 3. CLASSIFICATION
      const category = await classify(summary);

      // 4. SCORING
      const y = await score(item.link, summary, category);
      const globalScore =
        typeof y.globalScore === "number" ? y.globalScore : 0;

      console.log("📊 Score reçu :", y);

      // 5. SEUIL – TU PEUX AJUSTER ICI (75 recommandé)
      if (globalScore >= 75) {
        console.log(`🔥 Deal détecté (${globalScore}) → publication`);

        // 6. ENVOI TELEGRAM
        await publishTelegram({
          title: item.title,
          link: item.link,
          summary,
          category,
          yscore: y,
        });

        // 7. LOG (désactivé Redis, mais affiché console)
        await saveLog({
          title: item.title,
          category,
          yscore: y,
          link: item.link,
        });

      } else {
        console.log(`🟡 Ignoré (${globalScore})`);
      }

    } catch (error) {
      console.error("❌ Erreur sur un item :", error.message);
    }
  }

  console.log("✨ Cycle terminé");
}


// LANCEMENT DU PROCESSUS
main().catch((e) => {
  console.error("❌ Erreur globale MMY Agent :", e.message);
});
