import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import { sha256, workerSource } from "./build-offline.mjs";

const shell = '<html><meta name="ghostwriter-shell" content="v4">Ghostwriter</html>';
const files = {
  "/offline.html": { hash: sha256(shell), type: "text/html", precache: true },
  "/assets/app-hash.js": { hash: sha256("app code"), type: "javascript", precache: true },
  "/assets/voice-hash.wasm": { hash: sha256("wasm bytes"), type: "application/wasm", precache: false },
};
function worker(replacement) {
  const listeners = {}, writes = [], fetches = [], deleted = [], entries = new Map();
  const cache = {
    put: async (key, response) => { writes.push(key); entries.set(key, response.clone()); },
    match: async (key) => entries.get(key)?.clone(),
  };
  runInNewContext(workerSource(readFileSync(new URL("./ghostwriter-sw.js", import.meta.url), "utf8"), files), {
    self: { addEventListener: (name, fn) => listeners[name] = fn,
      location: { origin: "https://writer.test" }, clients: { claim: async () => {} } },
    caches: { open: async () => cache, keys: async () => ["ghostwriter-app-old", "transformers-cache", "other-app"],
      delete: async (key) => { deleted.push(key); return true; } },
    fetch: async (...args) => {
      fetches.push(args);
      if (args[0]?.offline) throw new Error("offline");
      if (replacement && args[0] === "/offline.html") return replacement();
      const body = args[0] === "/offline.html" ? shell : args[0]?.endsWith(".wasm") ? "wasm bytes" : "app code";
      return new Response(body, { headers: { "Content-Type": args[0] === "/offline.html" ? "text/html" : args[0]?.endsWith(".wasm") ? "application/wasm" : "application/javascript" } });
    }, URL, Response, Headers, crypto: webcrypto, Uint8Array,
  });
  return { listeners, writes, fetches, deleted, entries };
}
async function lifecycle(w, name) {
  let work;
  w.listeners[name]({ waitUntil: (promise) => work = promise });
  await work;
}
test("authenticated install caches only integrity-verified static files with no credentials in cache keys", async () => {
  const w = worker();
  await lifecycle(w, "install");
  assert.equal(w.fetches[0][0], "/offline.html");
  assert.equal(w.fetches[0][1].credentials, "same-origin");
  assert.equal(w.fetches[0][1].redirect, "error");
  assert.deepEqual(w.writes, ["/offline.html", "/assets/app-hash.js"]);
  await lifecycle(w, "activate");
  assert.deepEqual(w.deleted, ["ghostwriter-app-old"]);
});
test("Access/login HTML, even with a forged app marker, is never cached", async () => {
  for (const body of ['<html>Sign in to Cloudflare Access</html>', shell + '<form>Login</form>']) {
    const w = worker(() => new Response(body, { headers: { "Content-Type": "text/html" } }));
    await assert.rejects(lifecycle(w, "install"), /offline_file_integrity/);
    assert.deepEqual(w.writes, []);
    assert.equal(w.deleted.length, 1);
  }
});
test("redirected, forbidden, wrong MIME and cookie-bearing shells fail installation", async () => {
  for (const response of [new Response(shell, { status: 403 }), new Response(shell, { headers: { "Content-Type": "application/json" } }),
    new Response(shell, { headers: { "Content-Type": "text/html", "Set-Cookie": "secret=not-for-cache" } }),
    Object.defineProperty(new Response(shell, { headers: { "Content-Type": "text/html" } }), "redirected", { value: true })]) {
    const w = worker(() => response);
    await assert.rejects(lifecycle(w, "install"));
    assert.deepEqual(w.writes, []);
  }
});
test("auth, APIs, external data, POST and query-bearing requests are never cached/intercepted", () => {
  const w = worker();
  for (const [url, method, mode] of [["/api/auth/session", "GET", "cors"], ["/api/features", "GET", "cors"],
    ["/api/writing-help", "POST", "cors"], ["/_serverFn/abc", "POST", "cors"], ["/auth/login", "GET", "navigate"],
    ["/?install=1", "GET", "navigate"], ["/assets/app-hash.js?token=secret", "GET", "cors"],
    ["https://outside.test/audio", "GET", "cors"]]) {
    w.listeners.fetch({ request: { url: new URL(url, "https://writer.test").href, method, mode },
      respondWith: () => assert.fail("Unexpected interception: " + url) });
  }
});
test("offline writing room and guide navigation use the deterministic shell", async () => {
  const w = worker(); await lifecycle(w, "install");
  for (const path of ["/", "/start"]) {
    let result;
    w.listeners.fetch({ request: { url: "https://writer.test" + path, method: "GET", mode: "navigate", offline: true },
      respondWith: (promise) => result = promise });
    assert.equal(await (await result).text(), shell);
  }
});
test("worker version includes shell content and static integrity; updates never skip waiting", () => {
  const template = readFileSync(new URL("./ghostwriter-sw.js", import.meta.url), "utf8");
  const a = workerSource(template, files);
  const b = workerSource(template, { ...files, "/offline.html": { ...files["/offline.html"], hash: sha256(shell + "changed") } });
  assert.notEqual(a.match(/ghostwriter-app-[a-f0-9]+/)[0], b.match(/ghostwriter-app-[a-f0-9]+/)[0]);
  assert.doesNotMatch(a, /self\.skipWaiting\s*\(/);
  assert.equal(files["/assets/voice-hash.wasm"].precache, false);
});

test("readiness detects missing cache entries and repairs only verified static files", async () => {
  const w = worker(); await lifecycle(w, "install");
  w.entries.delete("/assets/app-hash.js");
  const status = async (repair) => {
    let result, work;
    w.listeners.message({ data: { type: "OFFLINE_STATUS", repair }, ports: [{ postMessage: (data) => result = data.ready }], waitUntil: (promise) => work = promise });
    await work; return result;
  };
  assert.equal(await status(false), false);
  assert.equal(await status(true), true);
  assert.equal(w.fetches.at(-1)[0], "/assets/app-hash.js");
});
