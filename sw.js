const CACHE = "justice-data-v1";
const ASSETS = [
  "index.html",
  "activite.html",
  "penal.html",
  "civil.html",
  "vif.html",
  "prisons.html",
  "aide-juridictionnelle.html",
  "delais.html",
  "budget.html",
  "carte.html",
  "explorer.html",
  "css/style.css",
  "js/app.js",
  "js/charts.js",
  "manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Cache first for same-origin, network first for data
  if (url.pathname.startsWith("/justice-opendata/data/") || url.pathname.includes("data/")) {
    e.respondWith(fetch(e.request).catch(()=> caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      // Optionally cache new assets
      return res;
    }).catch(()=> cached))
  );
});
