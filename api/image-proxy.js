// /api/image-proxy.js
// Proxy d'image simple pour afficher les images Amazon (ou autres)
// Exemple d'appel : /api/image-proxy?url=https%3A%2F%2Fm.media-amazon.com%2Fimages%2F...

export default async function handler(req, res) {
  try {
    // Récupère l'URL de l'image depuis ?url=
    const urlParam =
      (req.query && req.query.url) ||
      new URL(req.url, `http://${req.headers.host}`).searchParams.get("url");

    if (!urlParam) {
      res.status(400).send("Missing url parameter");
      return;
    }

    // On évite de proxy n'importe quoi (sécurité minimale)
    if (!urlParam.startsWith("http://") && !urlParam.startsWith("https://")) {
      res.status(400).send("Invalid url");
      return;
    }

    // Fetch de l'image distante
    const upstream = await fetch(urlParam);

    if (!upstream.ok) {
      res.status(upstream.status).send("Upstream error");
      return;
    }

    const contentType =
      upstream.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await upstream.arrayBuffer());

    // Headers de réponse
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // 1 jour de cache
    res.status(200).send(buffer);
  } catch (err) {
    console.error("[image-proxy] Error:", err);
    res.status(500).send("Proxy error");
  }
}
