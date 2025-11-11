// lib/affiliator_run.js
import { fetchRSS } from "./rss_ingestor.js";
import { scoreItems } from "./yscore_client.js";
import { publishTelegram } from "./telegram_publisher.js";
import { enrichItemWithAffiliate } from "./affiliator_core.js";

export async function runCycle() {
  const sources = (process.env.AFFILIATOR_SOURCES ?? "https://example.com/feed.xml").split(",");
  const minScore = Number(process.env.AFFILIATOR_MIN_SCORE ?? 70);
  const mode = (process.env.AFFILIATOR_MODE || "live").toLowerCase();

  let all = [];
  for (const s of sources) {
    const items = await fetchRSS(s.trim());
    all = all.concat(items);
  }

  const scored = await scoreItems(all);

  const withAff = scored.map(it =>
    enrichItemWithAffiliate(it, {
      network: process.env.AFF_NET,
      siteId: process.env.AFF_SITE_ID,
      subKey: process.env.AFF_SUBKEY,
      userId: "MMM",
    })
  );

  const filtered = withAff.filter(i => Number(i.score_total || 0) >= minScore);

  let published = 0;
  for (const it of filtered) {
    await publishTelegram(it);
    published++;
  }

  const avg = scored.length
    ? Math.round(scored.reduce((a, i) => a + (Number(i.score_total) || 0), 0) / scored.length)
    : 0;

  console.log(
    `[Affiliator] total=${all.length} scored=${scored.length} avg=${avg} filtered>=${minScore} => published=${published} (mode=${mode})`
  );

  return { ingested: all.length, published, avg_score: avg, mode };
}
