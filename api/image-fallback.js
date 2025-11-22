// pages/api/image-fallback.js
export default async function handler(req, res) {
  try {
    const { q, meta = "" } = req.query;
    if (!q) return res.status(400).json({ error: "Missing q" });

    // 1) cache lookup (si Upstash activé)
    const cached = await cacheGet(q);
    if (cached) return res.status(200).json(cached);

    // 2) génération IA
    const imageUrl = await generate3DCard(q, meta);

    const payload = {
      source: "ai-fallback",
      imageUrl,
      style: "3d-card",
      warning: "illustration",
      confidence: 0.55
    };

    // 3) cache set
    await cacheSet(q, payload);

    return res.status(200).json(payload);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// --- IA generator placeholder ---
async function generate3DCard(q, meta) {
  // TODO: brancher ton provider d’image
  // Pour l’instant on renvoie un placeholder visuel générique
  const text = encodeURIComponent(q.slice(0, 40));
  return `https://dummyimage.com/600x400/111/fff&text=${text}`;
}

// --- Upstash KV (optionnel mais recommandé) ---
async function cacheGet(q) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;

  const key = "image:" + hash(q);
  const r = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
  }).then(r => r.json());

  if (!r?.result) return null;
  try { return JSON.parse(r.result); } catch { return null; }
}

async function cacheSet(q, payload) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;

  const key = "image:" + hash(q);
  await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}
