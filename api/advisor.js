// ✅ Fichier : /api/advisor.js
// Reçoit les requêtes du tableau de bord et renvoie une réponse de ton IA
export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*"); // tu peux remplacer * par "https://mmm-omega-five.vercel.app"
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- Vérifie la méthode ---
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { prompt } = req.body;

    // --- Vérifie que le prompt n'est pas vide ---
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ error: "Prompt vide" });
    }

    // --- Simulation de l’IA Money Motor Y ---
    // (tu pourras connecter OpenAI ou une autre API ici plus tard)
    const fakeReply = `🧠 Conseil Money Motor Y : Pour le sujet "${prompt}", je te recommande d'analyser la rentabilité et la liquidité avant toute décision.`;

    // --- Réponse ---
    return res.status(200).json({
      ok: true,
      reply: fakeReply
    });
  } catch (err) {
    // --- Gestion des erreurs ---
    return res.status(500).json({
      ok: false,
      error: "Erreur serveur : " + err.message
    });
  }
}
