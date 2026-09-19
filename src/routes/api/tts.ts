import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: { handlers: { POST: () => Response.json({ ok: false, error: "Online reading is disabled. Reload Ghostwriter to use an installed voice on your computer." }, { status: 410 }) } },
});
