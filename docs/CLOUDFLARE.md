# Cloudflare setup and rollback - manual, not yet executed

V4 prepares the build only. No Cloudflare resources, routes, domains, DNS records, credentials, or accounts were changed. Publication to GitHub is not a live deployment.

## Decide the permanent origin first

Choose the domain with Addam before deploying. Export and verify full Ghostwriter backups from existing devices before leaving the old origin. Keep the old app/browser profile available until the imported books, recordings, drafts and history are verified on the new origin. There is no automatic cross-origin migration. Never clear browser data to fix an upgrade. Do not use private/incognito windows for primary writing.

The two approved email addresses, Cloudflare account, team domain, application audience and final hostname are intentionally not invented or committed here.

## Required settings

| Setting | Type | Purpose |
| --- | --- | --- |
| `ACCESS_TEAM_DOMAIN` | Worker variable | Exact `https://TEAM.cloudflareaccess.com` issuer for this Access team |
| `ACCESS_AUD` | Worker variable | Application audience copied from this site's Access application |
| `GHOSTWRITER_ONLINE_HELP` | Worker variable | Keep `false` for initial deployment |
| `ASSETS` | Generated assets binding | Official Vite plugin supplies the built client directory |
| `ONLINE_HELP_MODEL` | Optional Worker variable | Exact xAI model ID selected and tested when enabling text editing |
| `XAI_API_KEY` | Optional Worker secret | Required only for explicitly enabled text editing; never a Vite/public variable |
| `ONLINE_HELP_LIMITER` | Optional native rate-limit binding | Required before text editing is available |

`.dev.vars.example` contains non-secret examples. Local `.dev.vars*` files are ignored. Do not place real credentials in source, screenshots, shell arguments, chat, build output or browser storage. Local dictation never requires a provider key.

## First deployment, after separate approval

1. Preserve existing browser libraries and backups. Verify the Cloudflare account and zone with Addam. Choose a stable hostname.
2. Create a self-hosted Cloudflare Access application covering the **entire hostname**, with no path exclusions. Allow exactly Addam's email and the Lexington client's email. Use their chosen identity provider or email one-time PIN. Do not allow an entire email domain, Everyone, or Bypass. Set an appropriate session duration and verify both mailboxes can sign in.
3. Copy the Access audience and team issuer into `wrangler.jsonc` variables or the approved deployment environment. Preserve `workers_dev: false`, `preview_urls: false`, and `assets.run_worker_first: true`. Add only the chosen hostname as a custom-domain route. Review the generated `dist/server/wrangler.json` after building. Do not use a public workers.dev URL or a public asset exemption to work around Access.
4. Authenticate Wrangler through the owner's approved account/session. Build with the committed lockfile, run the acceptance suite, and review the dry-run package if desired. The following deployment command **creates/updates production resources** and must only be used after the separate deployment approval:

   ```sh
   npm ci
   npm run typecheck
   npm run lint
   npm test
   npm run build
   npx wrangler deploy --config dist/server/wrangler.json
   ```

5. Keep Cloudflare's edge TLS valid and verify HTTPS behavior before relying on HSTS. Check unauthenticated and wrong-account requests are denied, both approved accounts can enter, direct alternate hostnames do not bypass Access, and static assets receive the intended headers. Do not enable HTML rewrites, script injection, Rocket Loader, analytics, or minification that changes byte-verified static assets.
6. On each real device, sign in, open the installed icon online, prepare private dictation, dictate a real short passage, back up, reload offline, dictate again, restore the backup as copies and verify recordings/history. Test expired Access login while keeping local work. Only then hand over daily writing to the client.

Access policies are configured outside this repository. The Worker verifies token integrity/audience; it does not replace the two-email allow policy. Cloudflare can retain operational request/authentication metadata. Keep manuscript text out of URLs and logs.

## Optional editor: leave off until deliberately commissioned

The initial deployment needs no AI provider key. If enabling xAI later, first review its current privacy/retention terms and model availability, set a provider spending limit, and test voice/fact preservation on synthetic or explicitly consented passages. Keep the model configurable rather than using an unverified default.

Add this native binding to the source configuration, choosing a unique numeric namespace within the account:

```json
"ratelimits": [{
  "name": "ONLINE_HELP_LIMITER",
  "namespace_id": "1001",
  "simple": { "limit": 4, "period": 60 }
}]
```

The four-per-minute bucket is applied to both each user's subject and an overall key. Cloudflare rate limits are per location and eventually consistent; they do not guarantee a global daily spend cap. Provider-side budget controls remain necessary. Set `ONLINE_HELP_MODEL` to the selected model and add the secret using the authenticated interactive command, only when approved:

```sh
npx wrangler secret put XAI_API_KEY
```

Paste the key only into Wrangler's secret prompt. Never commit it or expose it as `VITE_*`. Enable `GHOSTWRITER_ONLINE_HELP=true` only after all configuration and live validation are complete. The app still asks before every passage, names the external service for informed consent, and provides original-wording recovery. Turning the flag back to `false` removes the editing UI and disables the endpoint. No automatic provider switch or audio upload is supported.

## Updates and rollback

Before every release, verify a fresh backup on each writing device. Save the current deployed Worker version ID and tested source SHA. Deploy updated assets and Worker together. The service worker waits; ask the author to finish recording, verify the saved indicator, back up and close **all** Ghostwriter tabs/windows before reopening. Never force refresh or activate a new worker during an active draft.

For application rollback, select the last known-good **Cloudflare v4-compatible** Worker version in the Cloudflare dashboard (or use the account's verified Wrangler rollback command). Restore its matching static assets. Keep Access policy, hostname and security bindings intact. Check the app and offline path again. Cached clients must finish and close before the older worker can install/activate; verify the installed build afterward. Do not delete IndexedDB, model caches or the browser profile as part of rollback.

No known-good Cloudflare deployment exists yet, so there is no live Worker version ID to roll back to today. The original v3 source remains at its original tag and `main`; it uses an obsolete auth/deployment stack and is not a drop-in Cloudflare rollback. Preserve it for source/history and access to the old-origin library. Never overwrite v2/v3 tags or force-push history.

Library recovery is separate from code rollback. Export the current library first; use **Backups → Restore a backup** to add verified copies, inspect them, and keep the original file. A storage failure may leave unsaved imported copies in memory for retry; keep that page open and use its save warning. Do not import the same backup repeatedly to attempt a storage repair.
