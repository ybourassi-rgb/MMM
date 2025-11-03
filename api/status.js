// /api/status.js
export default function handler(req, res) {
  // CORS (autorise tous les domaines — mets ton domaine si tu veux restreindre)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Préflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // Anti-cache
  res.setHeader("Cache-Control", "no-store, max-age=0");

  return res.status(200).json({
    ok: true,
    version: "v10.3",
    message: "IA en ligne",
  });
}
