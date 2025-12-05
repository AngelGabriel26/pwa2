// ===============================
//  SERVICE WORKER PROFESIONAL
//  Offline, Cache Dinámico y Limpieza
// ===============================

const CACHE_NAME = "candyland-cache-v5";     // Cambia versión si haces cambios
const DYNAMIC_CACHE = "dynamic-v1";
const OFFLINE_PAGE = "./offline.html";

// Archivos principales que deben funcionar offline
const ASSETS = [
  "./",
  "./index.html",
  "./actividades.html",
  "./examen.html",
  "./juego.html",
  "./styles.css",
  "./app.js",
  "./client.js",
  "./examen.js",
  "./manifest.json",
  OFFLINE_PAGE
];

// ===============================
//  INSTALACIÓN
// ===============================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ===============================
//  ACTIVACIÓN (limpia caches viejos)
// ===============================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ===============================
//  FETCH (modo offline + cache dinámico)
// ===============================
self.addEventListener("fetch", event => {
  const req = event.request;

  // Solo manejar GET
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then(cacheRes => {
      // 1. Respuesta desde cache
      if (cacheRes) return cacheRes;

      // 2. Intentar desde red
      return fetch(req)
        .then(networkRes => {
          // Guardar respuesta dinámica
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(req, networkRes.clone());
            return networkRes;
          });
        })
        .catch(() => {
          // 3. Si NO hay red → fallback (solo para páginas)
          if (req.headers.get("accept").includes("text/html")) {
            return caches.match(OFFLINE_PAGE);
          }
        });
    })
  );
});

// ===============================
//  NOTIFICATIONS CLICK
// ===============================
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "./";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then(win => {
      const open = win.find(c => c.url.includes(url));
      if (open) return open.focus();
      return clients.openWindow(url);
    })
  );
});
