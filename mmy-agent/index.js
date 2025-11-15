// mmy-agent/index.js
import fetchFeeds from "./utils/fetchFeeds.js";
import summarize from "./utils/summarize.js";
import classify from "./utils/classify.js";
import score from "./utils/score.js";
import publishTelegram from "./utils/publishTelegram.js";
import saveLog, {
  hasBeenPosted,
  markPosted,
} from "./utils/saveLog.js";

async function main() {
  console.log("🚀 MMY Agent : cycle démarré");

  // (Optionnel) Message de test au démarrage – tu peux commenter si tu veux
  // await publishTelegram({
  //   title: "MMY Agent opérationnel ✔️",
  //   link: "",
  //   summary: "Le service MMY tourne correctement sur Railway.",
  //   category: "system",
  //   yscore: { globalScore: 99 },
  // });
  // console.log("📤 Message de test envoyé à Telegram");

  // 1. RÉCUPÉRATION DES FLUX
  const items = await fetchFeeds();
  console.log(`📡 ${items.length} éléments récupérés`);

  for (const item of items) {
    try {
      // 2. ANTI-DOUBLON : si le lien a déjà été publié, on skip
      const already = await hasBeenPosted(item.link);
      if (already) {
        console.log("⏩ Déjà publié, on skip :", item.link);
        continue;
      }

      // 3. RÉSUMÉ
      const summary = await summarize(item);

      // 4. CLASSIFICATION
      const category = await classify(summary);

      // 5. SCORING AVEC Y-SCORE
      const yscore = await score(item.link, summary, category);
      const globalScore =
        typeof yscore?.globalScore === "number" ? yscore.globalScore : 0;

      console.log("📊 Score reçu :", yscore);

      // 6. FILTRE SUR LE SCORE
      if (globalScore >= 75) {
        console.log(`🔥 Deal détecté (${globalScore}) → publication`);

        // 7. ENVOI TELEGRAM
        await publishTelegram({
          title: item.title,
          link: item.link,
          summary,
          category,
          yscore,
        });

        // 8. LOG
        await saveLog({
          title: item.title,
          category,
          yscore,
          link: item.link,
        });

        // 9. ENREGISTRER LE LIEN COMME DÉJÀ PUBLIÉ
        await markPosted(item.link);
      } else {
        console.log(`🟡 Ignoré (${globalScore})`);
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
