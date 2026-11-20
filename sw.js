importScripts('abc/manifest.js');
const M = self.MANIFEST, CACHE = 'toddler-' + M.version, SLOW = 3000;
const stamped = f => M.scripts.includes(f) ? `${f}?v=${M.version}` : f;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(M.files.map(f => new Request(stamped(f), { cache: M.scripts.includes(f) ? 'default' : 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('toddler-') && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

const keep = (req, r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; };
function fresh(req) {
  const net = fetch(req, { cache: 'no-cache' }).then(r => keep(req, r));
  const late = new Promise(res => setTimeout(res, SLOW)).then(() => caches.match(req)).then(r => r || net);
  return Promise.race([net, late]).catch(() => caches.match(req, { ignoreSearch: true }));
}
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.searchParams.get('v') === M.version) e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(x => keep(e.request, x))));
  else e.respondWith(fresh(e.request));
});
