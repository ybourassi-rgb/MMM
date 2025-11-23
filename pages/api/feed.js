export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok:true,
    items:[
      {
        id:"deal-auto-1",
        title:"Dacia Duster 2021 • 72 000 km",
        subtitle:"Prix demandé: 145 000 MAD • Estimé MMY: 165 000 MAD",
        mediaLabel:"AUTO"
      },
      {
        id:"deal-crypto-1",
        title:"BTC en zone d’achat tactique",
        subtitle:"Signal: peur extrême + support majeur",
        mediaLabel:"CRYPTO"
      }
    ]
  });
}
