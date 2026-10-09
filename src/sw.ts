// Service Worker: 2回目以降はキャッシュから即表示し（通信ゼロ・圏外でも可）、裏で最新版を取りに行く。
const sw = self as unknown as ServiceWorkerGlobalScope;
const PAGE = "./";

sw.addEventListener("install", (e) => {
  // 直前に読んだ HTML が HTTP キャッシュに残っているので、多くの場合ここで追加の通信は発生しない
  e.waitUntil(caches.open("p").then((c) => c.add(PAGE)));
  sw.skipWaiting();
});

sw.addEventListener("activate", (e) => e.waitUntil(sw.clients.claim()));

sw.addEventListener("fetch", (e) => {
  // 画像はファイル名に内容のハッシュが入っていて中身が変わらないので、一度取れたら二度と通信しない
  if (new URL(e.request.url).pathname.includes("/img/")) {
    e.respondWith(
      caches.open("i").then(async (c) =>
        (await c.match(e.request)) ??
        fetch(e.request).then((r) => {
          if (r.ok) c.put(e.request, r.clone());
          return r;
        }),
      ),
    );
    return;
  }
  if (e.request.mode !== "navigate") return;
  e.respondWith(
    caches.open("p").then(async (c) => {
      const hit = await c.match(PAGE);
      const net = fetch(e.request).then((r) => {
        if (r.ok) c.put(PAGE, r.clone());
        return r;
      });
      if (!hit) return net;
      e.waitUntil(net.catch(() => {}));
      return hit;
    }),
  );
});
