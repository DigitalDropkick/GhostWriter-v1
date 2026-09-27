# Ghostwriter v4

A quiet, private writing room from Digital Dropkick. Talk or type, keep unfinished drafts, read, listen, print, and back up books. V4 is the first Cloudflare production line (the brief's “CF v1.0”), published separately from the existing v2/v3 history. It keeps the book-like identity and existing local library format.

**This repository is prepared and tested locally. It has not been deployed to Cloudflare.** Choose the permanent domain and configure Access before any deployment. Physical iPhone and client-device acceptance are still required.

**Keep a stable website address. Before changing the domain, export and verify a Ghostwriter backup from every writing device.** Browser libraries belong to an origin and browser profile. A new domain, private window, or different browser opens a different library. Signing in is not a cloud backup. Clearing website data or deleting an installed app can remove books.

## Client experience

- Start a book or reopen the last book. Choose **Talk → Start private dictation**, or **Type instead**. Review the passage and choose **Write this into the book**. Existing chapter text is preserved.
- Wait for **Saved on this device**. If saving fails, keep the page open, download a backup, and follow the warning. **Keep draft for later** preserves unfinished work; **Continue my draft** resumes it.
- **Page history** keeps up to 20 earlier versions per chapter. Recording checkpoints help recover interruptions; the last unsaved seconds can still be lost. Keep the page open while recording and saving. Long microphone sessions finish at about 55 minutes.
- **Backups** (**Keep safe** on a phone) exports books, recordings, drafts, original transcripts, and history. Check for the downloaded file. Restore adds separate copies; existing books are not replaced. A text-only backup preserves the words when recordings cannot be included. Restore files are limited to 250 MB.
- **Install Ghostwriter** explains installation from the domain: Chrome/Edge on Windows; Safari → Share → Add to Home Screen on iPhone. This is an installable web app, not a standalone Windows installer or App Store application.
- Set up the installed icon while online. App readiness and **Prepare offline dictation** are separate. Test a short recording offline before relying on it. Downloads can be evicted by the browser, so keep backups.
- Devices do not sync. Move books with a backup. The same browser profile has one library regardless of which approved Access account signs in.

The [printable guide](public/getting-started.pdf) and [guide component](src/components/getting-started-sheet.tsx) cover everyday operation.

## Privacy and architecture

React/TanStack Start runs through the official Cloudflare Vite plugin and Workers server entry. [Architecture](docs/ARCHITECTURE.md) explains the small server boundary. [Cloudflare setup](docs/CLOUDFLARE.md) covers Access, variables, secrets, deployment, and rollback. [Validation](docs/VALIDATION.md) records acceptance coverage and remaining manual checks. The [release manifest](docs/V4-RELEASE-MANIFEST.md) lists every changed file and direct dependency.

- Books, drafts, history and original audio remain in the existing browser IndexedDB database. Its name, version, stores, state key and backup format are unchanged. No D1, KV, R2, Durable Object, analytics or cloud manuscript service is added.
- A browser worker performs local WASM inference using `Xenova/whisper-tiny.en`, revision `79fb389fc764e7c395bd330e9531d9d32ada7049`. First use downloads speech files from Hugging Face; audio and manuscripts are not included. No cloud speech fallback exists. `/api/transcribe` and `/api/tts` return 410 after Access validation.
- Reading uses an installed English voice reported as local by the browser. Fonts are bundled with their licenses.
- Online writing help is off and hidden by default. If explicitly enabled later, it sends only a consented passage and voice notes to xAI, through the Worker. The model is configurable. A provider key, Access, limits, and per-passage consent are all required. No provider key is needed for local dictation, typing, backups, reading, or printing.
- Local data and exported backup files are not application-encrypted. Access protects online requests; it cannot lock or revoke a downloaded offline library. Protect the Windows/iPhone account and device. The app and its hosting still need to be trusted. A [future encrypted-backup design](docs/FUTURE-ENCRYPTED-BACKUP.md) is documentation only.

## Develop and verify

Use Node 22.12+ (verified with Node 24.18) and npm. No provider credentials are required.

```sh
npm ci
npm run dev
```

Development serves `http://127.0.0.1:8080`. Only Vite development on loopback bypasses Access. Production contains no configurable bypass and fails closed without Access configuration. Development does not register the offline worker. Do not reuse a writing browser profile for development.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:production
```

For browser verification of the built Worker, start this **local-only test server** in another terminal. It generates a temporary RSA key and synthetic Access assertions in memory, serves synthetic JWKS, and binds only to loopback. Nothing is deployed and no real login/provider key is used.

```sh
node scripts/worker-test-server.mjs
```

Then:

```sh
node scripts/ghostwriter-browser.mjs http://127.0.0.1:8081 --speech
npm run test:recovery
npm run test:iphone
node scripts/ghostwriter-polish.mjs http://127.0.0.1:8081
npm audit
git diff --check
```

Tests use Playwright Chromium or installed Chrome. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use Edge or another local Chromium executable. Synthetic microphone/share/voice events test lifecycle behavior; they do not certify real iOS hardware. `--speech` also downloads public JFK sample audio and tests the actual local model, including a new speech worker after offline reload. Browser evidence is under ignored `screenshots/qa-*` directories. Stop the test server before `npm ci` on Windows to release the local runtime executable.

`npm run build` generates the printable HTML, client assets, Worker and integrity-verified static offline shell. It does not run database migrations or deploy. After changing guide wording, build, start the test server, run `node scripts/print-guide.mjs`, visually review the regenerated PDF, then rebuild so the downloadable file enters the offline integrity manifest.

V2/V3 audit documents remain historical records, not current deployment instructions. Use the v4 documentation for this production branch. Never roll back to an older cloud-audio version or remove local browser data as part of an application rollback.
