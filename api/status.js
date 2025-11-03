export default function handler(req, res) {
  // CORS permissif pour autoriser l’appel depuis mmm-omega-five
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // No cache
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  return res.status(200).json({
    ok: true,
    version: 'v10.3',
    message: 'IA en ligne'
  });
}
