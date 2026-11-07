// Service worker: guarda la app para que abra sin internet.
// Al publicar cambios, sube VERSION para que se actualice en el teléfono.
const VERSION = 'fitapp-v1.4.0';
const ARCHIVOS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './alimentos.json',
  './rutinas.json',
  './entrenar.js',
  './progreso.js',
  './cocina.js',
  './cuerpo.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION && k !== 'fitapp-librerias').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero lo guardado (rápido y sin internet); en segundo plano se actualiza.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const origen = new URL(req.url).origin;
  // Librerías del escáner (se descargan la primera vez y quedan guardadas).
  if (origen === 'https://cdn.jsdelivr.net' || origen === 'https://tessdata.projectnaptha.com') {
    e.respondWith(caches.open('fitapp-librerias').then(async (cache) => {
      const guardado = await cache.match(req);
      if (guardado) return guardado;
      const resp = await fetch(req);
      if (resp && (resp.ok || resp.type === 'opaque')) cache.put(req, resp.clone());
      return resp;
    }));
    return;
  }
  if (origen !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const guardado = await cache.match(req, { ignoreSearch: true });
      const red = fetch(req)
        .then((resp) => {
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        })
        .catch(() => guardado);
      return guardado || red;
    })
  );
});
