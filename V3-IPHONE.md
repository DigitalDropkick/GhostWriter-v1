# Ghostwriter v3 — iPhone writing room

This is a locally built and tested **Home Screen web app candidate**, on `feature/v3-iphone`. It is not a signed native iOS binary, TestFlight build, or App Store release. No deployment or phone installation was performed. Addam will obtain Papaw’s iPhone model and iOS version before the device trial. The completed v2 main checkpoint remains `33bb753` and the earlier `v2` tag remains unchanged.

## What Papaw gets

- A forest-green and brass book identity, cream manuscript pages, readable typography, and a personalized cover for each selected book.
- Large Talk and Type controls. On phones, **Write / Books / Keep safe** stay within reach; **Read** and **More options** remain at the top.
- Existing private dictation, original recordings, review before insertion, exact manuscript preservation, page history, larger reading text, and multi-chapter printing.
- Offline reopening, writing, reading, and draft recovery after successful online setup. Fonts are bundled locally. Dictation requires a separate first speech-model download; read-aloud requires a local English voice.
- **Share book** exports a plain-text manuscript. **Keep safe → Prepare backup for Files → Save or share backup** prepares a complete backup before the share-sheet gesture. If file sharing is unavailable, it downloads instead. Cancelling a share does not silently download a private backup.
- Recording stops for recovery when a page becomes hidden or its audio track is interrupted. A supported screen wake lock helps keep the page visible. Periodic recording checkpoints remain in place; an abrupt phone/process shutdown may still lose recent seconds.

Books are local to the device, browser/profile, website origin, and app storage container. There is **no automatic phone/laptop sync**, cloud book backup, or account-based library recovery. Recordings are never uploaded by private dictation. Optional online editing still requires separate consent and sends text only.

## Installation when ready

1. Choose and deploy to a stable HTTPS address. Validate the host before moving Papaw’s real library; changing the address later requires backup transfer. Localhost previews cannot be opened as that same origin on his phone.
2. On the old device/browser, download a full Ghostwriter backup and a plain-text copy of the book. Keep the originals.
3. On iPhone, open the HTTPS address in Safari. Use **Share → Add to Home Screen**; enable **Open as Web App** if the iOS version presents that option. Name it Ghostwriter, then Add. These steps follow [Apple’s Home Screen web-app instructions](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/27/ios/27); exact placement varies by iOS version.
4. Open the new Ghostwriter icon online. Use **Set up on iPhone** to check offline readiness and optionally request local-storage protection. Restore the backup *inside the installed app*. Do not assume the Safari tab and installed app expose the same saved library.
5. Test a short recording and installed reading voice. Give the speech download time to finish on Wi-Fi. Then verify airplane-mode reopening and transcription after closing/reopening the app.
6. After each session, choose **Keep safe**, prepare a backup, then **Save or share backup → Save to Files**. Deliberately choose a destination: iCloud Drive is cloud storage; local Files is on the device. Verify the file exists. The app can confirm handing it to the share sheet, not that a chosen external destination retained it.

