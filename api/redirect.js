// api/redirect.js

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Use GET" });
  }

  const target = req.query.url;
  const src = req.query.src || "tg";
  const tag = req.query.tag || "mmy";

  if (!target) {
    return res.status(400).json({ ok: false, error: "Missing url" });
  }

  // Validation de l’URL
  let cleanUrl = "";
  try {
    const u = new URL(target);
    cleanUrl = u.toString();
  } catch (err) {
    return res.status(400).json({ ok: false, error: "Invalid URL" });
  }

  // On redirige simplement (pas de Redis pour l'instant)
  return res.redirect(302, cleanUrl);
}
