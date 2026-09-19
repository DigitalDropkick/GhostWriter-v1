import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ghostwriterOfflinePlugin } from "./ghostwriter-offline-plugin.mjs";

function worker() {
  const listeners = {},
    writes = [],
    fetches = [],
    deleted = [];
  const cache = {
    addAll: async (assets) => writes.push(...assets),
    put: async (key) => writes.push(key),
    match: async (key) => (key === "/" ? new Response("anonymous offline shell") : undefined),
  };
  runInNewContext(
    readFileSync(new URL("./ghostwriter-sw.js", import.meta.url), "utf8").replace(
      "/* __GHOSTWRITER_ASSETS__ */ []",
      '["/assets/app-hash.js"]',
    ),
    {
      self: {
        addEventListener: (name, fn) => (listeners[name] = fn),
        location: { origin: "https://writer.test" },
        clients: { claim: async () => {} },
      },
      caches: {
        open: async () => cache,
        keys: async () => ["ghostwriter-app-old", "transformers-cache", "other-app"],
        delete: async (key) => deleted.push(key),
      },
      fetch: async (...args) => {
        fetches.push(args);
        if (args[0]?.offline) throw new Error("offline");
        return new Response("anonymous shell", { headers: { "content-type": "text/html" } });
      },
      URL,
      Response,
    },
  );
  return { listeners, writes, fetches, deleted };
}
test("offline install caches an anonymous shell and activation preserves model and unrelated caches", async () => {
  const w = worker();
  let work;
  await w.listeners.install({
    waitUntil: (p) => {
      work = p;
    },
  });
  await work;
  assert.equal(w.fetches[0][0], "/");
  assert.equal(w.fetches[0][1].credentials, "omit");
  assert.equal(w.fetches[0][1].cache, "reload");
  assert.ok(w.writes.includes("/"));
  w.listeners.activate({
    waitUntil: (p) => {
      work = p;
    },
  });
  await work;
  assert.deepEqual(w.deleted, ["ghostwriter-app-old"]);
});
test("offline fetch handler never intercepts auth, APIs, external data, POST or install tutorial", () => {
  const w = worker();
  for (const [url, method, mode] of [
    ["/api/auth/session", "GET", "cors"],
    ["/_serverFn/abc", "POST", "cors"],
    ["/auth/login", "GET", "navigate"],
    ["/?install=1", "GET", "navigate"],
    ["https://outside.test/audio", "GET", "cors"],
  ]) {
    w.listeners.fetch({
      request: { url: new URL(url, "https://writer.test").href, method, mode },
      respondWith: () => assert.fail(`intercepted ${url}`),
    });
  }
});
test("offline root navigation falls back to the saved shell", async () => {
  const w = worker();
  let result;
  w.listeners.fetch({
    request: { url: "https://writer.test/", method: "GET", mode: "navigate", offline: true },
    respondWith: (p) => {
      result = p;
    },
  });
  assert.equal(await (await result).text(), "anonymous offline shell");
});
test("offline build plugin versions the shell with hashed assets and leaves WASM download on demand", () => {
  const plugin = ghostwriterOfflinePlugin();
  let output;
  assert.equal(plugin.applyToEnvironment({ name: "ssr" }), false);
  plugin.generateBundle.call(
    {
      emitFile: (file) => {
        output = file;
      },
    },
    {},
    { "assets/app-1.js": {}, "assets/site.css": {}, "assets/voice.wasm": {} },
  );
  assert.equal(output.fileName, "ghostwriter-sw.js");
  assert.match(output.source, /ghostwriter-app-[a-f0-9]{16}/);
  assert.match(output.source, /"\/assets\/app-1.js"/);
  assert.doesNotMatch(output.source, /"\/assets\/voice.wasm"/);
});
