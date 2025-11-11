// lib/affiliator_run.js
import { fetchRSS } from "./rss_ingestor.js";
import { scoreItems } from "./yscore_client.js";
import { publishTelegram } from "./telegram_publisher.js";
import { enrichItemWithAffiliate } from "./affiliator_core.js";

// ---- Helpers seuils & routing ----

// Lecture sûre d'un nombre depuis process.env
const envNum = (key, fallback) => {
  const v = process.env[key];
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Seuils par bot (si non défini -> NaN) + fallback global
const MIN_SCORES = {
  global: envNum("AFFILIATOR_MIN_SCORE", 70),
  deals:  envNum("AFFILIATOR_MIN_SCORE_DEALS",  NaN),
  auto:   envNum("AFFILIATOR_MIN_SCORE_AUTO",   NaN),
  immo:   envNum("AFFILIATOR_MIN_SCORE_IMMO",   NaN),
  crypto: envNum("AFFILIATOR_MIN_SCORE_CRYPTO", NaN),
  halal:  envNum("AFFILIATOR_MIN_SCORE_HALAL",  NaN),
};

const getMinForChannel = (channel) => {
  const v = MIN_SCORES[channel];
  return Number.isFinite(v) ? v : MIN_SCORES.global;
};

// Détecte le channel à partir du domaine / titre
const detectChannel = (item) => {
  const url = (item.link || item.url || "").toLowerCase();
  const title = (item.title || "").toLowerCase();

  // Auto
  if (url.includes("autoscout24") || url.includes("lacentrale") || url.includes("caradisiac") || url.includes("autoplus")) {
    return "auto";
  }
  // Immo
  if (url.includes("seloger") || url.includes("logic-immo") || url.includes("immobilier")) {
    return "immo";
  }
  // Crypto
  if (url.includes("cointelegraph") || url.includes("cryptoast") || url.includes("bitcoin.fr") || url.includes("investing.com")) {
    return "crypto";
  }
  // Halal
  if (url.includes("muslim") || url.includes("halal") || title.includes("halal")) {
    return "halal";
  }
  // Défaut
  return "deals";
};

// ---- Cycle principal ----

export async function runCycle() {
  const sources = (process.env.AFFILIATOR_SOURCES ?? "https://example.com/feed.xml").split(",");
  const mode = (process.env.AFFILIATOR_MODE || "live").toLowerCase();

  // 1) Ingestion
  let all = [];
  for (const s of sources) {
    const items = await fetchRSS(s.trim());
    all = all.concat(items);
  }

  // 2) Scoring
  const scored = await scoreItems(all);

  // 3) Enrichissement + détection de canal + seuil par canal
  const prepared = scored.map(it => {
    const channel = detectChannel(it);
    const minForThis = getMinForChannel(channel);
    const enriched = enrichItemWithAffiliate(it, {
      network: process.env.AFF_NET,
      siteId: process.env.AFF_SITE_ID,
      subKey: process.env.AFF_SUBKEY,
      userId: "MMM",
    });
    return { ...enriched, __channel: channel, __min: minForThis };
  });

  // 4) Filtrage par score minimal du channel
  const filtered = prepared.filter(i => Number(i.score_total || 0) >= i.__min);

  // 5) Publication (essaye publishTelegram(item, channel), sinon fallback item seul)
  let published = 0;
  for (const it of filtered) {
    try {
      // version multi-bots
      await publishTelegram(it, it.__channel);
    } catch {
      // fallback si publishTelegram n'accepte qu'un seul argument
      await publishTelegram(it);
    }
    published++;
  }

  // Stats & logs
  const avg = scored.length
    ? Math.round(scored.reduce((a, i) => a + (Number(i.score_total) || 0), 0) / scored.length)
    : 0;

  console.log(
    `[Affiliator] mode=${mode} total=${all.length} scored=${scored.length} avg=${avg} kept=${filtered.length} ` +
    `thresholds(global:${MIN_SCORES.global}, deals:${MIN_SCORES.deals || "-"}, auto:${MIN_SCORES.auto || "-"}, ` +
    `immo:${MIN_SCORES.immo || "-"}, crypto:${MIN_SCORES.crypto || "-"}, halal:${MIN_SCORES.halal || "-"})`
  );

  return { ingested: all.length, published, avg_score: avg, mode };
}
