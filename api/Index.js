export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    routes: [
      "/api/status",
      "/api/rss_fetch",
      "/api/yscore",
      "/api/logs_clicks",
      "/api/amazon" // si c’est ton endpoint Rainforest
    ]
  });
}
