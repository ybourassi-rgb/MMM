// MMM V10.2.1 - Safari redirect fix
const CACHE = 'mmm-v10-2-1';
const ASSETS = [
  '/', '/index.html',
  '/market_live.html','/publish_wizard.html','/auto_publisher.html',
  '/market_live','/publish_wizard','/auto_publisher',
  '/manifest.webmanifest'
];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  const req = e.request;
  e.respondWith(
    caches.match(req, {ignoreSearch:true}).then(r=> r || fetch(req))
  );
});