Website storage can be evicted or cleared. Persistence is a browser decision, not a guarantee; [WebKit documents both eviction and persistent-storage heuristics](https://webkit.org/blog/14403/updates-to-storage-policy/). Never delete the app or clear website data to troubleshoot before exporting the books.

## Physical iPhone acceptance

Use a synthetic practice book first. Record the model, iOS version, available storage, and observed timing.

- Home Screen icon/title, screen cutouts, portrait/landscape, larger text, VoiceOver labels, keyboard, and controls within comfortable reach.
- Microphone permission: allow, deny, recover; actual voice quality and recognition of Papaw’s accent/names. Test Safari’s MP4/AAC recording and playback, not just desktop WebM.
- Thirty seconds, several minutes, a phone call, app switch, screen lock, process termination, and reopening. Confirm recording/draft recovery and clear stop status. Background recording is not promised.
- First speech download, cancelled download, airplane mode, and a fresh app reopening offline. Measure speech latency/memory on this specific phone; reduce passage length if necessary.
- Local English read-aloud voice and complete long-chapter playback. If the browser cannot identify a voice as local, it must refuse remote speech.
- Save/share to Files, cancellation, reopening the saved backup, restoring into a separate test library, AirDrop/plain-text sharing, and AirPrint if wanted. Complete JSON restore is capped at 250 MB.
- Low-storage recovery, repeated daily use, and backup transfer between his Windows laptop and the installed iPhone app. Keep both original libraries until the transfer is verified.

## Native iOS release path

The Home Screen edition makes the interface and writing workflow usable for a device trial. A native release is a separate milestone: settle the minimum supported iPhone/iOS version; build and test an iOS target on macOS/Xcode; preserve the local-first book/recording model; add native file, audio-session, and interruption handling where the trial shows a need; then provision and distribute a signed build. A thin website wrapper alone does not establish native reliability or App Store acceptance.

TestFlight/App Store distribution requires the Apple Developer Program and signing setup; see [Apple’s distribution guide](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases). No Apple account, signing credential, paid service, or cloud synchronization was configured here.

## Implementation and changed files

| Files | Purpose |
| --- | --- |
| `src/components/ghostwriter-app.tsx`, `welcome-flow.tsx`, `book-cover.tsx`, `src/styles.css` | Phone navigation, book covers, opening experience, safe-area layout, accessible sizing, bundled fonts |
| `src/components/phone-setup.tsx`, `src/lib/use-offline-room.ts` | Installation instructions, actual offline setup status, connection status, optional persistence request |
| `src/components/library-tools.tsx`, `src/lib/share-file.ts`, `src/lib/utils.ts` | Prepare-before-share backup flow, manuscript sharing, cancellation handling, longer download URL lifetime |
| `src/components/talk-flow.tsx`, `listen-bar.tsx` | Interruption recovery, screen wake lock, device-appropriate microphone/voice guidance |
| `scripts/ghostwriter-offline-plugin.mjs`, `ghostwriter-sw.js`, `vite.config.ts` | Build-versioned static caches, anonymous offline shell, on-demand WASM caching |
| `src/routes/__root.tsx`, `public/ghostwriter.webmanifest`, `scripts/grok-pwa-shared.mjs` | iPhone metadata, branded manifest, preserve custom identity without duplicate platform links |
| `public/favicon.svg`, `public/ghostwriter-icons/`, `public/og.jpg`, `src/lib/og/site.json`, `public/fonts/` | Coherent app identity, share card, local fonts and their licenses |
| Browser scripts, offline/injector tests, `package.json`, `README.md`, this file | Regression coverage, reproducible checks, installation and rollback instructions |

The service worker caches anonymous `/` HTML and a static asset allowlist. It never intercepts API/auth/server-function requests, POSTs, or third-party traffic. Library and recordings remain in IndexedDB; Transformers.js owns its separate model cache. Updates wait for existing app windows to close instead of reloading an active draft. Activation removes only old `ghostwriter-app-*` caches. Public asset contents participate in the cache version, so icon/font changes invalidate it too.

Production hosting must serve `/ghostwriter-sw.js` as JavaScript, allow its root scope and update checks, serve `/ghostwriter.webmanifest` as a manifest/JSON, serve `.wasm` as `application/wasm`, and preserve the HTTPS origin. Do not configure the service-worker script itself with immutable caching. A live deployment has not been validated.

## Validation

Commands and results from this workspace are recorded below; these are Chromium desktop/touch-emulation results, not physical iPhone proof.

- `npm run typecheck`: passed.
- `npm run lint`: no errors; one pre-existing unused-disable warning in `src/lib/auth/use-current-user.ts`.
- `node --import tsx --test --test-isolation=none scripts/*.test.mjs tests/*.test.ts`: 115 passing tests.
- `env -u DATABASE_URL npm run build`: passed; database migration skipped because no database URL was supplied.
- `npm run test:browser -- http://127.0.0.1:4317`: 18 development browser checks passed.
- Production core suite with `--speech`: 21 checks passed, including real Whisper transcription, offline inference, and a fresh offline reload that starts a new speech worker from cached assets/model files. An expected failed network request occurs while offline; no uncaught runtime errors or private uploads were observed.
- Production recovery suite: 7 checks passed.
- Production iPhone-flow suite: 7 checks passed (touch onboarding/navigation, Home Screen identity, Files sharing/cancellation, narrow layouts, offline reload/draft persistence, and interruption recovery).
- Development and production desktop/mobile smoke checks: matching content, no overflow or browser errors; screenshots visually inspected.
- Evidence: `screenshots/qa-review/`, `screenshots/qa-recovery/`, and `screenshots/qa-v3/` (synthetic content, ignored by Git).

WebKit 26.5 was downloaded for testing, but could not launch because this Linux host lacks `libavif16`. No system packages or sudo changes were made. Physical Safari, microphone, iOS speech voices, share destinations, App Store signing, and deployment remain unverified.

## Rollback

Before changing an existing installation, export and verify a full backup. This change does not migrate IndexedDB or change its schema. V2 main remains at `33bb753`; create a separate checkout with `git worktree add ../GhostWriter-v2-review 33bb753` to build/review it without discarding v3 work. Do not reset or remove the v3 branch to roll back.

A deployed rollback also needs service-worker handling: after a backup, unregister this origin’s Ghostwriter worker using the browser’s developer tools, or ship a reviewed retirement worker at the same `/ghostwriter-sw.js` URL. Remove only `ghostwriter-app-*` caches if needed. **Do not clear IndexedDB, all site data, or the separate speech-model cache.** Merely deploying old source does not remove a previously installed worker. Deployment/retirement should be tested on a practice library before Papaw’s phone.
