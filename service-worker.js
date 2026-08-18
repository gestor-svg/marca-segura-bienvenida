// MARCA SEGURA — Paquete de Bienvenida — Service Worker
// Sube el número de versión cada vez que subas cambios a la app,
// igual que ya haces con "Nueva versión" en Apps Script.
const CACHE_VERSION = 'ms-bienvenida-v3';

const URLS_TO_CACHE = [
  './',
  './index.html',
  './app.mjs',
  './extract.mjs',
  './extractLogo.mjs',
  './templates.mjs',
  './date-utils.mjs',
  './assets.mjs',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Librerías externas — se cachean también para que funcione con conexión débil
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.4.4/qrcode.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nunca cachear llamadas a tu Apps Script de referidos ni al PDF que suba el usuario
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Solo cachear respuestas válidas y del mismo origen o de las librerías conocidas
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
