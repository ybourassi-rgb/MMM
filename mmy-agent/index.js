import fetchFeeds from "./utils/fetchFeeds.js";
import summarize from "./utils/summarize.js";
import classify from "./utils/classify.js";
import score from "./utils/score.js";
import publishTelegram from "./utils/publishTelegram.js";
import { hasBeenPosted, markPosted } from "./utils/saveLog.js";
import { Redis } from "@upstash/redis";

// --- Redis ping (debug) ---
const redisPing = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN,
});

async function testRedis() {
  try {
    const pong = await redisPing.ping();
    console.log("[redis ping ✅]", pong);

    const len = await redisPing.llen("deals:all");
    console.log("[redis] deals:all length =", len);
  } catch (e) {
    console.error("[redis ping ❌]", e);
  }
}

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
      const type = item.type || "news";

      const already = await hasBeenPosted(item.link);
      if (already) continue;

      if (type === "news") {
        const summary = await summarize(item);
        const category = await classify(summary);

        const yscore = await score(item.link, summary, category).catch(() => null);

        await publishTelegram({
          ...item,
          summary,
          category,
          yscore,
          type: "news",
        });

        await markPosted(item.link);
        console.log("📰 News publiée");
        continue;
      }

      if (type === "deal") {
        if (!isDealDomain(item.link)) continue;

        const ok = await isAlive(item.link);
        if (!ok) continue;

        const summary = await summarize(item);
        const category = await classify(summary);

        const yscore = await score(item.link, summary, category);
        const globalScore =
          typeof yscore?.globalScore === "number" ? yscore.globalScore : 0;

        const isAmazon = item.link.toLowerCase().includes("amazon.");
        const minScore = isAmazon ? 85 : 75;

        if (globalScore < minScore) continue;

        await publishTelegram({
          ...item,
          summary,
          category,
          yscore,
          type: "deal",
        });

        await markPosted(item.link);
        console.log("🔥 Deal publié");
        continue;
      }
    } catch (e) {
      console.error("❌ Erreur item:", e);
    }
  }

  console.log("✨ Cycle terminé");
}

main().catch((e) => console.error("❌ Erreur globale:", e));
