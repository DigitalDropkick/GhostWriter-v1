const CACHE = "ghostwriter-app-__GHOSTWRITER_VERSION__";
const ASSETS = /* __GHOSTWRITER_ASSETS__ */ [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(ASSETS);
      // Only the anonymous app shell. Never cache auth, API responses, or books.
      const shell = await fetch("/", { credentials: "omit", cache: "reload" });
      if (!shell.ok || !shell.headers.get("content-type")?.includes("text/html"))
        throw new Error("The offline writing room could not be saved.");
      await cache.put("/", shell);
    })(),
  );
  // An update waits until existing windows close: never reload an active draft.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("ghostwriter-app-") && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate" && url.pathname === "/" && !url.search) {
    event.respondWith(
      fetch(request).catch(
        async () => (await (await caches.open(CACHE)).match("/")) ?? Response.error(),
      ),
    );
    return;
  }
  // Hashed static assets only. Speech model caching is owned by Transformers.js.
  if (ASSETS.includes(url.pathname) || /^\/assets\/[^/]+\.wasm$/.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const saved = await cache.match(request);
        if (saved) return saved;
        const response = await fetch(request);
        if (response.ok) {
          try {
            await cache.put(request, response.clone());
          } catch {
            /* Storage may be full. */
          }
        }
        return response;
      })(),
    );
  }
});
