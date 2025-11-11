


const pkgJson = { name: "mmm-app" }; // fallback si pas de package.json
async function ping(url) {
  try {
    const r = await fetch(url, { method: "GET", cache: "no-store" });
    const text = await r.text().catch(() => "");
    return { ok: r.ok, status: r.status, url, body: text.slice(0, 200) };
  } catch (e) {
    return { ok: false, status: 0, url, error: String(e).slice(0, 200) };
  }
}

module.exports = async (req, res) => {
  // Auth simple
  const adminSecret = (process.env.ADMIN_SECRET || "").trim();
  const q = new URL(req.url, `http://${req.headers.host}`);
  const provided = (q.searchParams.get("secret") || "").trim();
  if (!adminSecret || provided !== adminSecret) {
    return res.status(401).json({ ok: false, error: "unauthorized (ADMIN_SECRET)" });
  }

  // 1) Infos runtime
  const info = {
    node: process.version,
    env: process.env.VERCEL_ENV || "unknown",
    region: process.env.VERCEL_REGION || "unknown",
    app: pkgJson.name
  };

  // 2) Variables requises
  const required = [
    "CRON_SECRET",
    "YSCORE_API_URL",
    "AFFILIATOR_MIN_SCORE",
    "AFFILIATOR_SOURCES"
  ];
  const optional = [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN"
  ];

  const envReport = {
    missing: required.filter(k => !process.env[k]),
    present: required.filter(k => !!process.env[k]),
    optional_present: optional.filter(k => !!process.env[k]),
    optional_missing: optional.filter(k => !process.env[k])
  };

  // 3) vercel.json (cron + headers)
  let vercelConfig = null;
  try {
    // essaie de charger le vercel.json packagé
    // chemin probable: racine du projet (../ car on est dans /api)
    // si non disponible au runtime, on ignore sans casser
    // eslint-disable-next-line import/no-dynamic-require, global-require
    vercelConfig = require("../vercel.json");
  } catch { vercelConfig = null; }

  const cronOk = !!vercelConfig?.crons?.some(
    c => typeof c.path === "string" && c.path.includes("/api/")
  );
  const headersOk = Array.isArray(vercelConfig?.headers) && vercelConfig.headers.length > 0;

  // 4) Pings internes (construit base URL depuis la requête)
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const base = `${proto}://${host}`;

  const cronPath = (vercelConfig?.crons?.[0]?.path || "/api/affiliation_run")
    .split("?")[0]; // retire ?secret= si présent
  const secretCron = encodeURIComponent(process.env.CRON_SECRET || "");
  const secretAdmin = encodeURIComponent(process.env.ADMIN_SECRET || "");

  const tests = [];
  tests.push(await ping(`${base}/api/healthz`));
  tests.push(await ping(`${base}${cronPath}?secret=${secretCron || "MISSING"}`));
  tests.push(await ping(`${base}/api/status`)); // si tu as déjà /api/status.js

  // 5) Verdicts & conseils
  const tips = [];
  if (envReport.missing.length) {
    tips.push(`Ajoute ces variables dans Vercel → Settings: ${envReport.missing.join(", ")}`);
  }
  if (!cronOk) {
    tips.push("Dans vercel.json, ajoute la clé 'crons' avec le chemin de ta route cron.");
  }
  if (!headersOk) {
    tips.push("Tu peux garder/ajouter les 'headers' pour gérer le cache (optionnel).");
  }
  const cronTest = tests.find(t => t.url.includes(cronPath));
  if (cronTest && (!cronTest.ok || cronTest.status === 401)) {
    tips.push("Vérifie que l’URL du cron contient bien '?secret=@CRON_SECRET' et que CRON_SECRET est défini.");
  }
  const statusTest = tests.find(t => t.url.endsWith("/api/status"));
  if (statusTest && statusTest.status === 404) {
    tips.push("Ta route /api/status est absente (ok si tu ne l'utilises pas). Teste plutôt /api/healthz.");
  }

  return res.status(200).json({
    ok: true,
    info,
    envReport,
    vercel: {
      cronConfigured: cronOk,
      headersConfigured: headersOk,
      vercelJsonLoaded: !!vercelConfig
    },
    tests,
    nextSteps: tips
  });
};
