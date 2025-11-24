import { NextResponse } from "next/server";

// ⚠️ stockage temporaire en mémoire (reset à chaque redeploy)
// on remplacera par Upstash/DB ensuite
let COMMUNITY_DEALS = [];

export async function POST(req) {
  try {
    const body = await req.json();

    const title = (body.title || "").trim();
    const url = (body.url || "").trim();
    if (!title || !url) {
      return NextResponse.json(
        { ok: false, error: "Titre et lien obligatoires." },
        { status: 400 }
      );
    }

    const item = {
      id: `community-${Date.now()}`,
      title,
      url,
      link: url,
      image: body.image || null,
      price: body.price || null,
      category: body.category || "autre",
      city: body.city || null,
      halal: body.halal ?? null,
      summary: body.summary || null,
      source: "community",
      publishedAt: new Date().toISOString(),
      score: null,
      margin: null,
      risk: null,
      horizon: "court terme",
      affiliateUrl: null,
    };

    COMMUNITY_DEALS.unshift(item);
    COMMUNITY_DEALS = COMMUNITY_DEALS.slice(0, 200); // limite

    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Publish error" },
      { status: 500 }
    );
  }
}

// ✅ optionnel: récupérer les deals communauté
export async function GET() {
  return NextResponse.json({ ok: true, items: COMMUNITY_DEALS });
}
