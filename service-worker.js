const CACHE_NAME = 'questmaker-cache-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js'
];

// Install: cache core files
self.addEventListener('install', event => {
  self.skipWaiting(); // activate new SW asap
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      const deletions = keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k));
      return Promise.all(deletions);
    }).then(() => self.clients.claim())
  );
});

// Fetch: try cache first, then network; cache network responses if valid
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);

  // For navigation requests, prefer network but fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // only cache valid, basic (same-origin) GET responses with 200 status
        if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => {
          // swallow errors silently (e.g. opaque responses)
          cache.put(event.request, copy).catch(err => console.warn('Cache put failed', err));
        });
        return resp;
      }).catch(err => {
        // network failed, fallback to index.html for navigations or return cached
        return caches.match('./index.html');
      });
    })
  );
});
