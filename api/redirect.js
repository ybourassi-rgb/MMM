// api/redirect.js
// Redirection + ajout automatique des UTM

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  const raw = req.query.url;
  const src = req.query.src || "telegram";       // medium
  const tag = req.query.tag || "MMY_DEALS";      // campaign

  if (!raw) {
    return res.status(400).json({ ok: false, error: "Missing url" });
  }

  let target = "";
  try {
    // raw peut être encodé, on gère les deux cas
    const value = Array.isArray(raw) ? raw[0] : raw;
    try {
      target = new URL(value).toString();
    } catch {
      target = new URL(decodeURIComponent(value)).toString();
    }
  } catch (err) {
    console.error("Redirect invalid URL:", err.message);
    return res.status(400).json({ ok: false, error: "Invalid URL" });
  }

  // Ajout des UTM
  try {
    const u = new URL(target);

    u.searchParams.set("utm_source", "MMY");
    u.searchParams.set("utm_medium", src);    // ex: telegram
    u.searchParams.set("utm_campaign", tag);  // ex: MMY_DEALS

    const finalUrl = u.toString();

    console.log("🔀 Redirect →", finalUrl);

    return res.redirect(302, finalUrl);
  } catch (err) {
    console.error("Redirect error:", err.message);
    return res.status(400).json({ ok: false, error: "Invalid URL" });
  }
}
