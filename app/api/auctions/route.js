// app/api/auctions/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// frais Alcopa
const FEE_RATE = 0.17;

// mini helper
const safeNum = (v) => {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

function normalizeAuction(raw, i=0, source="alcopa") {
  const prix_depart = safeNum(raw.prix_depart ?? raw.price_start ?? raw.startPrice);
  const frais = prix_depart != null ? Math.round(prix_depart * FEE_RATE) : null;
  const prix_total = (prix_depart != null && frais != null) ? prix_depart + frais : null;

  const cote = safeNum(raw.cote_argus ?? raw.argus ?? raw.marketPrice);
  const invest_max = cote != null ? Math.round(cote * 0.7) : null;

  return {
    id: raw.lot || raw.id || `${Date.now()}-auc-${i}`,
    title: raw.modele || raw.title || "Lot enchère",
    image: raw.image || raw.img || null,
    url: raw.url || raw.link || null,
    link: raw.url || raw.link || null,

    price: prix_depart != null ? `${prix_depart}€ (départ)` : null,
    score: raw.yscore?.globalScore ?? raw.score ?? null,
    category: "enchère",
    bucket: "auction",

    // metrics DealSlide
    margin: cote && prix_total 
      ? `${Math.max(0, Math.round(((cote - prix_total)/cote)*100))}%`
      : null,

    risk: prix_total && invest_max
      ? `${prix_total <= invest_max ? 30 : 70}/100`
      : null,

    horizon: "court terme",

    // champs utiles pour plus tard
    auction: {
      lot: raw.lot || null,
      ville: raw.ville || raw.city || null,
      annee: raw.annee || raw.year || null,
      km: raw.km || raw.mileage || null,
      prix_depart,
      frais,
      prix_total,
      cote,
      invest_max,
    },

    source,
    summary: raw.resume || raw.summary || null,
    publishedAt: raw.date || null,
  };
}

export async function GET() {
  try {
    // TODO: pour l’instant on lit une source statique
    // plus tard tu me donnes CSV/JSON et je branche
    const mock = [
      // EXEMPLE
      {
        lot: "A123",
        ville: "Paris",
        modele: "Peugeot 208",
        annee: 2020,
        km: 54000,
        prix_depart: 5200,
        cote_argus: 9000,
        url: "https://exemple-alcopa/lot/A123",
        image: null,
        resume: "Bon état, CT ok.",
      }
    ];

    const items = mock.map((r, i) => normalizeAuction(r, i));
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok:false, error:e?.message, items:[] }, { status:500 });
  }
}
