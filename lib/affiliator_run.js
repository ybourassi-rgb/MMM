// /lib/affiliator_run.js
import { fetchRSS } from "./rss_ingestor.js";
import { scoreItems } from "./yscore_client.js";
import { publishTelegram } from "./telegram_publisher.js";
import { enrichItemWithAffiliate } from "./affiliator_core.js";

/* ENV helpers */
const envNum = (k, fb) => {
  const v = process.env[k];
  if (v == null || v === "") return fb;
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
const MODE = (process.env.AFFILIATOR_MODE || "live").toLowerCase();

/* Seuils par channel + fallback global */
const MIN = {
  global: envNum("AFFILIATOR_MIN_SCORE", 70),
  deals:  envNum("AFFILIATOR_MIN_SCORE_DEALS",  NaN),
  auto:   envNum("AFFILIATOR_MIN_SCORE_AUTO",   NaN),
  immo:   envNum("AFFILIATOR_MIN_SCORE_IMMO",   NaN),
  crypto: envNum("AFFILIATOR_MIN_SCORE_CRYPTO", NaN),
  halal:  envNum("AFFILIATOR_MIN_SCORE_HALAL",  NaN)
};
const minFor = (ch) => Number.isFinite(MIN[ch]) ? MIN[ch] : MIN.global;

/* Routing par domaine (extensible) */
const DOMAIN_CHANNEL_MAP = [
  { test: /autoscout24|lacentrale|caradisiac|autoplus/i, channel: "auto" }
  // { test: /seloger|logic-immo/i, channel: "immo" },
  // { test: /cointelegraph|cryptoast|bitcoin\.fr|investing\.com/i, channel: "crypto" },
  // { test: /muslim|halal/i, channel: "halal" },
];
function detectChannel(item) {
  const url = (item.link || item.url || "").toLowerCase();
  for (const rule of DOMAIN_CHANNEL_MAP) {
    if (rule.test.test(url)) return rule.channel;
  }
  return "deals";
}

export async function runCycle() {
  const sources = (process.env.AFFILIATOR_SOURCES ?? "https://example.com/feed.xml")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  /* 1) Ingestion */
  let all = [];
  for (const s of sources) {
    try {
      const items = await fetchRSS(s);
      all = all.concat(items);
    } catch (e) {
      console.warn(`[Affiliator] RSS error on ${s}:`, e?.message || e);
    }
  }

  /* 2) Scoring */
  const scored = await scoreItems(all);

  /* 3) Enrich + route + seuil */
  const prepared = scored.map(it => {
    const channel = detectChannel(it);
    const min = minFor(channel);
    const enriched = enrichItemWithAffiliate(it, {
      network: process.env.AFF_NET,
      siteId: process.env.AFF_SITE_ID,
      subKey: process.env.AFF_SUBKEY,
      userId: "MMM"
    });
    return { ...enriched, __channel: channel, __min: min };
  });

  const filtered = prepared.filter(i => Number(i.score_total || 0) >= i.__min);

  /* 4) Publish */
  let published = 0;
  for (const it of filtered) {
    try {
      await publishTelegram(it, it.__channel);
      published++;
    } catch (err) {
      console.error(`[Affiliator] publish error (${it.__channel}):`, err?.message || err);
    }
  }

  /* 5) Stats & logs */
  const avg = scored.length
    ? Math.round(scored.reduce((a, i) => a + (Number(i.score_total) || 0), 0) / scored.length)
    : 0;

  console.log(
    `[Affiliator] mode=${MODE} total=${all.length} scored=${scored.length} avg=${avg} kept=${filtered.length} ` +
    `thresholds(global:${MIN.global}, deals:${MIN.deals || "-"}, auto:${MIN.auto || "-"})`
  );

  return {
    ok: true,
    ingested: all.length,
    published,
    avg_score: avg,
    mode: MODE,
    by_channel: {
      auto: filtered.filter(i => i.__channel === "auto").length,
      deals: filtered.filter(i => i.__channel === "deals").length
    }
  };
}
