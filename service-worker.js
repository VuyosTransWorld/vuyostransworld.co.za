/* Vuyos Trans World — self-destroying service worker.
   A previous version cached /assets/* (stale-while-revalidate), which left
   returning visitors stuck on old content (e.g. the community screenshots
   never appeared). This tombstone replaces that old worker, clears every
   cache, unregisters itself, then reloads open pages so they fetch fresh
   from the network. After it unregisters, no service worker remains. */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Take control of any pages the old worker was serving.
    await self.clients.claim();

    // Flush all caches left behind by the previous worker.
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));

    // Remove this registration entirely.
    await self.registration.unregister();

    // Reload controlled pages once so they pull the current site fresh.
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => client.navigate(client.url));
  })());
});
