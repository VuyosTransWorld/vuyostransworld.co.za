/* Vuyos Trans World — service worker. Bump CACHE on each release to refresh. */
const CACHE = 'vtw-cache-v2';
const CORE = ['/', '/index.html', '/assets/logo-light.png', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never touch cross-origin (e.g. WhatsApp wa.me, Google Fonts CDN) — let the network handle it
  if (url.origin !== location.origin) return;

  // HTML / navigation -> network-first (updates show immediately; cache is offline fallback)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // Static assets -> stale-while-revalidate (fast, but self-heals so it never gets stuck stale)
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(req).then(cached => {
        const net = fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  // Everything else same-origin -> network, fall back to cache offline
  e.respondWith(fetch(req).catch(() => caches.match(req)));
});
