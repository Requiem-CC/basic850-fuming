const CACHE_NAME = 'basic850-pwa-v1';
const PRE_CACHE = [
  './index-pwa.html',
  './manifest-pwa.json',
  './lina-macos.png',
];

// Pre-cache essential files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// Clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first, then network, then fallback
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      // Try network and cache the response
      return fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        // If HTML request fails, return cached index-pwa.html
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index-pwa.html');
        }
      });
    })
  );
});
