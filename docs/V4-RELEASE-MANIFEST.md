# v4 release manifest

Changes from `e3e451bae6e91db7a5f2c4df8be3ad8c8022c81e` on `production/cloudflare-v4`. These paths cover the complete release, including this document. Generated build output, test media, screenshots, local variables and keys are ignored and not part of the commit.

The release preserves the IndexedDB and backup formats. Most removed files belong to obsolete platform tooling/authentication; relevant local writing/recovery tests and bundled font licenses remain. Architecture, exact validation and manual configuration are in the companion documentation.

## Files added (27)

- `.dev.vars.example`
- `docs/ARCHITECTURE.md`
- `docs/CLOUDFLARE.md`
- `docs/FUTURE-ENCRYPTED-BACKUP.md`
- `docs/V4-BASELINE.md`
- `docs/V4-RELEASE-MANIFEST.md`
- `docs/VALIDATION.md`
- `scripts/build-guide.mjs`
- `scripts/build-offline.mjs`
- `scripts/ghostwriter-polish.mjs`
- `scripts/ghostwriter-production.mjs`
- `scripts/offline-entry-plugin.mjs`
- `scripts/print-guide.mjs`
- `scripts/worker-test-server.mjs`
- `src/client.tsx`
- `src/lib/install-app.tsx`
- `src/lib/server/access.ts`
- `src/lib/server/error-page.ts`
- `src/lib/server/online-help.ts`
- `src/lib/server/security.ts`
- `src/lib/use-online-help.ts`
- `src/lib/user-message.ts`
- `src/offline.tsx`
- `tests/access.test.ts`
- `tests/online-help.test.ts`
- `worker.ts`
- `wrangler.jsonc`

## Files modified (39)

