# Ghostwriter v3

A quiet writing room for dictating, editing, reading, and printing books. V3 brings an iPhone Home Screen edition alongside the Windows writing room, with large controls, private dictation, offline reopening, and a book-inspired visual identity. See [V3-IPHONE.md](V3-IPHONE.md) for installation, test evidence, and the native iOS release path. This is an **iPhone test release**: automated checks passed on a private HTTPS preview, while physical iPhone acceptance remains pending. It is not a signed native iOS or App Store release.

## Voice privacy

- **Recordings are processed on the device.** A dedicated browser worker runs a pinned, quantized Whisper Tiny English model using Transformers.js and WebAssembly. No browser `SpeechRecognition` service is used; those services can send audio remotely.
- **First use downloads speech files from Hugging Face.** The inference runtime ships with the app. Downloading model files sends ordinary web-request information to the file host, but no recording or manuscript. Cached model files are reused. The production app caches its writing room for offline reopening after a successful online visit. Speech needs its own first download; cached files can still be evicted by the browser. Development mode does not install an offline cache.
- **There is no cloud audio fallback.** The old `/api/transcribe` and `/api/tts` endpoints return HTTP 410 without parsing or forwarding the body, even when a provider key is present.
- **Reading uses an installed English voice** marked `localService` by the browser. If none is available, the app gives instructions instead of silently selecting an online voice.
- **Online text editing is optional and off on the server by default.** It requires `GHOSTWRITER_ONLINE_HELP=true`, an existing server-side `XAI_API_KEY`, the app's authentication middleware, and explicit consent for each passage. The consent names xAI and shows its privacy-policy link. Only the new passage and writing preferences are sent, never the recording or existing chapter. The author reviews the returned wording before insertion. No claim is made about an outside provider's retention or training policies.
- Books, drafts, history, and recordings live in this browser's IndexedDB. **Signing in is not a cloud backup.** Browser data is not application-encrypted. Exported backups contain private content and should be kept safely.

The existing web-hosting, authentication, and Grok platform integration remain. Local voice processing does not make the whole website air-gapped or eliminate the need to trust its hosting and JavaScript. Fonts are now bundled locally, including their SIL Open Font Licenses, for consistent offline reading. No claim is made about a user's operating system or browser extensions.

