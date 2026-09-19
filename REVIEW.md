# Ghostwriter review — September 18, 2026

Historical review of the work later published as tag `v2`. The publication state and follow-up fixes are documented in [V2-AUDIT.md](V2-AUDIT.md); statements below describe the original local review.

Local review branch: `improve/writing-room-reliability`.
Original commit: `d7a1faa34bed1bcde1bc361ab073d2fd96d650ee`.
The checkout was clean before work. Nothing has been pushed or deployed.

## What was wrong and what changed

| Finding | Result in this branch | Main files |
| --- | --- | --- |
| A slow or failed initial storage read could trigger the sample-library fallback and overwrite saved work. Save failures were not reliably visible. | Wait for the actual library, block editing on load failure, serialize writes, show persistent failure warnings, and reject stale saves from another tab. Preserve the existing IndexedDB name, version, stores, and state key. | `src/lib/storage.ts`, `src/lib/book-store.tsx`, `src/lib/state-schema.ts` |
| Voice privacy claims did not match the implementation: recordings could go to xAI or the browser's remote speech-recognition service. | Run pinned Whisper Tiny English locally in a worker. Disable both legacy cloud-audio routes with HTTP 410. Never fall back to a remote recognizer. | `src/components/talk-flow.tsx`, `src/workers/transcribe.worker.ts`, `src/lib/local-speech.ts`, `src/routes/api/` |
| Dictation asked AI to rewrite the full chapter, clipped the new transcript to 16,000 characters, and accepted potentially incomplete output. | Append reviewed text exactly. Optional online editing handles only the new passage, requires per-send consent and authentication, defaults off on the server, validates input, and rejects incomplete output. Existing pages never enter this request. | `src/lib/ai.ts`, `src/lib/book-store.tsx`, `src/components/talk-flow.tsx` |
| Recording completion relied on an arbitrary delay; interrupted work and microphone errors were difficult to recover from. | Wait for the final recorder data/stop events, show permission errors and an input meter, save periodic audio checkpoints, retain drafts and original transcripts, and offer recording downloads. | `src/components/talk-flow.tsx` |
| Books were difficult to find again; there was no complete portable backup or page recovery. | Add a book selector, full-library backup/restore, restored copies with new IDs, and up to 20 earlier page versions per chapter. | `src/components/library-tools.tsx`, `src/lib/backup.ts`, `src/components/ghostwriter-app.tsx` |
| Read-aloud could send manuscript text to xAI or truncate it. | Use installed English voices reported as local by the browser, split long prose without dropping words, offer speed control, and explain when no suitable voice is installed. | `src/components/listen-bar.tsx`, `src/lib/local-speech.ts` |
| Dialog focus, low-contrast text, narrow layouts, and guide privacy claims needed attention. | Add keyboard-trapped dialogs, improve contrast and responsive ordering, label fields, and update the one-page printable guide. | `src/components/ui/modal.tsx`, writing/onboarding components, `src/styles.css`, `public/getting-started.*` |
| A successful build still crashed when served because PGLite runtime data was missing. Scripts assumed `/workspace`. | Trace the complete PGLite dependency into the server build and resolve script paths from the checkout. | `vite.config.ts`, `startup.sh`, browser/print scripts |

The original visual style, branding assets, contact information, authentication integration, and platform/PWA source remain. Existing dependency versions were not upgraded; the lockfile adds the pinned speech library and test helpers. Old generated `.vercel/output` files are removed from Git tracking and ignored; they must be regenerated from source for deployment.

## Validation

- `npm run typecheck`: passed.
- `npm run lint`: passed with one existing unused-disable warning in `src/lib/auth/use-current-user.ts`.
- `npm test`: passed all 106 tests across four test files, including 11 focused storage, legacy-library, backup, and long-text speech tests.
- `npm run build`: passed. No `DATABASE_URL` was supplied; remote migrations were skipped. The served build returns HTTP 200 after the PGLite packaging fix.
- Production core browser suite: passed 18 checkpoints, including real MediaRecorder capture using Chrome's synthetic microphone, downloaded recording bytes, denied permission, and refusal to use a remote reading voice. Inference is stubbed only in the recorder-specific test.
- Real-model browser checks: the built worker transcribed the public JFK speech fixture and repeated transcription with browser networking disabled. No author's recording was used. This verifies local inference, not recognition accuracy for the author's voice.
- Final production `--speech` run: all 20 checkpoints passed together, with zero observed browser upload/POST requests and zero page runtime errors. The separate WASM compilation fallback warning below remains.
- Browser scenarios also cover onboarding, exact append of short passages, draft recovery after reload, history restoration, separate-copy backup import, optional-help cancellation, keyboard focus, printing, and layouts at 1440, 390, and 320 pixels. Injected slow/unavailable/full storage and concurrent-tab conflicts behave safely.
- Production smoke at desktop and mobile: HTTP 200, no overflow, no console/page errors on the initial page, and no divergence from the development baseline. Screenshots were visually inspected.
- The updated PDF was generated and checked as one page. `git diff --check` passed.

