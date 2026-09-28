import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";

export async function workerTestServer(port = 8081) {
  const issuer = "https://ghostwriter-test.cloudflareaccess.com";
  const audience = "ghostwriter-local-test";
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const publicJwk = { ...(await exportJWK(publicKey)), kid: "local-test" };
  const sign = (claims = {}) =>
    new SignJWT({
      sub: "synthetic-user",
      email: "writer@example.test",
      iss: issuer,
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 7200,
      iat: Math.floor(Date.now() / 1000),
      ...claims,
    })
      .setProtectedHeader({ alg: "RS256", kid: "local-test" })
      .sign(privateKey);
  const token = await sign();
  const options = {
    name: "ghostwriter",
    modules: [
      { type: "ESModule", path: resolve("dist/server/index.js") },
      ...(await readdir("dist/server/assets"))
        .filter((name) => name.endsWith(".js") || name.endsWith(".mjs"))
        .map((name) => ({ type: "ESModule", path: resolve("dist/server/assets", name) })),
    ],
    modulesRoot: resolve("dist/server"),
    compatibilityDate: "2026-09-27",
    compatibilityFlags: ["nodejs_compat"],
    bindings: {
      ACCESS_TEAM_DOMAIN: issuer,
      ACCESS_AUD: audience,
      GHOSTWRITER_ONLINE_HELP: "false",
    },
    assets: {
      directory: resolve("dist/client"),
      binding: "ASSETS",
      run_worker_first: true,
      routerConfig: { has_user_worker: true },
      assetConfig: { html_handling: "none", not_found_handling: "none" },
    },
    outboundService: async (request) => {
      if (request.url === issuer + "/cdn-cgi/access/certs")
        return Response.json({ keys: [publicJwk] });
      throw new Error("Unexpected outbound request in production test");
    },
  };
  const mf = new Miniflare(convertV4MiniflareOptions(options));
  await mf.ready;
  const server = createServer(async (req, res) => {
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (value) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
      }
      headers.set("cf-access-jwt-assertion", token);
      // A test-only proxy simulates Access adding its assertion. No key is written to disk.
      const response = await mf.dispatchFetch(`http://127.0.0.1:${port}${req.url}`, {
        method: req.method,
        headers,
        body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
        duplex: "half",
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(500);
      res.end("Local test request failed");
    }
  });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  return {
    mf,
    options,
    sign,
    token,
    base: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      await mf.dispose();
    },
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const local = await workerTestServer();
  console.log("Authenticated local Worker test server ready on http://127.0.0.1:8081");
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => void local.close().then(() => process.exit(0)));
}
