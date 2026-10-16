/* CHẠY OFFLINE – chỉ hoạt động khi app được mở qua một đường link (http/https).
   Luôn thử lấy bản mới nhất trước, mất mạng thì dùng bản đã lưu. */
const V = 'heodat-v9';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'css/base.css', 'css/today.css', 'css/entry.css', 'css/month.css', 'css/settings.css', 'css/effects.css', 'js/config.js', 'js/money.js', 'js/dates.js', 'js/calc.js', 'js/storage.js', 'js/ui.js', 'js/effects.js', 'js/mascot.js', 'js/today.js', 'js/month.js', 'js/settings.js', 'js/entry.js', 'js/themes.js', 'js/app.js', 'css/themes.css', 'bg/daigia-left.svg', 'bg/daigia-right.svg', 'bg/cute-left.svg', 'bg/cute-right.svg', 'bg/cuoithang-left.svg', 'bg/cuoithang-right.svg', 'bg/tet-left.svg', 'bg/tet-right.svg', 'bg/newyear-left.svg', 'bg/newyear-right.svg', 'bg/halloween-left.svg', 'bg/halloween-right.svg', 'bg/trungthu-left.svg', 'bg/trungthu-right.svg', 'bg/noel-left.svg', 'bg/noel-right.svg', 'bg/bobble-left.svg', 'bg/bobble-right.svg', 'bg/thantai-left.svg', 'bg/thantai-right.svg', 'js/plan.js', 'css/plan.css', 'js/theme-catalog.js', 'js/theme-motion-data.js', 'js/theme-motion.js', 'js/theme-preview.js', 'css/theme-scene.css', 'css/theme-motion.css'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(V).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
