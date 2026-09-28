import assert from "node:assert/strict";
import test from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { validateAccess, AccessError } from "../src/lib/server/access";
import { secureResponse } from "../src/lib/server/security";

const config = {
  ACCESS_TEAM_DOMAIN: "https://test-team.cloudflareaccess.com",
  ACCESS_AUD: "application-audience",
};
const { privateKey, publicKey } = await generateKeyPair("RS256");
const keys = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), kid: "test" }] });
const token = (overrides: Record<string, unknown> = {}) =>
  new SignJWT({
    iss: config.ACCESS_TEAM_DOMAIN,
    aud: config.ACCESS_AUD,
    sub: "person-1",
    email: "writer@example.test",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600,
    ...overrides,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .sign(privateKey);
const request = (jwt?: string) =>
  new Request("https://writer.example.test/", {
    headers: jwt ? { "Cf-Access-Jwt-Assertion": jwt, cookie: "sensitive-cookie" } : {},
  });

test("missing/unsafe Access configuration fails closed", async () => {
  for (const settings of [
    {},
    { ACCESS_AUD: "x" },
    { ...config, ACCESS_AUD: "" },
    { ...config, ACCESS_TEAM_DOMAIN: "https://attacker.example/" },
    { ...config, ACCESS_TEAM_DOMAIN: "https://test-team.cloudflareaccess.com@attacker.test" },
  ]) {
    await assert.rejects(
      validateAccess(request(await token()), settings, keys),
      (e) => e instanceof AccessError && e.status === 503,
    );
  }
});
test("missing, malformed and forged signatures are rejected", async () => {
  for (const jwt of [
    undefined,
    "not-a-jwt",
    (await token()).slice(0, -20) + "aaaaaaaaaaaaaaaaaaaa",
  ]) {
    await assert.rejects(validateAccess(request(jwt), config, keys), AccessError);
  }
});
test("wrong audience, issuer, expired, premature and missing expiration claims are rejected", async () => {
  for (const claims of [
    { aud: "other" },
    { iss: "https://other.cloudflareaccess.com" },
    { exp: 1 },
    { exp: undefined },
    { nbf: Math.floor(Date.now() / 1000) + 600 },
    { email: undefined },
  ]) {
    await assert.rejects(validateAccess(request(await token(claims)), config, keys), AccessError);
  }
});
test("authenticated identity contains email/sub only, never JWT or cookies", async () => {
  const jwt = await token({ name: "not needed", extra: "not needed" });
  const identity = await validateAccess(request(jwt), config, keys);
  assert.deepEqual(identity, { email: "writer@example.test", sub: "person-1" });
  assert.ok(!JSON.stringify(identity).includes(jwt));
});
test("security headers permit only hashed bootstrap scripts, local workers and explicit model downloads", async () => {
  const html = "<!doctype html><script>window.boot=true</script>";
  const response = await secureResponse(
    new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Set-Cookie": "test=secret",
      },
    }),
    request(),
  );
  const csp = response.headers.get("content-security-policy")!;
  assert.match(csp, /script-src 'self' 'wasm-unsafe-eval' 'sha256-/);
  assert.doesNotMatch(
    csp.split(";").find((p) => p.trim().startsWith("script-src"))!,
    /'unsafe-inline'|'unsafe-eval'/,
  );
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /worker-src 'self' blob:/);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000");
  assert.equal(await response.text(), html);
});
