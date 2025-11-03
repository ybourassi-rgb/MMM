// ✅ Money Motor Y — API Status (V10.3)
export default function handler(req, res) {
  // --- CORS : autorise toutes les origines temporairement ---
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- Réponse de statut ---
  res.status(200).json({
    ok: true,
    version: "v10.3",
    message: "IA en ligne ✅ (Accès public autorisé)"
  });
}
