# Ghostwriter CF v1.0 / v4

Digital Dropkick's private writing room. Preserve the existing React/TanStack Start/Tailwind architecture and warm book design.

- Never rewrite or reset IndexedDB, backup formats, recording recovery, page history or draft semantics casually. Keep the recovery tests.
- Manuscripts, recordings and transcription stay on the device. No analytics or cloud storage.
- Optional text editing is off by default; it requires verified Access identity, per-passage consent, configured model, server secret and rate limiting.
- Production uses the official Cloudflare Vite plugin with a Worker entry wrapping TanStack Start. Never add a production auth bypass.
- Cache only the verified build shell and static assets. Never cache navigation responses, auth, APIs, credentials or user content.
- Use plain client-facing language and truthful save/backup status. Keep implementation terms in developer documentation.
- Check desktop, 320px, iPhone-sized and large-text layouts. Preserve safe areas, focus management, touch targets and print.
- Run npm ci, typecheck, lint, test, build, production browser tests, recovery tests and audit; inspect the diff.
- Deployment, resource creation and DNS require separate authorization. A Git push does not authorize deployment.
- Do not alter existing Git tags or history. Never commit secrets, real writing, audio or personal backups.
