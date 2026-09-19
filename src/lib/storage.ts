import type { PersistedState } from "./types";
import { makeSampleBook } from "./sample";
import { parseState } from "./state-schema";

const DB_NAME = "ghostwriter";
const STATE_KEY = "state";
const REVISION_KEY = "revision";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains("audio")) db.createObjectStore("audio");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("Close other Ghostwriter tabs, then try again."));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Saving failed."));
    tx.onabort = () => reject(tx.error ?? new Error("Saving was interrupted."));
  });
}

export function emptyState(): PersistedState {
  const { book, chapter } = makeSampleBook();
  return {
    books: [book],
    chapters: [chapter],
    sessions: [],
    currentBookId: book.id,
    currentChapterId: chapter.id,
    settings: { typeSize: "large", helpDismissed: false },
    draft: null,
    revisions: [],
  };
}

export async function loadState(): Promise<{ state: PersistedState; revision: number }> {
  const db = await openDb();
  try {
    const tx = db.transaction("kv", "readonly");
    const done = txDone(tx);
    const state = tx.objectStore("kv").get(STATE_KEY);
    const revision = tx.objectStore("kv").get(REVISION_KEY);
    await done;
    // Only an absent record is a new library. Never overwrite an unreadable library.
    return {
      state: state.result === undefined ? emptyState() : parseState(state.result),
      revision: revision.result ?? 0,
    };
  } finally {
    db.close();
  }
}

export class SaveConflictError extends Error {
  constructor() {
    super("Another Ghostwriter tab saved changes. Download a backup of this tab before reloading.");
  }
}

export async function saveState(state: PersistedState, expectedRevision: number): Promise<number> {
  const db = await openDb();
  try {
    const tx = db.transaction("kv", "readwrite");
    const done = txDone(tx);
    const store = tx.objectStore("kv");
    let conflict = false;
    let writeError: unknown;
    const check = store.get(REVISION_KEY);
    check.onsuccess = () => {
      if ((check.result ?? 0) !== expectedRevision) {
        conflict = true;
        tx.abort();
        return;
      }
      try {
        store.put(state, STATE_KEY);
        store.put(expectedRevision + 1, REVISION_KEY);
      } catch (error) {
        writeError = error;
        tx.abort();
      }
    };
    try {
      await done;
    } catch (error) {
      if (conflict) throw new SaveConflictError();
      if (writeError) throw writeError;
      throw error;
    }
    return expectedRevision + 1;
  } finally {
    db.close();
  }
}

export async function saveAudio(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction("audio", "readwrite");
    const done = txDone(tx);
    tx.objectStore("audio").put(blob, id);
    await done;
  } finally {
    db.close();
  }
}

export async function loadAudio(id: string): Promise<Blob | null> {
  const db = await openDb();
  try {
    const tx = db.transaction("audio", "readonly");
    const done = txDone(tx);
    const req = tx.objectStore("audio").get(id);
    await done;
    return req.result ?? null;
  } finally {
    db.close();
  }
}

export async function deleteAudio(id: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction("audio", "readwrite");
    const done = txDone(tx);
    tx.objectStore("audio").delete(id);
    await done;
  } finally {
    db.close();
  }
}
