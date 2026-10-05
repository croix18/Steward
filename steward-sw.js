/* Steward — the offline worker (v7.19). Only registered when Steward is served from an https
   address. Network first: every online load gets the newest Steward.html (updates just arrive);
   the cached copy answers when the network doesn't, so the board still opens. Same-origin GETs
   only — Google Fonts, YouTube and Slides go to the network as always. */
const CACHE = "steward-v1";
const SHELL = ["./Steward.html", "./steward.webmanifest", "./icons/steward-192.png", "./icons/steward-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("steward-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.includes("/webapp-test/")) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./Steward.html"))));
});
