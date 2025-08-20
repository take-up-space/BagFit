
// BagFit Service Worker - Cache Invalidation v2.2.0
// NUCLEAR CACHE BUSTING - Forces complete cache refresh

const CACHE_VERSION = 'bagfit-v2.2.0-' + Date.now();
const FORCE_UPDATE = true;

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker with cache version:', CACHE_VERSION);
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    (async () => {
      // Delete ALL existing caches
      const cacheNames = await caches.keys();
      console.log('[SW] Deleting all caches:', cacheNames);
      
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      // Force all clients to refresh
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        console.log('[SW] Forcing client refresh');
        client.postMessage({ type: 'FORCE_REFRESH' });
      });
      
      // Take control of all pages immediately
      return self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  // Intercept ALL requests and prevent caching
  event.respondWith(
    fetch(event.request.clone(), {
      cache: 'no-store',
      headers: {
        ...event.request.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).then(response => {
      // Clone response and add anti-cache headers
      const responseClone = response.clone();
      const headers = new Headers(responseClone.headers);
      
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      
      return new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
    }).catch(error => {
      console.log('[SW] Fetch error:', error);
      return fetch(event.request);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
