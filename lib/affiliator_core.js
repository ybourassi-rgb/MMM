import { fetchRSS } from "./rss_ingestor.js";
import { scoreItems } from "./yscore_client.js";
import { publishTelegram } from "./telegram_publisher.js";

export async function runCycle() {
  const sources = (process.env.AFFILIATOR_SOURCES ?? "https://example.com/feed.xml").split(",");
  let all = [];
  for (const s of sources) {
    const items = await fetchRSS(s.trim());
    all = all.concat(items);
  }

  const scored = await scoreItems(all);
  const filtered = scored.filter(
    i => i.score_total >= (process.env.AFFILIATOR_MIN_SCORE ?? 70)
  );

  let published = 0;
  for (const it of filtered) {
    await publishTelegram(it);
    published++;
  }

  return { ingested: all.length, published };
}
