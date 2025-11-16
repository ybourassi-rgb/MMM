// /api/redirect.js

import { Redis } from "@upstash/redis";
import { applyAffiliation } from "../lib/affiliations";

export default async function handler(req, res) {
  try {
    // --- Méthode autorisée ---
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "Use GET" });
    }

    // --- Healthcheck (sans url / u) ---
    const rawUrlParam = req.query.u || req.query.url;
    if (!rawUrlParam) {
      return res
        .status(200)
        .json({ ok: true, message: "Redirect API fonctionne 🔥" });
    }

    // --- Récupération source / campaign (option 1) ---
    const source =
      (typeof req.query.source === "string"
        ? req.query.source
        : Array.isArray(req.query.source)
        ? req.query.source[0]
        : "telegram") || "telegram";

    const campaign =
      (typeof req.query.campaign === "string"
        ? req.query.campaign
        : Array.isArray(req.query.campaign)
        ? req.query.campaign[0]
        : "MMY_DEALS") || "MMY_DEALS";

    // --- Normalisation de l'URL reçue ---
    let target;
    try {
      const normalized = Array.isArray(rawUrlParam)
        ? rawUrlParam[0]
        : rawUrlParam;

      try {
        // direct
        target = new URL(normalized).toString();
      } catch {
        // si encodé
        target = new URL(decodeURIComponent(normalized)).toString();
      }
    } catch (err) {
      console.error("❌ URL invalid:", err.message);
      return res.redirect(302, "https://google.com"); // fallback safe
    }

    // --- Application du moteur d'affiliation (halal) ---
    let affiliationInfo = {
      finalUrl: target,
      applied: false,
      program: null,
      halalBlocked: false,
      reason: "not-checked"
    };

    try {
      // ⚠️ Ça reste ok même si applyAffiliation a déjà été appelé avant
      affiliationInfo = applyAffiliation(target);
    } catch (e) {
      console.warn("⚠️ applyAffiliation error:", e.message);
      affiliationInfo = {
        finalUrl: target,
        applied: false,
        program: null,
        halalBlocked: false,
        reason: "affiliation-error"
      };
    }

    let urlAfterAffiliation = affiliationInfo.finalUrl || target;

    // --- Ajout UTM (suivi MMM global) ---
    let finalUrl = urlAfterAffiliation;
    try {
      const u = new URL(urlAfterAffiliation);
      u.searchParams.set("utm_source", "MMY");
      u.searchParams.set("utm_medium", source || "telegram");
      u.searchParams.set("utm_campaign", campaign || "MMY_DEALS");
      finalUrl = u.toString();
    } catch (e) {
      console.warn("⚠️ Failed UTM, redirecting raw");
      finalUrl = urlAfterAffiliation;
    }

    // --- Initialisation Redis (non bloquant si absent) ---
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

    // --- Log du clic (statistiques) ---
    if (redis) {
      const domain = (() => {
        try {
          const u = new URL(finalUrl);
          return u.hostname.replace(/^www\./i, "").toLowerCase();
        } catch {
          return "unknown";
        }
      })();

      const logEntry = {
        ts: Date.now(),
        originalUrl: target,
        finalUrl,
        source,
        campaign,
        domain,
        userAgent: req.headers["user-agent"] || "",
        ip:
          req.headers["x-forwarded-for"] ||
          req.socket?.remoteAddress ||
          null,
        affiliation: {
          applied: affiliationInfo.applied,
          program: affiliationInfo.program,
          halalBlocked: affiliationInfo.halalBlocked,
          reason: affiliationInfo.reason
        }
      };

      // Liste détaillée
      const ops = [
        redis.lpush("mmy:clicks", JSON.stringify(logEntry)).catch((err) =>
          console.warn("⚠️ Redis lpush error:", err.message)
        ),
        // Compteurs agrégés (compatibles avec /api/logs_clicks version "click:*")
        redis.incr("click:total").catch(() => {}),
        redis.incr(`click:domain:${domain}`).catch(() => {}),
        redis.incr(`click:source:${source}`).catch(() => {}),
        redis.incr(`click:campaign:${campaign}`).catch(() => {})
      ];

      Promise.allSettled(ops).catch(() => {});
    }

    console.log("🔀 Redirect →", finalUrl, affiliationInfo);
    return res.redirect(302, finalUrl);
  } catch (fatal) {
    console.error("🔥 FATAL REDIRECT ERROR:", fatal);
    return res.redirect(302, "https://google.com");
  }
}
