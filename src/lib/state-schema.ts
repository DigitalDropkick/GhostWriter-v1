import { z } from "zod";
import type { PersistedState } from "./types";

const id = z.string().min(1);
const time = z.number().finite().nonnegative();
export const stateSchema = z.object({
  books: z.array(
    z.object({
      id,
      title: z.string(),
      author: z.string(),
      kind: z.enum(["memoir", "family", "novel", "other"]),
      polish: z.enum(["faithful", "light", "literary"]),
      voiceNotes: z.string(),
      isSample: z.boolean().optional(),
      createdAt: time,
      updatedAt: time,
    }),
  ),
  chapters: z.array(
    z.object({ id, bookId: id, title: z.string(), body: z.string(), sort: time, updatedAt: time }),
  ),
  sessions: z.array(
    z.object({
      id,
      bookId: id,
      chapterId: id,
      transcript: z.string(),
      audioId: id.nullable(),
      durationMs: time,
      createdAt: time,
    }),
  ),
  currentBookId: id.nullable(),
  currentChapterId: id.nullable(),
  settings: z.object({
    typeSize: z.enum(["comfortable", "large", "xlarge"]),
    helpDismissed: z.boolean(),
  }),
  draft: z
    .object({
      originalTranscript: z.string().optional(),
      bookId: id,
      chapterId: id,
      transcript: z.string(),
      audioId: id.nullable(),
      durationMs: time,
    })
    .nullable()
    .optional(),
  revisions: z
    .array(z.object({ id, chapterId: id, title: z.string(), body: z.string(), createdAt: time }))
    .optional(),
});

export function parseState(value: unknown): PersistedState {
  const state = stateSchema.parse(value);
  for (const rows of [state.books, state.chapters, state.sessions, state.revisions ?? []]) {
    if (new Set(rows.map((row) => row.id)).size !== rows.length)
      throw new Error("Duplicate entries in the library.");
  }
  const books = new Set(state.books.map((b) => b.id));
  const chapters = new Map(state.chapters.map((c) => [c.id, c.bookId]));
  if (
    state.chapters.some((c) => !books.has(c.bookId)) ||
    state.sessions.some((s) => chapters.get(s.chapterId) !== s.bookId) ||
    state.revisions?.some((r) => !chapters.has(r.chapterId)) ||
    (state.draft && chapters.get(state.draft.chapterId) !== state.draft.bookId)
  ) {
    throw new Error("A chapter or recording is missing its book.");
  }
  return state;
}
