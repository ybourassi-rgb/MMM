export default function handler(req, res) {
  try {
    // 🔍 On vérifie la présence d'une clé API dans les variables d'environnement
    const hasKey =
      process.env.OPENAI_API_KEY ||
      process.env.MMM_Vercel_Key ||
      process.env.MMM_Vercel_KEY;

    if (hasKey) {
      res.status(200).json({
        ok: true,
        version: "v10.3",
        message: "IA en ligne 🚀",
      });
    } else {
      res.status(500).json({
        ok: false,
        message: "❌ Aucune clé API détectée côté serveur",
      });
    }
  } catch (e) {
    res.status(500).json({
      ok: false,
      message: "Erreur interne : " + e.message,
    });
  }
}
