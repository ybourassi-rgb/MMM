export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { Redis } from "@upstash/redis";
import { applyAffiliation } from "@/lib/affiliations";

// --- Helpers ---
function pickParam(urlObj, keys = []) {
  for (const k of keys) {
    const v = urlObj.searchParams.getAll(k);
    if (v && v.length) return v[0];
  }
  return null;
}

function safeParseUrl(raw) {
  if (!raw) return null;

  const normalized = Array.isArray(raw) ? raw[0] : raw;

  try {
    return new URL(normalized).toString();
  } catch {
    try {
      return new URL(decodeURIComponent(normalized)).toString();
    } catch {
      return null;
    }
  }
}

function safeDomain(u) {
  try {
    return new URL(u).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "unknown";
  }
}

async function initRedis() {
  try {
    const url =
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_URL ||
      process.env.UPSTASH_REST_URL;

    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.UPSTASH_REDIS_TOKEN ||
      process.env.UPSTASH_REST_TOKEN;

    if (url && token) return new Redis({ url, token });
  } catch (e) {
    console.warn("⚠️ Redis init error:", e.message);
  }
  return null;
}

async function logClick(redis, entry) {
  if (!redis) return;

  const domain = entry.domain || "unknown";
  const source = entry.source || "unknown";
  const campaign = entry.campaign || "unknown";

  const ops = [
    redis.lpush("mmy:clicks", JSON.stringify(entry)).catch(() => {}),
    redis.incr("click:total").catch(() => {}),
    redis.incr(`click:domain:${domain}`).catch(() => {}),
    redis.incr(`click:source:${source}`).catch(() => {}),
    redis.incr(`click:campaign:${campaign}`).catch(() => {}),
  ];

  Promise.allSettled(ops).catch(() => {});
}

// --- Route ---
export async function GET(req) {
  const urlObj = new URL(req.url);

  // Healthcheck (pas de u/url)
  const rawUrlParam =
    pickParam(urlObj, ["u", "url"]) || null;

  if (!rawUrlParam) {
    return new Response(
      JSON.stringify({ ok: true, message: "Redirect API fonctionne 🔥" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // source / campaign
  const source =
    pickParam(urlObj, ["source"]) || "telegram";
  const campaign =
    pickParam(urlObj, ["campaign"]) || "MMY_DEALS";

  // URL cible
  const target = safeParseUrl(rawUrlParam);
  if (!target) {
    return Response.redirect("https://google.com", 302);
  }

  // Application affiliation
  let affiliationInfo = {
    finalUrl: target,
    applied: false,
    program: null,
    halalBlocked: false,
    reason: "not-checked",
  };

  try {
    affiliationInfo = applyAffiliation(target);
  } catch (e) {
    console.warn("⚠️ applyAffiliation error:", e.message);
    affiliationInfo.reason = "affiliation-error";
  }

  const urlAfterAffiliation = affiliationInfo.finalUrl || target;

  // Ajout UTM global
  let finalUrl = urlAfterAffiliation;
  try {
    const u = new URL(urlAfterAffiliation);
    u.searchParams.set("utm_source", "MMY");
    u.searchParams.set("utm_medium", source);
    u.searchParams.set("utm_campaign", campaign);
    finalUrl = u.toString();
  } catch {
    finalUrl = urlAfterAffiliation;
  }

  // Redis log (non bloquant)
  const redis = await initRedis();
  if (redis) {
    const logEntry = {
      ts: Date.now(),
      originalUrl: target,
      finalUrl,
      source,
      campaign,
      domain: safeDomain(finalUrl),
      userAgent: req.headers.get("user-agent") || "",
      ip: req.headers.get("x-forwarded-for") || null,
      affiliation: {
        applied: !!affiliationInfo.applied,
        program: affiliationInfo.program || null,
        halalBlocked: !!affiliationInfo.halalBlocked,
        reason: affiliationInfo.reason || "unknown",
      },
    };

    logClick(redis, logEntry);
  }

  console.log("🔀 Redirect →", finalUrl, affiliationInfo);
  return Response.redirect(finalUrl, 302);
}

export async function POST(req) {
  // on accepte aussi POST si jamais tu l’appelles comme ça
  return GET(req);
}
