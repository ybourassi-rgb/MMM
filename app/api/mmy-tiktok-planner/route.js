// app/api/mmy-tiktok-planner/route.js
import { NextResponse } from "next/server";
import { AMAZON_PRODUCTS } from "../../../lib/amazonProducts.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function pickRandomUnique(arr, count = 3) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const copy = [...arr].filter(Boolean);
  const result = [];
  while (copy.length && result.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function extractASIN(url = "") {
  const m = url.match(/\/dp\/([A-Z0-9]{8,10})/i);
  return m ? m[1] : null;
}

function buildVideoPlan(productUrl, index) {
  const asin = extractASIN(productUrl);
  const shortId = asin || productUrl.split("?")[0].slice(-12);

  const hooks = [
    "🔥 Grosse trouvaille Amazon du jour !",
    "😳 Ce produit Amazon est en train d'exploser…",
    "Je te montre pourquoi tout le monde l’achète.",
    "Amazon a encore sorti une pépite à petit prix…",
    "Ils n’auraient jamais dû laisser ça en vente 😅",
    "Si tu aimes les bons plans, regarde ça 👀",
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];

  const overlayScreens = [
    hook,
    "Unboxing sans visage : montre le produit direct 📦",
    "Zoom sur LE truc qui fait la diff ✅",
    "Fin : « Lien en bio pour voir le prix 🔥 »",
  ];

  const hashtags = [
    "#amazonfinds",
    "#bonsplans",
    "#tiktokmademebuyit",
    "#gadget",
    "#deals",
    "#promo",
    "#astuces",
  ];

  const description =
    `🔥 Trouvaille Amazon #${index + 1}\n` +
    `👇 Lien en bio pour voir le prix\n` +
    hashtags.join(" ");

  return {
    productUrl,
    productId: shortId,
    style: "A_UNBOXING_NO_FACE",
    hook,
    overlayScreens,
    suggestedMusic: "Son tendance TikTok (sped up / drill / pop viral)",
    tiktokDescription: description,
    hashtags,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const count = Math.max(
      1,
      Math.min(5, Number(searchParams.get("count") || 3))
    );

    if (!AMAZON_PRODUCTS?.length) {
      return json({ ok: false, error: "AMAZON_PRODUCTS empty" }, 500);
    }

    const picks = pickRandomUnique(AMAZON_PRODUCTS, count);
    const videos = picks.map((url, i) => buildVideoPlan(url, i));

    return json({
      ok: true,
      count: videos.length,
      videos,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("mmy-tiktok-planner error:", err);
    return json({ ok: false, error: err.message || "internal_error" }, 500);
  }
}
