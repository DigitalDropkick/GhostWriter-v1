# GhostWriter v2 follow-up audit

September 18, 2026. Scope: onboarding, writing/editing, local dictation, draft recovery, storage, backup/restore, history, reading, export/print, accessibility, privacy boundaries, dependency advisories, and development/production builds.

## GitHub checkpoint

The recovered work was validated, committed, and pushed to GitHub `main` with annotated tag **`v2`**, pointing to `002002b8be8922b4baa35d141dc4fbb630d034a0`. That tag stays fixed as the pre-audit checkpoint. The subsequent changes were made on `improve/v2-end-to-end` for publication to `main` after validation. No force push or production deployment command was used.

The initial dirty worktree was preserved in the v2 commit, including the previously staged removal of generated `.vercel/output` files. Source platform assets remain present; deployment output is rebuilt and ignored by Git.

## Findings and changes

| Finding | Improvement | Files |
| --- | --- | --- |
| Cancelling an audio import during a slow save allowed its later transcription to replace text typed after cancellation. Reproduced against the v2 build. | Finish retaining the recording before offering processing cancellation. Saved-recording retries enter a busy state immediately and ignore cancelled/stale results. | `src/components/talk-flow.tsx` |
| Backup restoration wrote each recording before saving the library. A failed save left orphan audio. Reproduced with injected quota failure. | Commit restored recordings and library state in one IndexedDB transaction, retaining incoming audio in memory for emergency backup and retry after failure. Retrying does not create duplicate books. | `src/lib/storage.ts`, `src/lib/backup.ts`, `src/lib/book-store.tsx`, `src/components/library-tools.tsx` |
| One missing recording prevented a full-library backup, even when every word remained readable. | Add an explicitly named text-only backup that preserves all books, transcripts, drafts, and history without audio. Full backups still reject missing recordings instead of silently omitting them. | `src/lib/backup.ts`, `src/components/library-tools.tsx` |
| The repeated-group base64 validation regex threw `RangeError` on an 8 MB field, below the documented import limit. | Use a character-class scan with length and padding validation. Add large-input and malformed-input regressions. | `src/lib/backup.ts`, `tests/library.test.ts` |
| History treated identical text with different titles as the same page. Restoring an earlier title could lose the current title. | Deduplicate by both title and body. | `src/lib/book-store.tsx` |
| A crashed worker stayed cached, so retry could reuse a dead worker. Live recording could also exceed the one-hour transcription limit. | Discard failed workers; automatically finish microphone sessions at about 55 minutes or the existing byte threshold. | `src/components/talk-flow.tsx` |
| Undoing optional editing could revert the author's manual corrections all the way to the raw transcript. | Keep the immediately preceding wording for undo while retaining the original transcript separately. No paid editing request was made to test the provider. | `src/components/talk-flow.tsx` |
| Onboarding implied that editing styles affected private transcription automatically. Toast text inherited the library's small default despite utility classes. | Explain that styles apply only to optional online editing, default to faithful wording, and apply readable notification sizing using the existing design tokens. | `src/components/welcome-flow.tsx`, `src/routes/__root.tsx` |
| Dependency audit reported three high entries, arising from `js-yaml`, `sharp`, and the speech library's dependency on `sharp`. | Pin targeted overrides to `js-yaml` 4.3.2 and `sharp` 0.35.4. Keep Transformers.js 3.8.1 and the speech-model revision unchanged. | `package.json`, `package-lock.json` |
| Nitro's local preview server served speech WASM as `application/octet-stream`, forcing a compilation fallback. | Correct only generated WASM asset response headers in local preview. Verified HTTP 200 with `application/wasm`; the final real-model run emitted no previous MIME fallback error. | `vite.config.ts` |

The database name/version/stores, stored library schema, and backup format version remain compatible with v2. No unrelated design overhaul, framework upgrade, authentication rewrite, or model/provider change was made.

## Verified results

