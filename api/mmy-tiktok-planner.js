// pages/api/mmy-tiktok-planner.js

/**
 * MMY TikTok Planner — Générateur de scripts vidéo automatiques
 *
 * - Style A : unboxing / présentation produit SANS visage
 * - Basé uniquement sur ta liste AMAZON_PRODUCTS
 * - Retourne 3 idées de vidéos avec :
 *    - produit choisi
 *    - hook (accroche)
 *    - texte à afficher à l'écran (3-4 écrans)
 *    - description TikTok
 *    - hashtags
 */

const AMAZON_PRODUCTS = [
  // ⚠️ Mets ici EXACTEMENT la même liste que dans mmy-autopublisher.js
  "https://www.amazon.fr/dp/B09G3HRMVB",
  "https://www.amazon.fr/dp/B08W8DGK3X",
  "https://www.amazon.fr/dp/B0B3DQZHN8",
  "https://www.amazon.fr/dp/B07PGL2WVS",
  // ... (continue avec toute ta liste de 100 produits)
];

function pickRandom(arr, count) {
  const copy = [...arr];
  const result = [];
  while (copy.length && result.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function buildVideoPlan(productUrl, index) {
  const shortId = productUrl.split("/dp/")[1] || productUrl;

  // Hooks possibles pour le style A (unboxing sans visage)
  const hooks = [
    "🔥 T'as vu ce produit Amazon ?",
    "Ce gadget Amazon explose en ce moment 😳",
    "Je comprends pourquoi ce produit cartonne sur Amazon…",
    "Ils n'auraient jamais dû laisser ça à ce prix…",
    "Amazon a encore frappé fort avec ce produit 😅",
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];

  const overlayScreens = [
    hook,
    "Unboxing sans visage : montre juste le produit 👀",
    "Zoom 1-2 fois sur le détail le plus intéressant",
    "Fin : 'Lien en bio pour voir le prix 🔥'",
  ];

  const hashtags = [
    "#amazonfinds",
    "#bonsplans",
    "#tiktokmadelmebuyit",
    "#hightech",
    "#gadget",
    "#deals",
    "#astuces"
  ];

  const description =
    `🔥 Trouvaille Amazon du jour (${index + 1})\n` +
    `👇 Lien en bio pour voir le prix\n` +
    hashtags.join(" ");

  return {
    productUrl,
    productId: shortId,
    style: "A_UNBOXING_NO_FACE",
    hook,
    overlayScreens,
    suggestedMusic: "Son tendance TikTok (DRILL / Wurk / sped up)",
    tiktokDescription: description,
  };
}

export default function handler(req, res) {
  try {
    const picks = pickRandom(AMAZON_PRODUCTS, 3);
    const plans = picks.map((url, i) => buildVideoPlan(url, i));

    return res.status(200).json({
      ok: true,
      count: plans.length,
      videos: plans,
    });
  } catch (err) {
    console.error("Erreur mmy-tiktok-planner:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
