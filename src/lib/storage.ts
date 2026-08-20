import type { PersistedState } from "./types";
import { makeSampleBook } from "./sample";

const DB_NAME = "ghostwriter";
const DB_VERSION = 1;
const STATE_KEY = "state";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains("audio")) db.createObjectStore("audio");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
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
  };
}

export async function loadState(): Promise<PersistedState> {
  try {
    const db = await openDb();
    const value = await new Promise<PersistedState | undefined>((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get(STATE_KEY);
      req.onsuccess = () => resolve(req.result as PersistedState | undefined);
      req.onerror = () => reject(req.error);
    });
    if (!value || !Array.isArray(value.books)) return emptyState();
    return {
      ...emptyState(),
      ...value,
      settings: { ...emptyState().settings, ...value.settings },
    };
  } catch {
    return emptyState();
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("kv", "readwrite");
  tx.objectStore("kv").put(state, STATE_KEY);
  await txDone(tx);
}

export async function saveAudio(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("audio", "readwrite");
  tx.objectStore("audio").put(blob, id);
  await txDone(tx);
}

export async function loadAudio(id: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("audio", "readonly");
      const req = tx.objectStore("audio").get(id);
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteAudio(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("audio", "readwrite");
  tx.objectStore("audio").delete(id);
  await txDone(tx);
}