- `npm run typecheck`: passed.
- `npm run lint`: passed with the existing unused-disable warning in `src/lib/auth/use-current-user.ts`; no lint errors.
- `npm test`: passed all four test files. A detailed run with `node --import tsx --test --test-isolation=none scripts/*.test.mjs tests/*.test.ts` confirmed **110 passing tests**, including 15 library/recovery tests.
- `env -u DATABASE_URL npm run build`: passed; remote migrations skipped. The rebuilt output was served locally and tested after restarting preview.
- Development core browser suite: **18 checkpoints passed**.
- Production `npm run test:browser -- http://127.0.0.1:8081 --speech`: **20 checkpoints passed**, including actual Whisper transcription of the public JFK fixture, repeated with networking disabled. Zero observed browser upload requests and zero page runtime errors.
- Production `npm run test:recovery -- http://127.0.0.1:8081`: **7 scenarios passed**: cancellation, quota-failed restore/export/retry, missing-audio text recovery, title history, worker failure/duration cutoff, Unicode export/multi-chapter print, and complete local-voice chunking at the selected speed. Zero page runtime errors or upload requests in these scenarios.
- Desktop/mobile smoke: dev and production returned visible content, HTTP 200, no horizontal overflow, no console/page errors, no branding warnings, and matching initial-page content. Desktop and mobile screenshots were inspected. Core checks also cover 320 px width, extra-large text, dialog keyboard focus, and print visibility.
- Synthetic manuscript PDF: **8 Letter-sized pages**, containing both test chapters. This verifies browser print generation, not physical printer output.
- `npm audit --json`: **0 known vulnerabilities** after the targeted overrides, across the installed dependency tree.
- `git diff --check`: passed; source and lockfile changes reviewed.

The first four recovery scenarios were also run against the unchanged v2 production build: cancellation overwrote new text, quota failure left orphan audio, text-only recovery was absent, and the corrected title was lost. These tests now pass on the updated production build.

Local evidence is ignored by Git: `screenshots/qa-review/`, `screenshots/qa-recovery/`, and `screenshots/qa-v2/`. Tests use public or synthetic content, never the author's private recordings or manuscripts.

## Remaining real-world checks

- Test the actual Windows laptop's microphone permissions, microphone quality, recognition of the author's accent/names, installed English reading voices, and physical printer. Linux automation and synthetic voice objects do not prove those behaviors.
- Hosted authentication and optional paid xAI editing were reviewed in code but not exercised against a live account/provider. Online writing help remains off by default and requires explicit per-passage consent. Validate production authentication/proxy settings before enabling it; local preview logged a shared-IP rate-limit warning without a forwarding proxy.
- Opening the hosted app and the first model download still require connectivity. Cached, already-loaded inference works offline; this is not a fully offline installed Windows application.
- Browser/profile/origin changes and clearing browser data still require a backup first. Browser-local data and exported backups are not application-encrypted. Full backups over 250 MB require assisted restoration; text-only backups provide a smaller recovery option. Do not interpret a successful download as proof the author copied it to a USB drive.
- Failed restore data remains in memory until a successful retry; use the save warning and export before closing. A sudden device failure can still lose unsaved work or the newest recording checkpoint. Historical orphan recordings created by older code are not automatically deleted by this change.
- Dependency audit results are a point-in-time advisory check, not proof that the application has no security defects. Native image parsing is not used by this app's browser dictation path; the transitive dependency was still patched.
- The eventual hosting system must also serve WASM correctly. The MIME fix here is scoped to local Nitro preview; deployment headers still need verification.

## Rollback

First download a current backup and preserve the browser profile. From a clean checkout:

```sh
git switch -c rollback/v2 v2
npm ci
env -u DATABASE_URL npm run build
```

This creates a local branch at the pre-audit checkpoint without moving `main` or clearing browser data. It reintroduces the bugs and dependency advisories above. Return with `git switch main`, reinstall the lockfile, and rebuild. The original pre-v2 commit also restores cloud-audio behavior and is not the preferred rollback target. No deployment rollback is needed for this local/GitHub work.

## Technical references

- [IndexedDB transaction abort rolls back associated changes](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/abort).
- [Streaming WebAssembly compilation requires `application/wasm`](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiateStreaming_static).
- [js-yaml advisory and patched 4.3.2 release](https://github.com/advisories/GHSA-2883-xcg3-v3hh).
- [sharp/libheif advisory](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) and [sharp 0.35.4 changelog](https://sharp.pixelplumbing.com/changelog/v0.35.4/).
