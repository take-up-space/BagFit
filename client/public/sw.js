
const CACHE_VERSION = 'v' + Date.now();
const urlsToCache = ['/'];

// Force cache invalidation on install
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName); // Delete all caches
        })
      );
    })
  );
});

// Force cache invalidation on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName); // Delete all caches
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Intercept fetch requests and bypass cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store'
    }).catch(() => {
      // If fetch fails, try without cache control
      return fetch(event.request);
    })
  );
});
