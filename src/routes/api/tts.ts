import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { ok: false, error: "Listening is not available right now." },
            { status: 503 },
          );
        }

        const body = (await request.json().catch(() => null)) as {
          text?: string;
          voice?: string;
        } | null;
        const text = body?.text?.trim() ?? "";
        if (!text) {
          return Response.json({ ok: false, error: "Nothing to read." }, { status: 400 });
        }

        try {
          const res = await fetch("https://api.x.ai/v1/tts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              text: text.slice(0, 4500),
              voice_id: body?.voice || "lux",
              language: "en",
            }),
          });
          if (!res.ok) {
            return Response.json(
              { ok: false, error: `Could not read the page (${res.status}).` },
              { status: 502 },
            );
          }
          const buf = await res.arrayBuffer();
          return new Response(buf, {
            headers: {
              "Content-Type": res.headers.get("content-type") || "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        } catch {
          return Response.json(
            { ok: false, error: "Listening failed." },
            { status: 502 },
          );
        }
      },
    },
  },
});
