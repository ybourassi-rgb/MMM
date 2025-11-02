// MMM V10.3 - Money Motor Y stub (client-side)
export async function ping() {
  const r = await fetch('/api/mmy?op=ping');
  return r.json();
}
export async function quickAdvice(topic='marché') {
  const r = await fetch('/api/mmy?op=advice&topic='+encodeURIComponent(topic));
  return r.json();
}
export async function currencies() {
  const r = await fetch('/api/mmy?op=currencies');
  return r.json();
}