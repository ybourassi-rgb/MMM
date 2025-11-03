// ✅ Money Motor Y — API Conseiller
export default async function handler(req, res) {
  // --- Autorisations CORS (pour ton domaine principal MMM) ---
  res.setHeader("Access-Control-Allow-Origin", "https://mmm-omega-five.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- Gestion des requêtes POST (conseil instantané) ---
  if (req.method === "POST") {
    try {
      const { prompt } = req.body;

      if (!prompt || prompt.trim() === "") {
        return res.status(400).json({ ok: false, error: "Prompt vide" });
      }

      // 🧠 Simule la réponse IA (version locale avant OpenAI)
      const conseil = `🧠 Conseil Money Motor Y : Pour le sujet "${prompt}", je te recommande d'analyser la rentabilité et la liquidité avant toute décision.`;

      return res.status(200).json({
        ok: true,
        reply: conseil,
      });

    } catch (err) {
      console.error("Erreur Advisor:", err);
      return res.status(500).json({ ok: false, error: "Erreur interne Advisor" });
    }
  }

  // --- Pour toute autre méthode HTTP ---
  return res.status(405).json({ ok: false, error: "Méthode non autorisée" });
}
