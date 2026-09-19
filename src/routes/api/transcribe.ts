import { createFileRoute } from "@tanstack/react-router";

// Retire the old upload route as well as its UI: no recording can be forwarded
// by stale clients when an xAI key happens to be configured on the server.
export const Route = createFileRoute("/api/transcribe")({
  server: { handlers: { POST: () => Response.json({ ok: false, error: "Audio uploads are disabled. Reload Ghostwriter to use private dictation on your computer." }, { status: 410 }) } },
});
