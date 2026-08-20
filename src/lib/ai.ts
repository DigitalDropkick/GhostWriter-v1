import { createServerFn } from "@tanstack/react-start";
import type { BookKind, PolishLevel } from "./types";

const KIND_INSTRUCTION: Record<BookKind, string> = {
  memoir:
    "This is a memoir / life story told in the first person unless the speaker used another form.",
  family:
    "This is a collection of family stories. Keep names, places, and relationships exactly as spoken.",
  novel:
    "This is fiction. Shape scenes and chapters, but do not add plot the speaker did not tell.",
  other: "Treat this as a book the speaker is dictating. Follow their lead on tense and person.",
};

const POLISH_INSTRUCTION: Record<PolishLevel, string> = {
  faithful: `POLISH LEVEL: FAITHFUL
- Add punctuation, capitalization, and paragraph breaks.
- Remove only obvious speech-to-text garbage (duplicate words from a stutter in the recognizer, "um" / "uh" if they are fillers).
- Do not rewrite sentences. Do not reorder memories.`,
  light: `POLISH LEVEL: LIGHT
- Fix false starts, repetitions, and speech-to-text errors.
- Turn talk into readable paragraphs in the speaker's diction.
- You may join fragments into complete sentences when the meaning is clear.
- Do not add images, dialogue, or facts they did not say.`,
  literary: `POLISH LEVEL: LITERARY CHAPTER
- Turn stream-of-consciousness talk into a cohesive chapter.
- Keep their vocabulary, humor, rhythm, and regional speech.
- Group related memories; give the chapter a natural opening and landing.
- Do not invent people, events, dates, feelings, or dialogue.
- Do not modernize their language or make them sound like a magazine.`,
};

export const shapeDictation = createServerFn({ method: "POST" })
  .validator(
    (input: {
      transcript: string;
      existingBody: string;
      chapterTitle: string;
      bookTitle: string;
      author: string;
      kind: BookKind;
      polish: PolishLevel;
      voiceNotes: string;
      destination: "append" | "new";
    }) => input,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Writing help is not available right now." };
    }

    const system = `You are an old-school ghostwriter. You set spoken stories on the page in the speaker's own voice. You are invisible. You do not show off. You never invent.

HARD RULES
- Do not add facts, scenes, people, dates, or feelings the speaker did not mention.
- Do not "improve" their personality, politics, faith, or humor.
- Keep their idioms, repetitions that are character (not recognizer glitches), and cadence.
- American English, matching any regional flavor in the speech.
- Output STRICT JSON only, no markdown.`;

    const user = `BOOK TITLE: ${data.bookTitle}
AUTHOR BYLINE: ${data.author}
CURRENT CHAPTER TITLE: ${data.chapterTitle || "(untitled)"}
${KIND_INSTRUCTION[data.kind]}
${POLISH_INSTRUCTION[data.polish]}
VOICE NOTES FROM THE AUTHOR: ${data.voiceNotes || "(none)"}
DESTINATION: ${data.destination === "new" ? "This dictation starts a NEW chapter. Write the full chapter body." : "This dictation continues the EXISTING chapter. Weave the new talk into the chapter. Keep all existing content; you may lightly re-paragraph so the new material sits in the right place, but do not delete their earlier pages."}

EXISTING CHAPTER TEXT:
"""
${data.existingBody || "(empty — this is the beginning)"}
"""

NEW SPOKEN TRANSCRIPT (stream of consciousness):
"""
${data.transcript.slice(0, 16000)}
"""

Return JSON:
{
  "chapterTitle": "short title in their spirit, 2-7 words",
  "body": "the full chapter prose, ready to print",
  "note": "one short sentence telling the author what you did, in plain language"
}`;

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.4,
          max_tokens: 4096,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) {
        return { ok: false as const, error: `The writer could not be reached (${res.status}).` };
      }
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = body.choices?.[0]?.message?.content ?? "";
      const parsed = parseJsonObject(raw);
      if (!parsed?.body) {
        return { ok: false as const, error: "The writer returned an empty page." };
      }
      return {
        ok: true as const,
        chapterTitle: String(parsed.chapterTitle || data.chapterTitle || "Chapter"),
        body: String(parsed.body),
        note: String(parsed.note || "Your words are on the page."),
      };
    } catch {
      return { ok: false as const, error: "The writer could not finish. Your spoken words are still saved." };
    }
  });

function parseJsonObject(raw: string): {
  chapterTitle?: string;
  body?: string;
  note?: string;
} | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as {
      chapterTitle?: string;
      body?: string;
      note?: string;
    };
  } catch {
    return null;
  }
}
