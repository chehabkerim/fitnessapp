/* Plus Ultra service worker (generated into dist/sw.js by scripts/postexport.mjs). Hand-written, no Workbox. */
const VERSION = '__VERSION__';
const CACHE = `plus-ultra-${VERSION}`;
const PRECACHE = __PRECACHE__;
const FOOD_API = /(^|\.)openfoodfacts\.org$/;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('plus-ultra-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const htmlFor = (url) => {
  const path = url.pathname.replace(/\/$/, '') || '/index';
  return [path.endsWith('.html') ? path : `${path}.html`, `${path}/index.html`, '/workouts.html', '/index.html'];
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Open Food Facts (Phase 3): network first, cached copy when offline.
  if (FOOD_API.test(url.hostname)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || Response.error())),
    );
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Pages: network first so deploys show up, then the precached page when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE);
        for (const candidate of htmlFor(url)) {
          const hit = await cache.match(candidate);
          if (hit) return hit;
        }
        return Response.error();
      }),
    );
    return;
  }

  // Static assets (hashed JS, fonts, WASM, icons): cache first.
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const client = list.find((c) => 'focus' in c);
      return client ? client.focus() : self.clients.openWindow('/workout/active');
    }),
  );
});
