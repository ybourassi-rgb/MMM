// ✅ Fichier : /api/status.js
// Vérifie si ton IA est en ligne
export default function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*"); // tu peux mettre ton domaine précis ici
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- Réponse ---
  res.status(200).json({
    ok: true,
    version: "v10.3",
    message: "IA en ligne"
  });
}
