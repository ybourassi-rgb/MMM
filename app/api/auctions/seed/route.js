import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE = [
  {
    title: "Carte Pokémon Dracaufeu 1ère édition",
    url: "https://example.com/pokemon-dracaufeu",
    images: ["https://images.pokemontcg.io/base1/4_hires.png"],
    startingPrice: 120,
    bidStep: 5,
    endAt: new Date(Date.now() + 1000*60*60*6).toISOString(), // 6h
    category: "lifestyle",
    summary: "Très rare, état impeccable, authentique.",
    seller: "Yassine93"
  },
  {
    title: "PS5 édition limitée",
    url: "https://example.com/ps5",
    images: ["https://m.media-amazon.com/images/I/61K5d8A7LFL._AC_SL1500_.jpg"],
    startingPrice: 300,
    bidStep: 10,
    endAt: new Date(Date.now() + 1000*60*60*12).toISOString(),
    category: "tech",
    summary: "Console neuve scellée.",
    seller: "SoukDealer"
  },
  {
    title: "Tapis persan ancien",
    url: "https://example.com/tapis",
    images: ["https://upload.wikimedia.org/wikipedia/commons/2/2a/Persian_Carpet.jpg"],
    startingPrice: 80,
    bidStep: 5,
    endAt: new Date(Date.now() + 1000*60*60*24).toISOString(),
    category: "home",
    summary: "Vintage, bon état.",
    seller: "AtlasVintage"
  }
];

export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const results = [];

    for (const a of SAMPLE) {
      const r = await fetch(base + "/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(a),
        cache: "no-store"
      });
      results.push(await r.json());
    }

    return NextResponse.json({ ok: true, seeded: results.length, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