- `.gitignore`
- `AGENTS.md`
- `GETTING-STARTED.md`
- `README.md`
- `eslint.config.mjs`
- `package-lock.json`
- `package.json`
- `public/getting-started.html`
- `public/getting-started.pdf`
- `scripts/browser-smoke.mjs`
- `scripts/ghostwriter-browser.mjs`
- `scripts/ghostwriter-iphone.mjs`
- `scripts/ghostwriter-offline.test.mjs`
- `scripts/ghostwriter-recovery.mjs`
- `scripts/ghostwriter-sw.js`
- `src/components/getting-started-sheet.tsx`
- `src/components/ghostwriter-app.tsx`
- `src/components/library-tools.tsx`
- `src/components/phone-setup.tsx`
- `src/components/talk-flow.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/modal.tsx`
- `src/components/welcome-flow.tsx`
- `src/lib/ai.ts`
- `src/lib/backup.ts`
- `src/lib/book-store.tsx`
- `src/lib/error-component.tsx`
- `src/lib/local-speech.ts`
- `src/lib/share-file.ts`
- `src/lib/storage.ts`
- `src/lib/use-offline-room.ts`
- `src/routeTree.gen.ts`
- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/routes/start.tsx`
- `src/styles.css`
- `src/workers/transcribe.worker.ts`
- `tsconfig.json`
- `vite.config.ts`

## Files removed (110)

- `.grok/skills/auth/SKILL.md`
- `.grok/skills/building-games/SKILL.md`
- `.grok/skills/building-games/references/3d-libs.md`
- `.grok/skills/building-games/references/ai-pathfinding.md`
- `.grok/skills/building-games/references/audio.md`
- `.grok/skills/building-games/references/babylon.md`
- `.grok/skills/building-games/references/collision-physics.md`
- `.grok/skills/building-games/references/ecs-architecture.md`
- `.grok/skills/building-games/references/game-feel-juice.md`
- `.grok/skills/building-games/references/genres/board-card-chess.md`
- `.grok/skills/building-games/references/genres/endless-runner.md`
- `.grok/skills/building-games/references/genres/fps.md`
- `.grok/skills/building-games/references/genres/platformer-2d.md`
- `.grok/skills/building-games/references/genres/puzzle-match3-tetris.md`
- `.grok/skills/building-games/references/genres/racing-kart.md`
- `.grok/skills/building-games/references/genres/topdown-twin-stick.md`
- `.grok/skills/building-games/references/genres/tower-defense.md`
- `.grok/skills/building-games/references/genres/voxel-minecraft.md`
- `.grok/skills/building-games/references/input.md`
- `.grok/skills/building-games/references/phaser.md`
- `.grok/skills/building-games/references/procedural-generation.md`
- `.grok/skills/building-games/references/save-persistence.md`
- `.grok/skills/building-games/references/threejs-foundational.md`
- `.grok/skills/controls/SKILL.md`
- `.grok/skills/design-ui/SKILL.md`
- `.grok/skills/design-ui/references/animations.md`
- `.grok/skills/design-ui/references/performance.md`
- `.grok/skills/design-ui/references/refined-ui.md`
- `.grok/skills/design-ui/references/surfaces.md`
- `.grok/skills/design-ui/references/typography.md`
- `.grok/skills/game-animation-frames/SKILL.md`
- `.grok/skills/game-asset-core/SKILL.md`
- `.grok/skills/game-character-consistency/SKILL.md`
- `.grok/skills/game-tilesets/SKILL.md`
- `.grok/skills/game-ui-icons/SKILL.md`
- `.grok/skills/generate2dmap/LICENSE`
- `.grok/skills/generate2dmap/SKILL.md`
- `.grok/skills/generate2dmap/SOURCE.md`
- `.grok/skills/generate2dmap/references/layered-map-contract.md`
- `.grok/skills/generate2dmap/references/map-strategies.md`
- `.grok/skills/generate2dmap/references/prop-pack-contract.md`
- `.grok/skills/generate2dmap/scripts/compose_layered_preview.py`
- `.grok/skills/generate2dmap/scripts/extract_prop_pack.py`
- `.grok/skills/generate2dsprite/LICENSE`
- `.grok/skills/generate2dsprite/SKILL.md`
- `.grok/skills/generate2dsprite/SOURCE.md`
- `.grok/skills/generate2dsprite/references/modes.md`
- `.grok/skills/generate2dsprite/references/prompt-rules.md`
- `.grok/skills/generate2dsprite/scripts/generate2dsprite.py`
- `.grok/skills/generate2dsprite/scripts/make_layout_guide.py`
- `.grok/skills/imagine/SKILL.md`
- `.grok/skills/multiplayer-p2p/SKILL.md`
- `.grok/skills/neon/SKILL.md`
- `.grok/skills/og/SKILL.md`
- `.grok/skills/threejs/SKILL.md`
- `.grok/skills/threejs/references/llms-full.txt`
- `.grok/skills/video2dsprite/LICENSE`
- `.grok/skills/video2dsprite/SKILL.md`
- `.grok/skills/video2dsprite/SOURCE.md`
- `.grok/skills/video2dsprite/references/pipeline.md`
- `.grok/skills/video2dsprite/references/prompt-rules.md`
- `.grok/skills/video2dsprite/scripts/video2dsprite.py`
- `.grok/skills/xai-api/SKILL.md`
- `.grok/status`
- `.node_modules.lock`
- `migrations/0001_auth.sql`
- `public/__grok/icon-180.png`
- `public/__grok/install/assets/homescreen/glass-puzzle.svg`
- `public/__grok/install/assets/homescreen/glass-share.svg`
- `public/__grok/install/assets/homescreen/logo-grok.svg`
- `public/__grok/install/assets/homescreen/ob-ipad.png`
- `public/__grok/install/assets/homescreen/ob-phone.png`
- `public/__grok/install/assets/homescreen/plus.svg`
- `public/__grok/install/styles.css`
- `scripts/brand-check.mjs`
- `scripts/brand-check.test.mjs`
- `scripts/ghostwriter-offline-plugin.mjs`
- `scripts/grok-pwa-plugin.mjs`
- `scripts/grok-pwa-plugin.test.mjs`
- `scripts/grok-pwa-shared.d.mts`
- `scripts/grok-pwa-shared.mjs`
- `scripts/install-page.html`
- `scripts/migrate.mjs`
- `scripts/preview-thumbnail.mjs`
- `scripts/print-getting-started.mjs`
- `server/middleware/grok-pwa.ts`
- `server/virtual-grok-og-identity.d.ts`
- `src/components/preview-host-bridge.tsx`
- `src/lib/auth/client.ts`
- `src/lib/auth/email-password.ts`
- `src/lib/auth/gates.tsx`
- `src/lib/auth/isolation.server.ts`
- `src/lib/auth/middleware.ts`
- `src/lib/auth/pglite-dialect.ts`
- `src/lib/auth/popup.server.ts`
- `src/lib/auth/preview.ts`
- `src/lib/auth/provider.tsx`
- `src/lib/auth/providers.ts`
- `src/lib/auth/server.ts`
- `src/lib/auth/use-current-user.ts`
- `src/lib/auth/verify.server.ts`
- `src/lib/db.ts`
- `src/lib/multiplayer/index.ts`
- `src/lib/multiplayer/p2p.ts`
- `src/lib/og/site.json`
- `src/lib/preview-embedder-origin.ts`
- `src/lib/preview-host-bridge.ts`
- `src/routes/api/auth/$.ts`
- `src/routes/login.tsx`
- `startup.sh`

## Direct dependencies added

- `jose 6.2.12`
- `@cloudflare/vite-plugin 1.61.0`
- `wrangler 4.142.0`
- `miniflare 5.20260926.0-alpha`

JOSE is a runtime dependency; the Cloudflare plugin, Wrangler and Miniflare are development/build/test dependencies.

## Direct dependencies removed (40)

- `@electric-sql/pglite`
- `@hookform/resolvers`
- `@radix-ui/react-accordion`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-avatar`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-popover`
- `@radix-ui/react-progress`
- `@radix-ui/react-radio-group`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-select`
- `@radix-ui/react-separator`
- `@radix-ui/react-slider`
- `@radix-ui/react-slot`
- `@radix-ui/react-switch`
- `@radix-ui/react-tabs`
- `@radix-ui/react-toggle`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-tooltip`
- `@tanstack/react-query`
- `@tanstack/react-table`
- `@tanstack/router-plugin`
- `@types/pg`
- `better-auth`
- `cmdk`
- `date-fns`
- `eslint-plugin-prettier`
- `kysely`
- `lightningcss`
- `nitro`
- `pg`
- `react-day-picker`
- `react-hook-form`
- `react-resizable-panels`
- `recharts`
- `vaul`
- `zustand`

## Moved to development dependencies

- `@tailwindcss/vite`
- `tailwindcss`
- `tw-animate-css`

## Other dependency/build changes

- Existing retained direct dependency ranges are unchanged.
- The lockfile is regenerated after removals/additions. Transitive versions are fixed by that lockfile.
- Existing `js-yaml` and Transformers/`sharp` overrides remain.
- Package version is `4.0.0`; Node requirement is `>=22.12.0`.
- Database migrations and obsolete platform scripts are removed from build/start. Guide generation and offline integrity manifest generation run during build.
- The server package excludes duplicate browser speech assets; originals remain in static client assets.
