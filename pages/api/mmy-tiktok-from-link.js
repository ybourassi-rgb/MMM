import axios from "axios";

/**
 * Route API : /api/mmy-tiktok-from-link
 *
 * ❗Objectif :
 * - Recevoir un lien Amazon + image
 * - Générer automatiquement un script TikTok format JSON
 * - Retourner un plan vidéo prêt à être utilisé par ton bot TikTok
 */

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Méthode non autorisée" });
    }

    const { productUrl, imageUrl } = req.body;

    if (!productUrl) {
      return res.status(400).json({ ok: false, error: "productUrl manquant" });
    }

    // Hook suggestions
    const hooks = [
      "🔥 Tu connais ce produit Amazon ?",
      "Ce gadget explose en tendance 🤯",
      "Ils ont laissé ce truc à ce prix… 😳",
      "C’est clairement sous-coté…",
      "Impossible de passer à côté 😅",
    ];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];

    // Génération des écrans simples (style no-face)
    const overlayScreens = [
      hook,
      "Montre le produit sans visage 👀",
      "Zoom 1-2x sur la partie la plus intéressante",
      "Fin : 'Lien en bio pour voir le prix 🔥'",
    ];

    // Hashtags
    const hashtags = [
      "#amazonfinds",
      "#bonsplans",
      "#tiktokmademebuyit",
      "#gadget",
      "#deals",
      "#astuces",
    ];

    const description =
      `🔥 Trouvaille Amazon du moment\n👇 Lien en bio pour voir le prix\n` +
      hashtags.join(" ");

    const result = {
      ok: true,
      from: "MMY TikTok Generator",
      productUrl,
      imageUrl: imageUrl || null,
      script: {
        style: "A_UNBOXING_NO_FACE",
        hook,
        overlayScreens,
        suggestedMusic: "Son tendance TikTok (sped up / drill / afro)",
        tiktokDescription: description,
      },
    };

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || "Erreur interne",
    });
  }
}
