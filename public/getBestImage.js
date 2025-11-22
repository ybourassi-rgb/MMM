export async function getBestImage({ q, type = "product", url }) {
  const realUrl = url
    ? `/api/image-real?url=${encodeURIComponent(url)}&type=${type}`
    : `/api/image-real?q=${encodeURIComponent(q)}&type=${type}`;

  const real = await fetch(realUrl).then(r => r.json());

  if (real?.imageUrl && real.confidence >= 0.6) return real;

  const fallback = await fetch(
    `/api/image-fallback?q=${encodeURIComponent(q)}`
  ).then(r => r.json());

  return fallback;
}
