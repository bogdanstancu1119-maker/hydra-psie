/**
 * ============================================================
 * HYDRA PSIE — SERVICE WORKER (offline)
 * ============================================================
 */

const CACHE_NAME = 'hydra-psie-v4';
const CORE_ASSETS = [
  './',
  './index.html',
  './ui/styles.css',
  './core/brain.js',
  './core/config.js',
  './core/log.js',
  './core/metrics.js',
  './core/compost.js',
  './core/c3.js',
  './core/pathfinder.js',
  './core/persist.js',
  './ui/render.js',
  './ui/chart.js',
  './agents/orchestrator.js',
  './agents/template.js',
  './agents/worker.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
