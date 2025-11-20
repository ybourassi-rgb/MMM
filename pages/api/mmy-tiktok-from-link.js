// pages/api/mmy-tiktok-from-link.js
//
// MMY TikTok From Link — Génère un plan de vidéo TikTok à partir d'un lien produit
//
// - Input : productUrl (Amazon, AliExpress, etc.)
// - Output : 1 plan de vidéo avec :
//    - hook
//    - overlayScreens (texte à afficher à l'écran)
//    - description TikTok
//    - hashtags
//

function buildVideoPlan(productUrl) {
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
    "#astuces",
  ];

  const description =
    `🔥 Trouvaille Amazon du jour\n` +
    `👇 Lien en bio pour voir le prix\n` +
    hashtags.join(" ");

  return {
    productUrl,
    productId: shortId,
    style: "A_UNBOXING_NO_FACE",
    hook,
    overlayScreens,
    suggestedMusic: "Son tendance TikTok (DRILL / sped up / trend)",
    tiktokDescription: description,
    hashtags,
  };
}

export default async function handler(req, res) {
  try {
    let productUrl = null;

    if (req.method === "GET") {
      productUrl = req.query.url || req.query.productUrl || null;
    } else if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      productUrl = body?.productUrl || body?.url || null;
    } else {
      return res.status(405).json({ ok: false, error: "Méthode non autorisée" });
    }

    if (!productUrl || typeof productUrl !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "Paramètre productUrl (ou url) manquant" });
    }

    const plan = buildVideoPlan(productUrl);

    return res.status(200).json({
      ok: true,
      video: plan,
    });
  } catch (err) {
    console.error("Erreur mmy-tiktok-from-link:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
