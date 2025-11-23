export const runtime = "edge";

export async function GET() {
  const items = [
    {
      id: "deal-auto-1",
      type: "Auto",
      city: "Marrakech",
      score: 84,
      title: "Dacia Duster 2021 • 72 000 km",
      subtitle: "Prix demandé: 145 000 MAD • Estimé MMY: 165 000 MAD",
      margin: "+20 000 MAD",
      risk: "Moyen",
      horizon: "2–4 sem.",
      tags: ["Historique OK","Marché tendu","2 acheteurs actifs"],
      mediaLabel: "PHOTO / MINI-VIDÉO",
      url: "/api/r?u=https://www.avito.ma&s=auto"
    },
    {
      id: "deal-crypto-1",
      type: "Crypto",
      score: 77,
      title: "BTC en zone d’achat tactique",
      subtitle: "Signal: peur extrême + support majeur",
      margin: "+12%",
      risk: "Contrôlé",
      horizon: "2–6 sem.",
      tags: ["Volume en hausse","Retour sur support"],
      mediaLabel: "CHART / SIGNAL",
      url: "/api/r?u=https://coindesk.com&s=crypto"
    },
    {
      id: "deal-immo-1",
      type: "Immo",
      city: "Gueliz",
      score: 69,
      title: "Studio • 38 m²",
      subtitle: "Prix: 520 000 MAD • Loyer estimé: 4 200 MAD/mois",
      margin: "Rent. 9.7%",
      risk: "Faible",
      horizon: "Long terme",
      tags: ["Quartier demandé","Bonne liquidité"],
      mediaLabel: "PHOTO IMMO",
      url: "/api/r?u=https://www.mubawab.ma&s=immo"
    }
  ];

  return Response.json({ ok: true, items }, {
    headers: { "Cache-Control": "no-store" }
  });
}