Technical references: [Transformers.js model usage](https://huggingface.co/Xenova/whisper-tiny.en), [browser local voice flag](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService), [MediaRecorder final-data ordering](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/stop_event).

## Writing and recovery

1. Start a book or choose one under **Your books**.
2. Choose **Talk → Start private dictation**. First-time setup downloads speech files before asking for microphone access. Speak naturally; text appears after **I’m finished**. Imported recordings use the same local engine.
3. Review the text, then choose **Write this into the book**. Existing chapter text is preserved exactly. Short passages work too.
4. **Keep draft for later** saves unfinished work. The writing room offers to reopen it on the next visit. During recording, periodic audio checkpoints help recover interrupted sessions; the most recent seconds can still be lost if the browser crashes. Keep the page open until recording and saving finish.
5. Use **Page history** to recover earlier pages or read original passages. Up to 20 previous versions per chapter are kept before dictation, editing sessions, or restoration. This is not per-keystroke undo.
6. Choose **Backups → Download backup** after writing (on a phone, **Keep safe** opens backups). Backups include all books, transcripts, recordings, the unfinished draft, and page history. Restore imports separate copies and never replaces existing books. Keep a copy in Files, on another device, or on a USB drive. **Prepare backup for Files → Save or share backup** opens the supported device share sheet on the second tap. Cancelling it does not trigger a download. **Save a text copy** also exports the current book for other word processors.

If a recording is missing or the full backup is too large, use **Backups → Back up words without recordings → Save text-only backup**. This preserves every book, original transcript, draft, and page-history entry in a restorable file, with audio explicitly left out. A failed restore keeps its incoming recordings in memory for backup and retry; wait for **Saved on this device** before closing the page.

Long microphone sessions stop and save at about 55 minutes, before the transcription engine's one-hour limit. Short passages are easier to review and faster to process.

Use the same website address, browser, and browser profile each time. Private/InPrivate windows and clearing browser data can remove local work. A changed domain or browser has a different library; transfer it with a backup. For very large libraries, ask Addam for help before clearing anything (browser restore is limited to 250 MB).

## Development

Node 22.12+ or Node 24 and npm are required. This is an existing TanStack Start / React / Vite application. No provider key is needed for private dictation, typing, local playback, backups, or printing.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4317
```

Visit `http://127.0.0.1:4317`. Microphones require localhost or HTTPS. The default dev command retains the original port 8080 convention; choose an unused port rather than stopping another service. `startup.sh` now resolves its own directory instead of assuming `/workspace`.

```sh
npm run typecheck
npm run lint
npm test
npm run test:browser -- http://127.0.0.1:4317
npm run test:browser -- http://127.0.0.1:4317 --speech
npm run test:recovery -- http://127.0.0.1:4317
npm run build
npm run preview
npm run test:iphone -- http://127.0.0.1:8081
```

The browser suites use Playwright Chromium, or `/usr/bin/google-chrome` if Playwright's browser is absent. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for another installed Chrome/Edge executable. `--speech` downloads the public JFK sample from the Transformers.js documentation, exercises the real browser worker, repeats inference with networking disabled, and asserts that private writing sends no upload requests. The core suite injects slow/unavailable/full storage and tab conflicts. The recovery suite covers cancellation, atomic restore and retry, text-only backups, title history, worker failure, recording duration, exports, printing, and local-voice chunking. These use synthetic content and controlled failures, not real hardware-failure demonstrations. Evidence goes under `screenshots/qa-review/` and `screenshots/qa-recovery/` (ignored by Git).

`npm run build` also runs the existing database migration command. **Do not supply a production `DATABASE_URL` during local validation.** With no database URL, that step skips remote migrations. Auth uses the template's local PGLite fallback.

Generated `.vercel/output` is no longer versioned. Build it from the source and lockfile; do not deploy an old checked-in bundle. Original platform integration remains; head injection now respects a custom manifest and touch icon instead of adding duplicate platform links.

## Release and rollback

V3 is published on **`main`** and preserved under tag **[`v3`](https://github.com/DigitalDropkick/GhostWriter-v1/releases/tag/v3)** as an iPhone test release. The repository retains its original `GhostWriter-v1` name. The recovered privacy/recovery work remains preserved under tag **`v2`**, commit `002002b8be8922b4baa35d141dc4fbb630d034a0`; the later tested v2 checkpoint is `33bb753`. **`V2-AUDIT.md`** describes those follow-up fixes, and `REVIEW.md` records the earlier review. GitHub publication and the private test preview do not establish public production readiness. Physical Windows and iPhone checks remain required.

Before switching an existing installation, download its books as text, preserve its browser profile, and take an IndexedDB/browser-data backup with Addam's assistance. The old app does not have the new full-library backup button. Keep the same origin and browser profile: the database name, version, stores, and legacy state key are unchanged, and valid old libraries load in place.

After upgrading, make a full Ghostwriter backup before substantial writing. To inspect the last tested v2 checkpoint without moving `main` or disturbing v3, use `git worktree add ../GhostWriter-v2-review 33bb753`, then install its lockfile and build in that separate checkout. Preserve browser storage and back up first. The earlier `v2` tag predates the recovery fixes in `V2-AUDIT.md`; the much older original commit `d7a1faa34bed1bcde1bc361ab073d2fd96d650ee` also restores cloud-audio behavior and the original save bugs. For an installed v3 app, follow the service-worker rollback guidance in `V3-IPHONE.md` before changing deployed source.

Remaining real-device checks: Windows Edge/Chrome microphone permission, microphone quality, recognition accuracy for the author's own voice, installed English reading voices, and print output on his printer. The small local model can mishear names and accents; review remains essential. No grandfather/customer recording is used in automated tests.
