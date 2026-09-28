# v4 validation and remaining acceptance

Validated locally on 2026-09-27 on Windows, Node 24.18.0, npm 11.16.0. Baseline: `e3e451bae6e91db7a5f2c4df8be3ad8c8022c81e`. Branch: `production/cloudflare-v4`. No Cloudflare deployment, account change, DNS change, real provider request or real customer data was used.

## Executed checks

| Command / check | Result |
| --- | --- |
| `npm ci` | Passed with the committed lockfile; 354 packages added, 355 audited; no vulnerabilities reported. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed, no warnings. |
| `npm test` | 73 tests passed, zero failures. Includes existing library/recovery and browser-verdict tests, 7 offline-worker tests, 5 Access tests and 6 online-help tests. |
| `npm run build` | Passed. Official Cloudflare Worker and client build; 24 integrity-listed offline assets. |
| `npm run test:production` | 7 grouped checks passed against the compiled Worker in Miniflare. |
| `node scripts/worker-test-server.mjs` | Built Worker ran on loopback 8081 with temporary in-memory RSA/JWKS and synthetic Access assertions. Test server is separate from the production entry. |
| `node scripts/ghostwriter-browser.mjs http://127.0.0.1:8081 --speech` | 22 grouped checks passed in installed Windows Chrome, including actual local model inference and offline cold reload; no page errors or upload requests. |
| `npm run test:browser` with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` set to installed Microsoft Edge | 18 grouped checks passed; Edge run did not repeat the optional real-model speech suite. |
| `npm run test:recovery` | 7 grouped checks passed. |
| `npm run test:iphone` | 7 grouped checks passed using Chromium touch emulation; no page errors or uploads. |
| `npm run test:polish` | 5 grouped checks passed, including 320px/200% base text, installation cancellation, mocked editor consent/failure/retry, and a waiting app update preserving an active draft. No page errors or CSP violations. |
| `npm run dev`, then local Playwright smoke | Welcome loaded without page errors; zero service-worker registrations in development. |
| `npm run guide:pdf` | Generated one Letter-sized page; rendered with Poppler and visually inspected for clipping, typography and completeness. |
| `npx wrangler deploy --dry-run --config dist/server/wrangler.json --outdir ../wrangler-dry-run` | Passed without deploying. Final server upload: 1,406.49 KiB, 303.99 KiB compressed. Browser-only inference files are excluded from server modules and remain client assets. |
| `npm audit --json --prefer-online --offline=false` | 0 informational, low, moderate, high or critical vulnerabilities. This is a point-in-time dependency advisory check, not a security guarantee. |
| `git -c core.safecrlf=false diff HEAD --check` | Passed. Final staged diff is checked again before release. |
| Manual diff / unused-path / credential review | Reviewed runtime boundaries, persistence changes, UI changes, configuration, build output and removals. Findings below. |

PowerShell test setup for Edge:

```powershell
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
npm run test:browser
Remove-Item Env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
```

The speech test retrieves a public sample from the Transformers.js test fixtures and the pinned model from Hugging Face. It exercises the actual speech worker, WASM, model download/cache, verified installation readiness, offline reload, a new worker using cached speech files, and repeated offline inference under the production CSP. Audio is not sent to an online speech service. Microphone lifecycle testing uses Chromium's synthetic capture device; iPhone interruption, voice and sharing scenarios use controlled browser mocks.

Local evidence is written to ignored `screenshots/qa-review`, `qa-recovery`, `qa-v4`, `qa-polish` and `qa-production`. Evidence contains synthetic writing only. These directories, downloaded samples and ephemeral test keys are not committed.

## Acceptance coverage

- **Access:** missing configuration fails closed, including on a production localhost URL. Missing/invalid signatures, wrong issuer/audience, expiry and missing identity are rejected. Valid signed assertions reach SSR/assets. JWTs, cookies and identity do not appear in rendered pages or client bundles. Nonces are fresh and cannot be supplied by a caller. Headers are checked on pages and assets.
- **Library and recovery:** unfinished drafts survive reload and insert once; short passages append; earlier pages restore; selecting books persists; concurrent tabs protect the newer save; slow/unavailable/full storage remains truthful. Cancelled imports cannot overwrite later typing. Failed restores are atomic, remain exportable and retry without duplicates. Missing audio allows a text-only recovery backup.
- **Recordings and reading:** playable synthetic recording is saved; permission denial provides recovery steps; worker crash retries; long sessions stop; phone interruptions preserve recoverable audio. Installed local-voice selection and reading speed are exercised; remote voices are refused. Legacy audio endpoints reject uploads.
- **Offline:** only integrity-verified, expected-MIME static files enter the app cache. Access HTML, forged markers, redirects, errors and cookie-bearing responses are rejected. Auth/API/POST/external/query requests are not cached. Cold reopening preserves books/drafts. Model cache and manuscript storage survive app-cache cleanup. Updates wait without reloading an active draft.
- **Client presentation:** welcome/onboarding, writing room, talk/type, page history, backups/restore, settings, installation, guide and error states were reviewed. Desktop, 320px, 390px and 430px layouts, extra-large reading text, 200% base text, keyboard focus/Escape and print presentation are covered. One branded manifest and standalone launch are checked.
- **Optional editor:** disabled by default and absent from normal UI. Enabling requires all server settings. Unit tests use a mocked provider to check consent, schema/body limits, per-user/shared limiting, timeout, response validation and safe errors. Browser tests mock the feature/endpoint and verify consent cancellation sends nothing, failures preserve text, retry succeeds and original wording can be restored.

## Security and dependency findings

The baseline contained a hard-coded `PREVIEW_CLIENT_SECRET` in `src/lib/auth/preview.ts`. The entire obsolete preview authentication path is removed. A redacted scan compares that value internally against current source and generated output without printing the value; it is absent. Existing Git history remains intact. Its owner should revoke the obsolete external credential if it still exists; no rotation was performed.

Source and generated files were reviewed for provider/API keys, literal bearer credentials, private keys, OAuth/password/token configuration and unexpected URLs. No additional credential values were found in the reviewed v4 tree/build. Intentional placeholders, synthetic test claims and server-only environment names remain. No real provider key was created, stored or used. Pattern scans cannot establish the status of credentials in external accounts or exhaustively certify old history.

Imports and removed code paths were reviewed before removing 40 unused direct packages. JOSE, the official Cloudflare Vite plugin and Wrangler were added; Miniflare is a development-only test dependency. Its current `5.20260926.0-alpha` version is pinned and exercised locally; it is not bundled into the app. The existing speech model/revision, browser persistence schema, backup format, font assets and relevant licenses remain. Full paths and dependency changes are in [the release manifest](V4-RELEASE-MANIFEST.md).

## Remaining risks and required manual sequence

These are deployment/client-device acceptance items, not locally verified claims:

1. **Before changing origin:** export and verify full backups on every existing writing device. Keep the old origin/profile available. Choose a permanent domain with Addam. Cross-device libraries do not sync; switching accounts in one browser profile does not create separate local libraries.
2. **Configure the private site after approval:** confirm the account/zone, configure a whole-host Access application allowing exactly Addam and the Lexington client, then set issuer/audience and the chosen custom domain. Keep public preview/worker hostnames disabled. See [Cloudflare instructions](CLOUDFLARE.md). No real Access cookies, login redirects, expiration/renewal or real two-account policy have been exercised locally.
3. **Real Windows client:** use the final HTTPS domain in Chrome/Edge, verify sign-in and denied third-account access, import a backup as copies, inspect books/history/audio, type/dictate/reload, export and restore, listen and print. Install from the domain, close every app window and reopen through its icon.
4. **Physical iPhone:** repeat in Safari and the installed Home Screen app. Test actual microphone permission, incoming call/screen lock/backgrounding, safe areas and keyboard, local voice, share-sheet cancellation, low-storage warnings and offline cold start. Chromium emulation is not Safari/WebKit or real-device certification. Speech speed/memory pressure vary by device.
5. **Offline rehearsal:** open the installed icon online, verify app readiness, prepare speech, then turn internet off, close/reopen, dictate a short passage, save and reopen again. Confirm an expired Access session cannot call online APIs and does not cause login HTML to enter the offline cache. A downloaded library remains usable under device security; revoking Access does not revoke offline copies.
6. **Update and recovery rehearsal:** with a synthetic active draft, verify a new version waits. Save/back up/close all windows, reopen and confirm activation. Practice rollback with matching Worker/static assets. No deployed version ID or live rollback target exists yet.
7. **Optional editing later:** keep it off initially. If requested, choose/test an available model on consented samples, securely configure its server key and limiter, review provider privacy/retention and budget controls, and verify the real provider failure path. No real model quality/latency/cost comparison has been made. Native per-location rate limits are not a strict global spend cap.

Local browser data and downloaded backups are not application-encrypted. Browser storage can be evicted, cleared or lost with a device; installation is not a backup. Long or interrupted recordings can lose their most recent unsaved portion. Continue to use explicit save warnings and separate verified backups. No cloud backup, telemetry or data migration was added.
