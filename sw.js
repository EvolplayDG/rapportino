/* Rapportino Operai Evolplay — service worker
   Serve il rapportino anche senza connessione.
   Dopo ogni modifica a index.html alza il numero di VERSIONE qui sotto. */
const VERSIONE = "v3";
const CACHE = "rapportino-" + VERSIONE;
const BASE = [ "./", "./index.html", "./manifest.json" ];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // pagina: prima la rete, la copia in cache se la rete manca
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => { const c = r.clone(); caches.open(CACHE).then((k) => k.put("./index.html", c)); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // tutto il resto (compresi i font Google): prima la cache
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      const c = r.clone();
      caches.open(CACHE).then((k) => k.put(req, c));
      return r;
    }).catch(() => hit))
  );
});
