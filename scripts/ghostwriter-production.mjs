import assert from "node:assert/strict";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { convertV4MiniflareOptions } from "miniflare";
import { workerTestServer } from "./worker-test-server.mjs";

const local = await workerTestServer(8082);
const checks = [];
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const fetchWorker = (path, token, extra = {}) =>
  local.mf.dispatchFetch("https://writer.example.test" + path, {
    ...extra,
    headers: { ...(token ? { "cf-access-jwt-assertion": token } : {}), ...extra.headers },
  });
try {
  const speechAsset = /^(?:transcribe\.worker-|ort-wasm-simd-threaded\.jsep-)/;
  assert.equal(
    (await readdir("dist/client/assets")).filter((name) => speechAsset.test(name)).length,
    3,
  );
  assert.equal(
    (await readdir("dist/server/assets")).filter((name) => speechAsset.test(name)).length,
    0,
  );
  pass("speech worker and inference assets remain client-only, outside the server upload");
  for (const path of [
    "/",
    "/start",
    "/offline.html",
    "/ghostwriter-sw.js",
    "/ghostwriter.webmanifest",
    "/api/features",
    "/api/writing-help",
  ]) {
    assert.equal((await fetchWorker(path)).status, 401, path);
    assert.equal((await fetchWorker(path, "invalid")).status, 401, path);
  }
  pass("production denies missing/invalid assertions for pages, every asset and API");
  for (const claims of [
    { aud: "wrong" },
    { iss: "https://other.cloudflareaccess.com" },
    { exp: 1 },
    { email: undefined },
  ]) {
    assert.equal((await fetchWorker("/", await local.sign(claims))).status, 401);
  }
  pass("real Worker JWT verification rejects wrong audience/issuer, expiry and missing identity");
  const response = await fetchWorker("/", local.token, {
    headers: {
      cookie: "private-cookie",
      authorization: "private-auth",
      "x-ghostwriter-nonce": "attacker",
    },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const value of [
    local.token,
    "private-cookie",
    "private-auth",
    "writer@example.test",
    "synthetic-user",
  ])
    assert.ok(!html.includes(value));
  const csp = response.headers.get("content-security-policy");
  const nonce = csp.match(/'nonce-([^']+)'/)[1];
  assert.notEqual(nonce, "attacker");
  assert.ok(html.includes('nonce="' + nonce + '"') || html.includes("nonce='" + nonce + "'"));
  assert.ok(
    !(await fetchWorker("/", local.token)).headers.get("content-security-policy").includes(nonce),
  );
  assert.doesNotMatch(
    csp.split(";").find((part) => part.includes("script-src")),
    /'unsafe-inline'|'unsafe-eval'/,
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("set-cookie"), null);
  for (const name of [
    "referrer-policy",
    "permissions-policy",
    "x-content-type-options",
    "x-frame-options",
    "strict-transport-security",
  ])
    assert.ok(response.headers.get(name));
  pass("authenticated SSR strips identity/credentials and uses a fresh, non-spoofable CSP nonce");
  const features = await fetchWorker("/api/features", local.token);
  assert.deepEqual(await features.json(), { onlineWritingHelp: false });
  assert.equal(
    (await fetchWorker("/api/writing-help", local.token, { method: "POST" })).status,
    503,
  );
  for (const path of ["/api/transcribe", "/api/tts"])
    assert.equal(
      (await fetchWorker(path, local.token, { method: "POST", body: "synthetic" })).status,
      410,
    );
  for (const path of ["/_serverFn/test", "/api/auth/session", "/auth/login"])
    assert.equal((await fetchWorker(path, local.token)).status, 404);
  pass(
    "optional provider disabled, legacy audio uploads and auth/server-function routes unavailable",
  );
  const assets = (await readdir("dist/client/assets")).filter((file) => /\.(js|css)$/.test(file));
  for (const path of [
    "/offline.html",
    "/ghostwriter-sw.js",
    ...assets.map((name) => "/assets/" + name),
  ]) {
    const asset = await fetchWorker(path, local.token);
    assert.equal(asset.status, 200, path);
    const body = await asset.text();
    for (const value of [
      local.token,
      "api.x.ai/v1/chat",
      "PREVIEW_CLIENT_SECRET",
      "Cf-Access-Jwt-Assertion",
    ])
      assert.ok(!body.includes(value), path);
    assert.ok(asset.headers.get("content-security-policy"));
  }
  pass(
    "static shell, scripts and styles serve with security headers and no server credentials/provider code",
  );
  const source = await readFile("dist/server/index.js", "utf8");
  assert.ok(!source.includes('["localhost", "127.0.0.1", "[::1]"]'));
  await local.mf.setOptions(convertV4MiniflareOptions({ ...local.options, bindings: {} }));
  for (const path of ["/", "/offline.html", "/api/writing-help"]) {
    const denied = await fetchWorker(path, local.token, { headers: { accept: "text/html" } });
    assert.equal(denied.status, 503);
    assert.doesNotMatch(await denied.text(), /jwt|jwks|token|stack trace/i);
  }
  pass(
    "missing production configuration fails closed, including localhost; human-readable page has no internals",
  );
} finally {
  await local.close();
  await mkdir("screenshots/qa-production", { recursive: true });
  await writeFile("screenshots/qa-production/results.json", JSON.stringify({ checks }, null, 2));
}
