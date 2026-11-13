// JARVIS OS service worker: offline app shell + Web Push display. No secrets here.
const CACHE = 'jarvis-os-v4-1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  if (new URL(r.url).origin !== self.location.origin) return;           // never touch the Worker API or fonts
  e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));  // network first, cache when offline
});
// iOS requires every push to show a notification, so this always does.
self.addEventListener('push', e => {
  let d = { title: 'JARVIS', body: 'You have a notification.' };
  try { if (e.data) d = Object.assign(d, e.data.json()); } catch (x) {}
  e.waitUntil(self.registration.showNotification(String(d.title).slice(0, 100), { body: String(d.body).slice(0, 300), tag: d.tag, icon: './icon-192.png', badge: './icon-192.png', data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) { if (c.navigate) c.navigate(url); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
