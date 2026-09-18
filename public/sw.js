// Service Worker minimalis (Tanpa Cache-First agresif)
// Hanya untuk memenuhi syarat instalasi PWA (Progressive Web App).
// Memastikan user selalu mendapat update terbaru dari server (Network First).

const CACHE_NAME = 'diabeat-pwa-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Hanya proses request GET
  if (event.request.method !== 'GET') return;

  // Lewati request ke API / Chrome Extensions
  if (
    event.request.url.includes('/api/') || 
    event.request.url.startsWith('chrome-extension')
  ) {
    return;
  }

  // Strategi: Network First, Fallback to Cache
  // Jadi selalu narik yang terbaru dari internet, kalo internet mati baru pake cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Simpan salinan ke cache untuk jaga-jaga offline
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(async () => {
        // Internet mati, coba ambil dari cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
      })
  );
});
