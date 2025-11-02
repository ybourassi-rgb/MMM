// MMM V10.3 - SW refresh & cache
const CACHE = 'mmm-v10-3';
const ASSETS = ['/', '/index.html','/market_live.html','/publish_wizard.html','/auto_publisher.html','/manifest.webmanifest','/money_motor_y.js'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim();});
self.addEventListener('fetch', e => { const {request} = e; if (request.url.includes('/api/')) { e.respondWith(fetch(request).catch(()=>caches.match(request))); } else { e.respondWith(caches.match(request, {ignoreSearch:true}).then(r=> r || fetch(request))); }});