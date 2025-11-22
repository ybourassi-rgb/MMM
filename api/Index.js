export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    name: "MMM API Index",
    routes: [
      "/api/status",
      "/api/rss_fetch",
      "/api/yscore",
      "/api/logs_clicks",
      "/api/affiliation_run",
      "/api/mmy-autopublisher"
    ]
  });
}
