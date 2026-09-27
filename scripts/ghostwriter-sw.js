const CACHE = "ghostwriter-app-__GHOSTWRITER_VERSION__";
const FILES = /* __GHOSTWRITER_FILES__ */ {};
const SHELL = "/offline.html";

async function verifiedResponse(path) {
  const response = await fetch(path, { credentials: "same-origin", cache: "reload", redirect: "error" });
  if (!response.ok || response.redirected || response.type === "opaque" ||
      response.headers.get("set-cookie")) throw new Error("offline_file_unavailable");
  const type = response.headers.get("content-type") ?? "";
  const expected = FILES[path];
  if (!expected || !new RegExp(expected.type).test(type)) throw new Error("offline_file_type");
  const bytes = await response.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  if (hash !== expected.hash) throw new Error("offline_file_integrity");
  // Reconstruct from safe headers only. Access can append headers outside the Worker;
  // browser-filtered Set-Cookie headers must never be copied into an offline response.
  const headers = new Headers();
  for (const name of ["content-type", "content-security-policy", "x-content-type-options",
    "referrer-policy", "permissions-policy", "x-frame-options", "cross-origin-resource-policy"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(bytes, { status: 200, headers });
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Verify the shell first. No current navigation document is ever stored.
      await cache.put(SHELL, await verifiedResponse(SHELL));
      // Sequential download avoids a large spike in memory on iPhones.
      for (const [path, file] of Object.entries(FILES)) {
        if (path !== SHELL && file.precache) await cache.put(path, await verifiedResponse(path));
      }
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
  // No skipWaiting: existing writing/recording sessions keep their current code.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys())
      if (key.startsWith("ghostwriter-app-") && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "OFFLINE_STATUS") return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const required = Object.entries(FILES).filter(([path, file]) => path === SHELL || file.precache);
    if (event.data.repair === true) {
      for (const [path] of required) {
        if (!await cache.match(path)) {
          try { await cache.put(path, await verifiedResponse(path)); } catch { /* Report incomplete below. */ }
        }
      }
    }
    const ready = (await Promise.all(required.map(([path]) => cache.match(path)))).every(Boolean);
    event.ports[0]?.postMessage({ ready });
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Exact navigation routes only; no login, API, query or credential response is cached.
  if (request.mode === "navigate" && ["/", "/start"].includes(url.pathname) && !url.search) {
    event.respondWith(fetch(request).catch(async () =>
      (await (await caches.open(CACHE)).match(SHELL)) ?? Response.error()));
    return;
  }
  if (!url.search && Object.hasOwn(FILES, url.pathname) && url.pathname !== SHELL) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(url.pathname);
      if (saved) return saved;
      const response = await verifiedResponse(url.pathname);
      try { await cache.put(url.pathname, response.clone()); } catch { /* Storage may be full. */ }
      return response;
    })());
  }
});
