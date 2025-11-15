// /api/redirect.js
// Simple redirect + UTM, SANS Redis

export default function handler(req, res) {
  // 1) Méthode autorisée
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  // 2) Récupération du paramètre ?url=
  let raw = req.query.url;
  if (Array.isArray(raw)) raw = raw[0];

  if (!raw) {
    return res.status(400).json({ ok: false, error: "Missing url" });
  }

  let target;
  try {
    // On accepte soit une URL normale, soit déjà encodée
    try {
      target = new URL(raw).toString();
    } catch {
      target = new URL(decodeURIComponent(raw)).toString();
    }
  } catch (e) {
    console.error("❌ URL invalide dans /api/redirect :", e);
    // Fallback safe
    res.writeHead(302, { Location: "https://google.com" });
    return res.end();
  }

  // 3) Ajout des UTM
  let finalUrl = target;
  try {
    const u = new URL(target);
    u.searchParams.set("utm_source", "MMY");
    u.searchParams.set("utm_medium", "telegram");
    u.searchParams.set("utm_campaign", "MMY_DEALS");
    finalUrl = u.toString();
  } catch (e) {
    console.warn("⚠️ Impossible d'ajouter les UTM, on redirige brut.");
    finalUrl = target;
  }

  console.log("🔀 Redirect →", finalUrl);

  // 4) Redirection 302
  res.writeHead(302, { Location: finalUrl });
  return res.end();
}
