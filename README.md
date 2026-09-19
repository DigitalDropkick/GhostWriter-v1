# Ghostwriter

A quiet writing room for dictating, editing, reading, and printing books. Built for an author using a Windows laptop, with large controls and private dictation by default.

## Voice privacy

- **Recordings are processed on the computer.** A dedicated browser worker runs a pinned, quantized Whisper Tiny English model using Transformers.js and WebAssembly. No browser `SpeechRecognition` service is used; those services can send audio remotely.
- **First use downloads speech files from Hugging Face.** The inference runtime ships with the app. Downloading model files sends ordinary web-request information to the file host, but no recording or manuscript. Cached model files are reused. Opening the website still needs access to its host; this is not a fully offline installed application.
- **There is no cloud audio fallback.** The old `/api/transcribe` and `/api/tts` endpoints return HTTP 410 without parsing or forwarding the body, even when a provider key is present.
- **Reading uses an installed English voice** marked `localService` by the browser. If none is available, the app gives instructions instead of silently selecting an online voice.
- **Online text editing is optional and off on the server by default.** It requires `GHOSTWRITER_ONLINE_HELP=true`, an existing server-side `XAI_API_KEY`, the app's authentication middleware, and explicit consent for each passage. The consent names xAI and shows its privacy-policy link. Only the new passage and writing preferences are sent, never the recording or existing chapter. The author reviews the returned wording before insertion. No claim is made about an outside provider's retention or training policies.
- Books, drafts, history, and recordings live in this browser's IndexedDB. **Signing in is not a cloud backup.** Browser data is not application-encrypted. Exported backups contain private content and should be kept safely.

The existing web-hosting, Google Fonts, authentication, and Grok platform integration remain. Local voice processing does not make the whole website air-gapped or eliminate the need to trust its hosting and JavaScript. No claim is made about a user's operating system or browser extensions.

Technical references: [Transformers.js model usage](https://huggingface.co/Xenova/whisper-tiny.en), [browser local voice flag](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService), [MediaRecorder final-data ordering](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/stop_event).

## Writing and recovery

1. Start a book or choose one under **Your books**.
2. Choose **Talk → Start private dictation**. First-time setup downloads speech files before asking for microphone access. Speak naturally; text appears after **I’m finished**. Imported recordings use the same local engine.
3. Review the text, then choose **Write this into the book**. Existing chapter text is preserved exactly. Short passages work too.
4. **Keep draft for later** saves unfinished work. The writing room offers to reopen it on the next visit. During recording, periodic audio checkpoints help recover interrupted sessions; the most recent seconds can still be lost if the browser crashes. Keep the page open until recording and saving finish.
5. Use **Page history** to recover earlier pages or read original passages. Up to 20 previous versions per chapter are kept before dictation, editing sessions, or restoration. This is not per-keystroke undo.
6. Choose **Backups → Download backup** after writing. Backups include all books, transcripts, recordings, the unfinished draft, and page history. Restore imports separate copies and never replaces existing books. Keep a copy on a USB drive. **Save a text copy** also exports the current book for other word processors.

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
npm run build
npm run preview
```

The browser suite uses Playwright Chromium, or `/usr/bin/google-chrome` if Playwright's browser is absent. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for another installed Chrome/Edge executable. `--speech` downloads the public JFK sample from the Transformers.js documentation, exercises the real browser worker, repeats inference with networking disabled, and asserts that private writing sends no upload requests. The core suite injects slow/unavailable/full storage and tab conflicts; those are controlled failure tests, not a real hardware-failure demonstration. Screenshots and results go under `screenshots/qa-review/` (ignored by Git).

`npm run build` also runs the existing database migration command. **Do not supply a production `DATABASE_URL` during local validation.** With no database URL, that step skips remote migrations. Auth uses the template's local PGLite fallback.

Generated `.vercel/output` is no longer versioned. Build it from the source and lockfile; do not deploy an old checked-in bundle. All original platform source/assets remain.

## Release and rollback

This branch is a local review candidate. No production deployment or GitHub push is part of this work. See `REVIEW.md` for findings and validation evidence.

Before switching an existing installation, download its books as text, preserve its browser profile, and take an IndexedDB/browser-data backup with Addam's assistance. The old app does not have the new full-library backup button. Keep the same origin and browser profile: the database name, version, stores, and legacy state key are unchanged, and valid old libraries load in place.

After upgrading, make a full Ghostwriter backup before substantial writing. To roll back application code, switch to the original commit `d7a1faa34bed1bcde1bc361ab073d2fd96d650ee`, install its lockfile, and rebuild. Do not clear browser storage. Rolling back restores the original cloud-audio behavior and old save bugs; it is not a privacy-preserving alternative. Export newer drafts/history first because the old UI cannot access them.

Remaining real-device checks: Windows Edge/Chrome microphone permission, microphone quality, recognition accuracy for the author's own voice, installed English reading voices, and print output on his printer. The small local model can mishear names and accents; review remains essential. No grandfather/customer recording is used in automated tests.
