# Ghostwriter v4 architecture

## Small production boundary

`worker.ts` validates every request before serving pages, static assets or APIs. `@cloudflare/vite-plugin` builds the existing TanStack Start application for Workers with `nodejs_compat`. The Worker uses `@tanstack/react-start/server-entry`; there is no Nitro/Vercel runtime or authentication database.

Vite currently emits duplicate browser speech assets into both client and server builds. A narrowly scoped build hook removes only the three unreferenced browser speech copies from the server output; it fails if a server chunk references one. The originals remain static client assets and are covered by the offline integrity manifest. Production tests and Wrangler's deployment dry-run verify this separation, avoiding an unnecessary 21.6 MB inference binary in the Worker upload.

`src/lib/server/access.ts` uses JOSE to verify RS256 signatures against the configured team's HTTPS JWKS endpoint, issuer, application audience, expiration, not-before and required identity claims. JWKS retrieval has a five-second timeout, bounded cache lifetime, and refresh cooldown. Missing/unsafe configuration fails with 503; missing/invalid assertions fail with 401. Only `{ email, sub }` is returned internally. The Worker strips JWT, authorization and cookies before SSR and static asset lookup. No identity is dehydrated into HTML, returned through a user endpoint, or stored in the browser.

Cloudflare Access's allow policy must contain exactly Addam's and the client's email addresses. It is the account authorization boundary. JWT validation is an independent server check; `assets.run_worker_first: true` prevents the assets binding from bypassing it. The public workers.dev and preview URLs are disabled.

## Local library preserved

The existing `ghostwriter` IndexedDB database remains version 1 with `kv` and `audio` stores and the same state/revision records. Existing parsing, serialized saves, stale-tab conflict protection, atomic audio/library restore, checkpoint recording, cancellation generations, history and backup remapping remain. V4 changes error presentation, not persistence semantics. User-facing application errors are distinguished from arbitrary browser/storage exception messages.

This library is per origin and browser profile, not per Access account. No cloud synchronization is implied. Backup format/version are unchanged. The server never receives books, recordings, backup files or history through the local workflows. The installed/offline library remains accessible to anyone who can use that browser profile; Access logout and account revocation do not erase or encrypt it.

## Offline shell and updates

The build emits `offline.html`: an identity-free, deterministic document referencing the normal client bundle. A tiny alternative client bootstrap mounts the same router and components without server hydration data. Normal online navigation still uses TanStack SSR. This avoids caching a personalized navigation response or an Access login page.

`scripts/build-offline.mjs` records SHA-256 and MIME expectations for each static asset and derives the cache version from the complete manifest and worker template. Installation fetches exact paths with same-origin credentials and redirects forbidden; it requires a successful response, expected MIME and exact bytes. The cached response is reconstructed with a small safe header list, so cookies/authorization/redirect headers are not retained. The script is served with `Cache-Control: no-cache`.

Root and `/start` navigation use the network, falling back to the static shell on network failure. Navigation HTML itself is never cached. APIs, Access/auth URLs, server functions, POSTs, external responses and query-bearing URLs are not intercepted. Scripts/styles/fonts/icons/guide files are cached; the 21.6 MB WASM binary is verified/cached on demand. The Transformers model cache stays separate.

There is no `skipWaiting`, forced reload or draft-disrupting activation. A new worker waits for all controlled app windows to close. Activation removes only old `ghostwriter-app-*` caches, never the manuscript database or Transformers cache. Readiness checks required cache entries, can repair missing static files with the same integrity checks, and does not mistake a controller for a complete cache. Speech setup checks the downloaded model files and local inference assets separately. Browser eviction, insufficient space and iOS lifecycle limits remain possible.

Offline access is a deliberate device-level capability, not a fresh Access authorization. Access continues to protect online APIs and newly requested server resources. Do not configure public asset exceptions to make installation easier.

## Headers and CSP

`src/lib/server/security.ts` owns source-controlled headers for Worker responses. Production scripts use self plus a cryptographically random per-response nonce on TanStack bootstrap scripts. An internal request header carries that nonce to router configuration and is always overwritten at the Worker boundary. Static documents contain no inline JavaScript. Script `unsafe-inline` and generic `unsafe-eval` are absent in production; `wasm-unsafe-eval` permits the tested local inference runtime.

Styles require `unsafe-inline` because the existing React presentation, Radix scroll lock and Sonner stylesheet use inline styles. This exception is restricted to styles; external fonts/styles are not allowed. Workers/media allow the local and blob sources needed by inference and recording playback. `connect-src` permits self, `huggingface.co` and the observed model redirect host `us.aws.cdn.hf.co`. No wildcard model CDN is permitted; if a future redirect changes, inspect it and retest rather than widening the policy speculatively.

The app denies framing, sets nosniff and no-referrer, permits only same-origin microphone use, and denies unused camera/geolocation/payment/USB features. HSTS applies only on HTTPS, to this host for one year, without preload or includeSubDomains. HTML and APIs are no-store. Cloudflare Access's own login page is outside the Worker header boundary. A physical deployment must verify edge headers do not conflict.

## Optional text editing

`/api/features` exposes only a boolean. `/api/writing-help` requires validated Access plus every explicit enablement setting. It accepts POST JSON from the same origin, requires literal per-passage consent, rejects unknown fields/audio/chapters and bounds the streamed body to 80 KB, the passage to 16,000 characters and voice notes to 2,000. It forwards only that text and selected writing preferences to the fixed xAI HTTPS endpoint. Output is bounded, structurally validated, rejected if truncated, and reviewed by the author before insertion. Original wording is retained.

The native rate limiter applies separate user-subject and shared keys. Its per-location, eventually consistent behavior is abuse protection, **not a strict global monetary ceiling**. Configure a provider account spending limit as well. No global database/counter service was added for this two-person app. Upstream calls time out after 30 seconds; the browser after 35. Errors never include provider bodies, keys or submitted text.

Grok remains the existing optional editor. There is no unsupported claim that another provider improves this author's voice. Compare real, consented sample passages for preservation of facts/voice, unwanted invention, latency and total cost before choosing a different adapter. No provider key was created or used during v4 development; no live model edit was sent.

## Logging and removed baggage

Operational warnings contain a generated request ID, fixed error class/status and duration only. They exclude paths/query strings as well as identity, cookies, JWTs, provider authorization, books and recordings. Worker observability is disabled by default. Cloudflare Access/platform request metadata is governed separately by the account; avoid body/header capture or manuscript analytics in future configuration.

Removed runtime paths: Grok/Better Auth/provider/preview OAuth, auth migrations, pg/PGLite, multiplayer/P2P, preview host bridge, platform install/OG injection and Nitro/Vercel packaging. IndexedDB, font licenses, private speech and relevant regression tests remain. The removed hard-coded `PREVIEW_CLIENT_SECRET` is not reproduced in v4; old Git history is intentionally preserved, so its owner should revoke the old preview credential separately if it still exists.

References checked for this implementation: [Cloudflare TanStack Start](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/), [TanStack hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [server entry](https://tanstack.com/start/latest/docs/framework/react/guide/server-entry-point), [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [native rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
