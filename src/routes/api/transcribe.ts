import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { ok: false, error: "Transcription is not available right now." },
            { status: 503 },
          );
        }

        const incoming = await request.formData();
        const file = incoming.get("file");
        if (!(file instanceof Blob) || file.size < 200) {
          return Response.json(
            { ok: false, error: "I did not receive a recording." },
            { status: 400 },
          );
        }

        const filename =
          file instanceof File && file.name ? file.name : "recording.webm";
        const outbound = new FormData();
        outbound.append("file", file, filename);

        try {
          const res = await fetch("https://api.x.ai/v1/stt", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: outbound,
          });
          const raw = await res.text();
          if (!res.ok) {
            return Response.json(
              { ok: false, error: `Could not hear the recording (${res.status}).` },
              { status: 502 },
            );
          }
          let parsed: unknown = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { text: raw };
          }
          const text = extractTranscript(parsed);
          if (!text) {
            return Response.json(
              { ok: false, error: "I could not make out any words." },
              { status: 422 },
            );
          }
          return Response.json({ ok: true, text });
        } catch {
          return Response.json(
            { ok: false, error: "Transcription failed." },
            { status: 502 },
          );
        }
      },
    },
  },
});

function extractTranscript(parsed: unknown): string {
  if (typeof parsed === "string") return parsed.trim();
  if (!parsed || typeof parsed !== "object") return "";
  const obj = parsed as Record<string, unknown>;
  const direct = obj.text ?? obj.transcript ?? obj.transcription;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (Array.isArray(obj.segments)) {
    const joined = obj.segments
      .map((seg) =>
        seg && typeof seg === "object" && "text" in seg
          ? String((seg as { text?: unknown }).text ?? "")
          : "",
      )
      .join(" ")
      .trim();
    if (joined) return joined;
  }
  if (obj.result && typeof obj.result === "object") {
    return extractTranscript(obj.result);
  }
  return "";
}
