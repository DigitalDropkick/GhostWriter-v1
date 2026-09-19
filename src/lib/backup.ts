import { z } from "zod";
import { parseState } from "./state-schema";
import { loadAudio, type AudioEntry } from "./storage";
import { uid } from "./utils";
import type { PersistedState } from "./types";

const backupSchema = z.object({
  format: z.literal("ghostwriter-backup"),
  version: z.literal(1),
  createdAt: z.string(),
  state: z.unknown(),
  audio: z.array(
    z.object({
      id: z.string().min(1),
      type: z.string(),
      // Repeated four-character capture groups exhaust the JS regexp stack for
      // ordinary multi-megabyte recordings. Scan a character class instead.
      data: z.string().refine((data) => data.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(data)),
    }),
  ),
});

export async function createBackup(
  state: PersistedState,
  pendingAudio: AudioEntry[] = [],
  includeAudio = true,
): Promise<string> {
  if (!includeAudio) {
    state = {
      ...state,
      sessions: state.sessions.map((session) => ({ ...session, audioId: null })),
      draft: state.draft ? { ...state.draft, audioId: null } : state.draft,
    };
  }
  const ids = new Set(
    [...state.sessions.map((s) => s.audioId), state.draft?.audioId].filter(
      (id): id is string => !!id,
    ),
  );
  const audio = [];
  for (const id of ids) {
    const blob = pendingAudio.find((entry) => entry.id === id)?.blob ?? await loadAudio(id);
    if (!blob)
      throw new Error(
        "A recording is missing. Save a text-only backup to protect all your words, and contact Addam before clearing browser data.",
      );
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(new Error("Could not read a recording."));
      reader.readAsDataURL(blob);
    });
    audio.push({ id, type: blob.type, data });
  }
  return JSON.stringify({
    format: "ghostwriter-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    state,
    audio,
  });
}

export function parseBackup(text: string) {
  const backup = backupSchema.parse(JSON.parse(text));
  const state = parseState(backup.state);
  const ids = new Set(backup.audio.map((a) => a.id));
  if (
    ids.size !== backup.audio.length ||
    state.sessions.some((s) => s.audioId && !ids.has(s.audioId)) ||
    (state.draft?.audioId && !ids.has(state.draft.audioId))
  )
    throw new Error("The backup is missing a recording.");
  return { ...backup, state };
}

export function prepareImport(
  backup: ReturnType<typeof parseBackup>,
): { state: PersistedState; audio: AudioEntry[] } {
  const s = backup.state;
  const bookIds = new Map(s.books.map((b) => [b.id, uid("book")]));
  const chapterIds = new Map(s.chapters.map((c) => [c.id, uid("ch")]));
  const audioIds = new Map(backup.audio.map((a) => [a.id, uid("aud")]));
  const audio = backup.audio.map((a) => {
    const bytes = Uint8Array.from(atob(a.data), (char) => char.charCodeAt(0));
    return { id: audioIds.get(a.id)!, blob: new Blob([bytes], { type: a.type }) };
  });
  const state: PersistedState = {
    ...s,
    books: s.books.map((b) => ({
      ...b,
      id: bookIds.get(b.id)!,
      title: `${b.title} (restored)`,
      isSample: false,
    })),
    chapters: s.chapters.map((c) => ({
      ...c,
      id: chapterIds.get(c.id)!,
      bookId: bookIds.get(c.bookId)!,
    })),
    sessions: s.sessions.map((v) => ({
      ...v,
      id: uid("sess"),
      bookId: bookIds.get(v.bookId)!,
      chapterId: chapterIds.get(v.chapterId)!,
      audioId: v.audioId ? audioIds.get(v.audioId)! : null,
    })),
    revisions: s.revisions?.map((r) => ({
      ...r,
      id: uid("rev"),
      chapterId: chapterIds.get(r.chapterId)!,
    })),
    draft: s.draft
      ? {
          ...s.draft,
          bookId: bookIds.get(s.draft.bookId)!,
          chapterId: chapterIds.get(s.draft.chapterId)!,
          audioId: s.draft.audioId ? audioIds.get(s.draft.audioId)! : null,
        }
      : null,
    currentBookId: bookIds.get(s.currentBookId ?? "") ?? null,
    currentChapterId: chapterIds.get(s.currentChapterId ?? "") ?? null,
  };
  return { state, audio };
}
