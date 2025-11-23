// mmy-agent/index.js
import fetchFeeds from "./utils/fetchFeeds.js";
import summarize from "./utils/summarize.js";
import classify from "./utils/classify.js";
import score from "./utils/score.js";
import publishTelegram from "./utils/publishTelegram.js";
import { hasBeenPosted, markPosted } from "./utils/saveLog.js";

import { Redis } from "@upstash/redis";

// --- Redis client ---
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

// ✅ IMPORTANT : on exporte une fonction, on ne lance plus rien au top-level
export async function runAgent() {
  console.log("🚀 MMY Agent : cycle démarré");

  // ping redis (au runtime uniquement)
  await testRedis();

  const items = await fetchFeeds();
  console.log(`📡 ${items.length} éléments récupérés`);

  let published = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of items) {
    try {
      const sourceType = item.type || "news";

      // Anti-doublon global
      const already = await hasBeenPosted(item.link);
      if (already) {
        skipped++;
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
          type: "news",
          sourceType: "news", // ✅ AJOUT pour publishTelegram
        });

        await markPosted(item.link);
        published++;
        continue;
      }

      // -------- DEAL --------
      if (sourceType === "deal") {
        // allowlist
        if (!isDealDomain(item.link)) {
          skipped++;
          continue;
        }

        // lien vivant
        const ok = await isAlive(item.link);
        if (!ok) {
          skipped++;
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
          skipped++;
          continue;
        }

        await publishTelegram({
          ...item,
          summary,
          category,
          yscore,
          type: "deal",
          sourceType: "deal", // ✅ AJOUT pour publishTelegram
        });

        await markPosted(item.link);
        published++;
        continue;
      }

      skipped++;
    } catch (error) {
      errors++;
      console.error("❌ Erreur sur un item :", error);
    }
  }

  console.log("✨ Cycle terminé", { published, skipped, errors });

  return { ok: true, published, skipped, errors };
}

// ✅ si tu veux pouvoir lancer en local/railway en node :
// node mmy-agent/index.js
if (process.env.RUN_AS_STANDALONE === "true") {
  runAgent().catch((e) => {
    console.error("❌ Erreur globale MMY Agent :", e);
  });
}