Reproducible commands are in `README.md`; local screenshots and JSON results are under ignored `screenshots/qa-review/`.

## Grok date, costs, and capability evidence

This section addresses **Ghostwriter only**, pending clarification of whether the question instead concerns the agent fleet.

The full available Git history contains two commits. Its first commit, `8d8627959fe8a6de05c7f0533d4119cd441161f2`, is **August 20, 2026 at 13:35:18 UTC / 9:35:18 AM EDT**, titled “Export from Grok.” It already calls `grok-4.5`, `/v1/stt`, and `/v1/tts`. The next commit adds the printed guide. There is no earlier provider or model transition in this history. This is an export date, **not a proven switch or deployment date**.

No invoices, usage exports, deployment history, or before/after evaluation results are present in the inspected project. The old request handlers discard usage accounting. Actual spend, historical rates applied to requests, and quality changes since a switch cannot be reconstructed from this repository.

Current public list prices checked September 18, 2026:

| Original feature | Published unit price | Illustrative calculation, not actual billing |
| --- | --- | --- |
| Grok 4.5 text, below the long-context threshold | $2 / million input tokens; $0.30 / million cached input tokens; $6 / million output tokens | 2,000 uncached input + 1,000 billable output tokens = $0.01 |
| REST speech-to-text | $0.10 / hour | One hour of uploaded audio = $0.10 |
| Text-to-speech | $15 / million characters | 10,000 characters = $0.15 |

Sources: [xAI pricing](https://docs.x.ai/developers/pricing), [Grok 4.5 model details](https://docs.x.ai/developers/models/grok-4.5), [voice API overview](https://docs.x.ai/developers/model-capabilities/audio/voice). Rates are current reference prices, not evidence of August invoices; reasoning, caching, retries, request sizes, and credits affect actual charges. Long prompts have higher rates.

This branch does not change the optional editing model from Grok 4.5. Local dictation and installed-voice reading make no metered AI API calls; optional online text edits still do if enabled and authorized. Hosting, downloads, hardware, and electricity are separate costs. No paid model calls were made during this review.

The demonstrated gains are privacy controls, manuscript preservation, recovery, and usability. There is no measured before/after “intelligence” score. The small local speech model is a different transcription engine and may make different recognition errors. Compare both engines on authorized, representative recordings with a corrected reference transcript before claiming better accuracy; compare optional editing for factual fidelity and preservation of the author's style.

## Limits and release handoff

- This is a browser app, not a packaged offline Windows application. First dictation downloads model files; cached local inference works without a connection, but opening the hosted app still needs its host. Ordinary hosting, fonts, authentication, and platform requests remain.
- Books and recordings are local browser data, not cloud-backed or application-encrypted. Make backups, use the same browser/profile/origin, and do not clear browser data before exporting. Backup import currently accepts files up to 250 MB. Recordings are limited to 100 MB and one hour; short passages are preferable on a laptop.
- Windows Edge/Chrome, the actual microphone, recognition of the author's voice, installed reading voices, and his printer still need real-device validation. Automated Linux Chrome tests do not prove these.
- Online text editing was not exercised against a paid provider or production authentication because no credentials were configured. It remains off by default. Do not infer anything about a provider's previous retention or training from this new local implementation.
- The current Nitro preview static-file server serves WASM as `application/octet-stream`; ONNX Runtime logs a streaming-compilation warning and successfully falls back to ArrayBuffer compilation. Both real transcription checks passed through that fallback. Verify `application/wasm` for the speech asset on the eventual host.
- Before deployment, preserve the existing installation's browser data and exported text. Keep the same origin for in-place legacy-library loading. Rebuild from this source; do not reuse the old generated bundle. Deployment and GitHub publication are not part of this local review.
- Code rollback baseline is `d7a1faa34bed1bcde1bc361ab073d2fd96d650ee`; reinstall its lockfile and rebuild without clearing browser data. Export new drafts/history first. That rollback reintroduces the old remote-audio and saving behavior.
