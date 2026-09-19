import { z } from "zod";
import { parseState } from "./state-schema";
import { loadAudio, saveAudio } from "./storage";
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
      data: z.string().regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
    }),
  ),
});

export async function createBackup(state: PersistedState): Promise<string> {
  const ids = new Set(
    [...state.sessions.map((s) => s.audioId), state.draft?.audioId].filter(
      (id): id is string => !!id,
    ),
  );
  const audio = [];
  for (const id of ids) {
    const blob = await loadAudio(id);
    if (!blob)
      throw new Error(
        "A recording is missing. Save a text copy too, and contact Addam before clearing browser data.",
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

export async function prepareImport(
  backup: ReturnType<typeof parseBackup>,
): Promise<PersistedState> {
  const s = backup.state;
  const bookIds = new Map(s.books.map((b) => [b.id, uid("book")]));
  const chapterIds = new Map(s.chapters.map((c) => [c.id, uid("ch")]));
  const audioIds = new Map(backup.audio.map((a) => [a.id, uid("aud")]));
  for (const a of backup.audio) {
    const bytes = Uint8Array.from(atob(a.data), (char) => char.charCodeAt(0));
    await saveAudio(audioIds.get(a.id)!, new Blob([bytes], { type: a.type }));
  }
  return {
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
}
