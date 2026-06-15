// Föreningsbokföring – Service Worker
// Uppdatera CACHE_NAME vid varje ny version för att tvinga uppdatering
const CACHE_NAME = 'foreningsbokforing-v4';

const ASSETS = [
  './foreningsbokforing.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// ── Install: cache alla filer ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: rensa gamla cachar ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first, fallback till nätverk ──────────────────────────────
self.addEventListener('fetch', event => {
  // Skippa non-GET och externa requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cacha nya resurser dynamiskt
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline-fallback: returnera appen
      return caches.match('./foreningsbokforing.html');
    })
  );
});
