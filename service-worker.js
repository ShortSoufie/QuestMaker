const CACHE_NAME = 'questify-cache-v2';
const FILES_TO_CACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (evt) => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); }))
    )
  );
});

self.addEventListener('fetch', (evt) => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then((resp) =>
      resp ||
      fetch(evt.request).then(r => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(evt.request, r.clone());
          return r;
        });
      })
    ).catch(() => caches.match('/index.html'))
  );
});
