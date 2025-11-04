export default function handler(req, res) {
  // 🔒 Anti-cache pour Safari, Vercel et CDN
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  // ✅ Réponse simple indiquant que l’API est en ligne
  res.status(200).json({
    ok: true,
    status: "online",
    server: "vercel",
    timestamp: new Date().toISOString()
  });
}
