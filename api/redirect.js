// api/redirect.js
// Redirection + UTM + tracking clics (sans jamais casser l'expérience utilisateur)

import { Redis } from "@upstash/redis";

// On accepte tous les noms possibles des variables Upstash
const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.UPSTASH_REDIS_URL ||
  process.env.UPSTASH_REST_URL;

const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.UPSTASH_REDIS_TOKEN ||
  process.env.UPSTASH_REST_TOKEN;

let redis = null;

if (redisUrl && redisToken) {
  try {
    redis = new Redis({ url: redisUrl, token: redisToken });
    console.log("✅ Redirect: Redis initialisé");
  } catch (err) {
    console.warn("⚠️ Redirect: erreur init Redis:", err.message);
  }
} else {
  console.warn("⚠️ Redirect: variables Redis manquantes, tracking désactivé");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  const raw = req.query.url;
  const src = req.query.src || "telegram";     // medium
  const tag = req.query.tag || "MMY_DEALS";    // campaign

  if (!raw) {
    return res.status(400).json({ ok: false, error: "Missing url" });
  }

  // 1) Nettoyage / validation de l'URL cible
  let target = "";
  try {
    const value = Array.isArray(raw) ? raw[0] : raw;

    try {
      target = new URL(value).toString();
    } catch {
      // si encodé : on decodeURIComponent
      target = new URL(decodeURIComponent(value)).toString();
    }
  } catch (err) {
    console.error("Redirect invalid URL:", err.message);
    return res.status(400).json({ ok: false, error: "Invalid URL" });
  }

  // 2) Ajout des paramètres UTM
  let finalUrl;
  try {
    const u = new URL(target);

    u.searchParams.set("utm_source", "MMY");
    u.searchParams.set("utm_medium", src);    // ex: telegram
    u.searchParams.set("utm_campaign", tag);  // ex: MMY_DEALS

    finalUrl = u.toString();
  } catch (err) {
    console.error("Redirect build URL error:", err.message);
    // Même si on a un souci avec les UTM, on redirige au moins vers le lien brut
    return res.redirect(302, target);
  }

  // 3) Tracking dans Redis (NON bloquant)
  if (redis) {
    redis
      .lpush(
        "mmy:clicks",
        JSON.stringify({
          ts: Date.now(),
          url: finalUrl,
          originalUrl: target,
          src,
          tag,
          ua: req.headers["user-agent"] || "",
        })
      )
      .catch((err) => {
        console.error("Redirect tracking error:", err.message);
      });
  }

  console.log("🔀 Redirect →", finalUrl);
  return res.redirect(302, finalUrl);
}
