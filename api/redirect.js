// /api/redirect.js
// =================
// Route de redirection MMY + affiliation global + tracking Redis optionnel
// - Ajoute UTM pour ton tracking
// - Ajoute paramètres d'affiliation pour certains domaines
// - NE TOUCHE PAS aux banques / brokers / crédit (haram)

import { Redis } from "@upstash/redis";
import {
  getAffiliationParamsForDomain,
  isHaramDomain,
} from "../affiliation_map.js";

export default async function handler(req, res) {
  try {
    // --- METHOD CHECK ---
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "Use GET" });
    }

    // --- URL PARAM CHECK ---
    const raw = req.query.url;
    if (!raw) {
      return res.status(400).json({ ok: false, error: "Missing url" });
    }

    // --- NORMALISATION DE L'URL ---
    let target;
    try {
      const normalized = Array.isArray(raw) ? raw[0] : raw;

      try {
        // direct
        target = new URL(normalized).toString();
      } catch {
        // essayer après décodage
        target = new URL(decodeURIComponent(normalized)).toString();
      }
    } catch (err) {
      console.error("❌ URL invalid:", err.message);
      return res.redirect(302, "https://google.com"); // fallback safe
    }

    const urlObj = new URL(target);
    const hostname = urlObj.hostname.replace(/^www\./, "").toLowerCase();

    // --- FILTRE HALAL : on NE MONÉTISE PAS certains domaines ---
    let affiliationParams = null;

    if (!isHaramDomain(hostname)) {
      affiliationParams = getAffiliationParamsForDomain(hostname);
    } else {
      console.log("🛑 Domaine exclu (haram) → pas d'affiliation:", hostname);
    }

    // --- APPLICATION DES PARAMÈTRES D'AFFILIATION (si existants) ---
    if (affiliationParams && Array.isArray(affiliationParams)) {
      affiliationParams.forEach((entry) => {
        try {
          const [k, v] = entry.split("=");
          if (k && v) {
            urlObj.searchParams.set(k, v);
          }
        } catch (e) {
          console.warn("⚠️ Mauvais format param affiliation:", entry);
        }
      });
      console.log("💰 Affiliation appliquée pour:", hostname);
    }

    // --- UTM tracking global (MMY) ---
    urlObj.searchParams.set("utm_source", "MMY");
    urlObj.searchParams.set("utm_medium", "telegram");
    urlObj.searchParams.set("utm_campaign", "MMY_DEALS");

    const finalUrl = urlObj.toString();

    // --- INIT REDIS (OPTIONNEL : si Upstash configuré) ---
    let redis = null;
    try {
      const url =
        process.env.UPSTASH_REDIS_REST_URL ||
        process.env.UPSTASH_REDIS_URL ||
        process.env.UPSTASH_REST_URL;

      const token =
        process.env.UPSTASH_REDIS_REST_TOKEN ||
        process.env.UPSTASH_REDIS_TOKEN ||
        process.env.UPSTASH_REST_TOKEN;

      if (url && token) {
        redis = new Redis({ url, token });
      }
    } catch (e) {
      console.warn("⚠️ Redis init error:", e.message);
    }

    // --- TRACK CLICK (NON BLOQUANT) ---
    if (redis) {
      redis
        .lpush(
          "mmy:clicks",
          JSON.stringify({
            ts: Date.now(),
            hostname,
            finalUrl,
            ua: req.headers["user-agent"] || "",
          })
        )
        .catch((err) =>
          console.warn("⚠️ Redis push error (redirect):", err.message)
        );
    }

    console.log("🔀 Redirect →", finalUrl);
    return res.redirect(302, finalUrl);
  } catch (fatal) {
    console.error("🔥 FATAL REDIRECT ERROR:", fatal);
    return res.redirect(302, "https://google.com");
  }
}
