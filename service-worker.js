const VERSION = "mmmy-v3";
const STATIC_CACHE = `static-${VERSION}`;

const STATIC_ASSETS = [
  "/", "/index.html",
  "/mmm.css?v=1038"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith("static-") && k !== STATIC_CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// stratégie :
// - /api/* : network-first (toujours frais)
// - CSS/JS/HTML/images: stale-while-revalidate
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/")) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(e.request, { cache: "no-store" });
        return fresh;
      } catch {
        const cached = await caches.match(e.request);
        return cached || new Response(JSON.stringify({ ok:false, error:"offline" }), { status: 503 });
      }
    })());
    return;
  }

  // SWR pour le reste
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    const fetchPromise = fetch(e.request).then((resp) => {
      const copy = resp.clone();
      caches.open(STATIC_CACHE).then(cache => cache.put(e.request, copy));
      return resp;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});
