// service-worker.js
// Bu dosya sayesinde tarayıcı "bu bir uygulama, ana ekrana eklenebilir" diyor.
// Ayrıca dosyaları önbelleğe alıp internet zayıfken bile uygulamanın
// (arayüzün) açılmasını sağlıyor. Mesajlar için internet hâlâ gerekli.

const CACHE_NAME = "kendi-sohbetim-v1";
const FILES_TO_CACHE = [
  "./index.html",
  "./style.css",
  "./app.js",
  "./config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Sadece kendi dosyalarımızı cache'liyoruz; API/WebSocket isteklerine dokunmuyoruz.
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
