// api/index.js
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    name: "MMM API Index",
    routes: [
      { path: "/api/status", desc: "Health check / statut serveur" },
      { path: "/api/rss_fetch", desc: "Fetch Marché en Direct (RSS)" },
      { path: "/api/yscore", desc: "Analyse rapide Y-Score" },
      { path: "/api/logs_clicks", desc: "Stats Upstash clicks" },

      { path: "/api/affiliation_run", desc: "Cron affiliation (run automatique)" },
      { path: "/api/mmy-autopublisher", desc: "Cron autopublisher" }

      // Ajoute ici ta route Rainforest exacte si besoin :
      // { path: "/api/amazon", desc: "Produit Amazon via Rainforest" }
    ],
    timestamp: new Date().toISOString()
  });
}
