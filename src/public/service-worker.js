/* eslint-disable no-restricted-globals */
// Nama cache untuk aplikasi
const CACHE_NAME = 'story-app-v1';

// Daftar aset yang akan di-cache - Perhatikan path-nya
const urlsToCache = [
  './', // Gunakan path relatif './' alih-alih '/'
  './index.html',
  './app.bundle.js',
  // Hapus app.webmanifest jika tidak yakin file ini ada
  './favicon.png'
];

// Event saat Service Worker diinstal
self.addEventListener('install', (event) => {
  // Tunggu hingga proses caching selesai
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache dibuka');
        // Cache file satu per satu untuk mengetahui file mana yang gagal
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.error(`Gagal cache: ${url}`, err);
              // Lanjutkan meskipun ada file yang gagal
              return Promise.resolve();
            });
          })
        );
      })
      .catch((error) => {
        console.error('Gagal menyimpan cache:', error);
      })
  );
});

// Event saat Service Worker diaktifkan
self.addEventListener('activate', (event) => {
  // Hapus cache lama
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});

// Event saat terjadi permintaan fetch
self.addEventListener('fetch', (event) => {
  // Tangani hanya permintaan GET
  if (event.request.method !== 'GET') return;
  
  const requestUrl = new URL(event.request.url);
  
  // Abaikan request API dan analytics
  if (requestUrl.pathname.startsWith('/v1/') || 
      requestUrl.hostname.includes('google-analytics') ||
      requestUrl.hostname.includes('googleapis') ||
      requestUrl.hostname.includes('dicoding.dev')) {
    return;
  }
  
  // Strategi Cache: Stale While Revalidate
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Mulai fetch jaringan
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Perbarui cache dengan respons jaringan
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => console.error('Gagal update cache:', err));
            }
            return networkResponse;
          })
          .catch(() => {
            console.log('Gagal fetch dari jaringan');
            return null;
          });
        
        // Gunakan cache jika tersedia, jika tidak tunggu fetch jaringan
        return response || fetchPromise;
      })
  );
});