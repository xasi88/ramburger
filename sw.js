// Работа без сети. Сначала сеть, чтобы гость сразу видел новые цены.
// Нет сети: отдаём последнюю сохранённую копию. Фото блюд берём из копии: они не меняются.
// На xasi88.github.io живут и другие приложения автора (статистика, сайты): чужие копии не трогаем.

const CACHE = "ramburger-v3";
const CORE = [
  "./", "index.html", "data/menu.js", "manifest.webmanifest",
  "css/base.css", "css/menu.css", "css/views.css",
  "js/data.js", "js/icons.js", "js/cart.js", "js/ui.js", "js/stats.js", "js/menu.js", "js/order.js", "js/app.js", "js/install.js",
  "img/icon-192.png", "img/food/combo1.webp",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("ramburger-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const photo = url.pathname.includes("/img/");
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (photo) {
      const hit = await cache.match(e.request);
      if (hit) return hit;
    }
    try {
      const res = await fetch(e.request, photo ? undefined : { cache: "no-cache" });
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(e.request, { ignoreSearch: true })) || (await cache.match("index.html")) || Response.error();
    }
  })());
});
