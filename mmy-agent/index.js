// mmy-agent/index.js
import fetchFeeds from "./utils/fetchFeeds.js";
import summarize from "./utils/summarize.js";
import classify from "./utils/classify.js";
import score from "./utils/score.js";
import publishTelegram from "./utils/publishTelegram.js";
import { hasBeenPosted, markPosted } from "./utils/saveLog.js";

import { Redis } from "@upstash/redis";

// --- Redis ping (debug Railway) ---
const redisPing = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN,
});

async function testRedis() {
  try {
    const urlOk = !!(
      process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL
    );
    const tokenOk = !!(
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN
    );
    console.log("[redis] env url?", urlOk, "token?", tokenOk);

    const pong = await redisPing.ping();
    console.log("[redis ping ✅]", pong);

    const len = await redisPing.llen("deals:all");
    console.log("[redis] deals:all length =", len);
  } catch (e) {
    console.error("[redis ping ❌]", e);
  }
}

// --- Helpers deals clean ---
const DEAL_DOMAINS = ["amazon.", "aliexpress.", "ebay.", "dealabs.", "pepper."];

function isDealDomain(url = "") {
  return DEAL_DOMAINS.some((d) => url.toLowerCase().includes(d));
}

async function isAlive(url) {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    return r.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("🚀 MMY Agent : cycle démarré");

  await testRedis();

  const items = await fetchFeeds();
  console.log(`📡 ${items.length} éléments récupérés`);

  for (const item of items) {
    try {
      // ✅ sourceType vient de fetchFeeds.js
      const sourceType = item.sourceType || "news";

      // Anti-doublon global
      const already = await hasBeenPosted(item.link);
      if (already) {
        console.log("⏩ Déjà publié, on skip :", item.link);
        continue;
      }

      // -------- NEWS --------
      if (sourceType === "news") {
        const summary = await summarize(item);
        const category = await classify(summary);

        const yscore = await score(item.link, summary, category).catch(() => null);

        await publishTelegram({
          ...item,
          summary,
          category,
          yscore,
          sourceType: "news", // ✅ garder standard
        });

        await markPosted(item.link);
        console.log("📰 News publiée");
        continue;
      }

      // -------- DEAL --------
      if (sourceType === "deal") {
        if (!isDealDomain(item.link)) {
          console.log("🧹 Deal rejeté (domaine non autorisé):", item.link);
          continue;
        }

        const ok = await isAlive(item.link);
        if (!ok) {
          console.log("🧹 Deal rejeté (lien mort):", item.link);
          continue;
        }

        const summary = await summarize(item);
        const category = await classify(summary);

        const yscore = await score(item.link, summary, category);
        const globalScore =
          typeof yscore?.globalScore === "number" ? yscore.globalScore : 0;

        const isAmazon = item.link.toLowerCase().includes("amazon.");
        const minScore = isAmazon ? 85 : 75;

        if (globalScore < minScore) {
          console.log(`🟡 Deal ignoré (${globalScore} < ${minScore})`);
          continue;
        }

        await publishTelegram({
          ...item,
          summary,
          category,
          yscore,
          sourceType: "deal", // ✅ garder standard
        });

        await markPosted(item.link);
        console.log("🔥 Deal publié");
        continue;
      }

      console.log("⚠️ Item ignoré (sourceType inconnu):", sourceType, item.link);
    } catch (error) {
      console.error("❌ Erreur sur un item :", error);
    }
  }

  console.log("✨ Cycle terminé");
}

main().catch((e) => {
  console.error("❌ Erreur globale MMY Agent :", e);
});
