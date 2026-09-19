import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Book,
  BookKind,
  Chapter,
  DictationDraft,
  PersistedState,
  PolishLevel,
  Settings,
} from "./types";
import { emptyState, loadState, saveState, type AudioEntry } from "./storage";
import { uid } from "./utils";

type NewBook = {
  title: string;
  author: string;
  kind: BookKind;
  polish: PolishLevel;
  voiceNotes: string;
};
type SaveStatus = "loading" | "saved" | "saving" | "error";
type BookContextValue = {
  ready: boolean;
  loadError: string | null;
  saveError: string | null;
  saveStatus: SaveStatus;
  state: PersistedState;
  pendingAudio: AudioEntry[];
  book: Book | null;
  chapter: Chapter | null;
  chapters: Chapter[];
  sessionsForChapter: PersistedState["sessions"];
  setCurrent: (bookId: string, chapterId?: string | null) => void;
  createBook: (input: NewBook) => { book: Book; chapter: Chapter };
  updateBook: (id: string, patch: Partial<Book>) => void;
  addChapter: (bookId: string, title?: string) => Chapter;
  updateChapter: (id: string, patch: Partial<Chapter>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateDraft: (draft: DictationDraft | null) => void;
  commitDraft: (destination: "append" | "new") => Promise<void>;
  checkpointChapter: (id: string) => void;
  restoreRevision: (id: string) => void;
  importLibrary: (imported: { state: PersistedState; audio: AudioEntry[] }) => Promise<void>;
  flushSave: () => Promise<void>;
};
const BookContext = createContext<BookContextValue | null>(null);

export function BookProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(emptyState);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const current = useRef(state);
  const persisted = useRef(state);
  const revision = useRef(0);
  const writable = useRef(false);
  const pending = useRef<Promise<void> | null>(null);
  const pendingAudio = useRef(new Map<string, Blob>());

  useEffect(() => {
    let cancelled = false;
    loadState()
      .then((loaded) => {
        if (cancelled) return;
        current.current = persisted.current = loaded.state;
        revision.current = loaded.revision;
        setState(loaded.state);
        writable.current = true;
        setReady(true);
        setSaveStatus("saved");
      })
      .catch(() => {
        if (!cancelled)
          setLoadError(
            "We could not open your saved books. Nothing has been replaced. Close other Ghostwriter tabs and try again. If this continues, contact Addam before clearing browser data.",
          );
      });
    return () => {
      cancelled = true;
      writable.current = false;
    };
  }, []);

  const flushSave = useCallback((): Promise<void> => {
    if (pending.current) return pending.current;
    if (!writable.current || current.current === persisted.current) return Promise.resolve();
    setSaveStatus("saving");
    setSaveError(null);
    pending.current = (async () => {
      while (current.current !== persisted.current) {
        const snapshot = current.current;
        const recordings = Array.from(pendingAudio.current, ([id, blob]) => ({ id, blob }));
        revision.current = await saveState(snapshot, revision.current, recordings);
        for (const { id, blob } of recordings) {
          if (pendingAudio.current.get(id) === blob) pendingAudio.current.delete(id);
        }
        persisted.current = snapshot;
      }
      setSaveStatus("saved");
    })()
      .catch((error) => {
        setSaveStatus("error");
        setSaveError(
          error instanceof Error && error.name !== "QuotaExceededError"
            ? error.message
            : "This browser could not save your latest changes. Download a backup now, then free some storage and retry.",
        );
        throw error;
      })
      .finally(() => {
        pending.current = null;
      });
    return pending.current;
  }, []);

  const mutate = useCallback(
    (fn: (prev: PersistedState) => PersistedState) => {
      if (!writable.current) return;
      current.current = fn(current.current);
      setState(current.current);
      // Start immediately. Serialize writes and include edits made while a write is in flight.
      void flushSave().catch(() => {
        /* The persistent save-error banner owns this. */
      });
    },
    [flushSave],
  );

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (current.current !== persisted.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  const setCurrent = useCallback(
    (bookId: string, chapterId?: string | null) => {
      mutate((prev) => ({
        ...prev,
        currentBookId: bookId,
        currentChapterId:
          chapterId ??
          prev.chapters.filter((c) => c.bookId === bookId).sort((a, b) => a.sort - b.sort)[0]?.id ??
          null,
      }));
    },
    [mutate],
  );

  const createBook = useCallback(
    (input: NewBook) => {
      const now = Date.now();
      const book: Book = {
        ...input,
        id: uid("book"),
        title: input.title.trim() || "My Story",
        author: input.author.trim() || "Anonymous",
        createdAt: now,
        updatedAt: now,
      };
      const chapter: Chapter = {
        id: uid("ch"),
        bookId: book.id,
        title: "Chapter 1",
        body: "",
        sort: 0,
        updatedAt: now,
      };
      mutate((prev) => ({
        ...prev,
        books: [book, ...prev.books],
        chapters: [...prev.chapters, chapter],
        currentBookId: book.id,
        currentChapterId: chapter.id,
      }));
      return { book, chapter };
    },
    [mutate],
  );

  const updateBook = useCallback(
    (id: string, patch: Partial<Book>) => {
      mutate((prev) => ({
        ...prev,
        books: prev.books.map((b) =>
          b.id === id ? { ...b, ...patch, id: b.id, isSample: false, updatedAt: Date.now() } : b,
        ),
      }));
    },
    [mutate],
  );

  const addChapter = useCallback(
    (bookId: string, title?: string) => {
      const siblings = current.current.chapters.filter((c) => c.bookId === bookId);
      const chapter: Chapter = {
        id: uid("ch"),
        bookId,
        title: title?.trim() || `Chapter ${siblings.length + 1}`,
        body: "",
        sort: Math.max(-1, ...siblings.map((c) => c.sort)) + 1,
        updatedAt: Date.now(),
      };
      mutate((prev) => ({
        ...prev,
        chapters: [...prev.chapters, chapter],
        currentBookId: bookId,
        currentChapterId: chapter.id,
      }));
      return chapter;
    },
    [mutate],
  );

  const updateChapter = useCallback(
    (id: string, patch: Partial<Chapter>) => {
      mutate((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) =>
          c.id === id ? { ...c, ...patch, id: c.id, bookId: c.bookId, updatedAt: Date.now() } : c,
        ),
        books: prev.books.map((b) =>
          prev.chapters.some((c) => c.id === id && c.bookId === b.id)
            ? { ...b, updatedAt: Date.now() }
            : b,
        ),
      }));
    },
    [mutate],
  );

  const checkpointChapter = useCallback(
    (id: string) => {
      mutate((prev) => {
        const c = prev.chapters.find((c) => c.id === id);
        if (!c) return prev;
        const revisions = prev.revisions ?? [];
        const latest = revisions.find((r) => r.chapterId === id);
        if (latest?.body === c.body && latest.title === c.title) return prev;
        return {
          ...prev,
          revisions: [
            { id: uid("rev"), chapterId: id, title: c.title, body: c.body, createdAt: Date.now() },
            ...revisions,
          ].filter(
            (r, i, all) => all.slice(0, i).filter((v) => v.chapterId === r.chapterId).length < 20,
          ),
        };
      });
    },
    [mutate],
  );

  const restoreRevision = useCallback(
    (id: string) => {
      const r = current.current.revisions?.find((r) => r.id === id);
      if (!r) return;
      checkpointChapter(r.chapterId);
      updateChapter(r.chapterId, { title: r.title, body: r.body });
    },
    [checkpointChapter, updateChapter],
  );

  const updateDraft = useCallback(
    (draft: DictationDraft | null) => mutate((prev) => ({ ...prev, draft })),
    [mutate],
  );
  const updateSettings = useCallback(
    (patch: Partial<Settings>) =>
      mutate((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })),
    [mutate],
  );

  const commitDraft = useCallback(
    async (destination: "append" | "new") => {
      const draft = current.current.draft;
      if (!draft?.transcript.trim()) return;
      const existing = current.current.chapters.find((c) => c.id === draft.chapterId);
      if (!existing) throw new Error("Please choose a chapter first.");
      checkpointChapter(existing.id);
      mutate((prev) => {
        const siblings = prev.chapters.filter((c) => c.bookId === draft.bookId);
        const target: Chapter =
          destination === "new"
            ? {
                id: uid("ch"),
                bookId: draft.bookId,
                title: `Chapter ${siblings.length + 1}`,
                body: "",
                sort: Math.max(-1, ...siblings.map((c) => c.sort)) + 1,
                updatedAt: Date.now(),
              }
            : existing;
        const updated = {
          ...target,
          body: [target.body, draft.transcript.trim()].filter(Boolean).join("\n\n"),
          updatedAt: Date.now(),
        };
        return {
          ...prev,
          draft: null,
          chapters:
            destination === "new"
              ? [...prev.chapters, updated]
              : prev.chapters.map((c) => (c.id === target.id ? updated : c)),
          sessions: [
            ...prev.sessions,
            {
              ...draft,
              id: uid("sess"),
              chapterId: target.id,
              transcript: draft.originalTranscript ?? draft.transcript,
              createdAt: Date.now(),
            },
          ],
          books: prev.books.map((b) =>
            b.id === draft.bookId ? { ...b, updatedAt: Date.now() } : b,
          ),
          currentBookId: draft.bookId,
          currentChapterId: target.id,
        };
      });
      await flushSave();
    },
    [checkpointChapter, mutate, flushSave],
  );

  const importLibrary = useCallback(
    async ({ state: library, audio }: { state: PersistedState; audio: AudioEntry[] }) => {
      if (current.current.draft && library.draft)
        throw new Error("Keep or finish your current draft before restoring another unfinished draft.");
      for (const { id, blob } of audio) pendingAudio.current.set(id, blob);
      // Importer remaps every id; existing books are never overwritten.
      mutate((prev) => ({
        ...prev,
        books: [...library.books, ...prev.books],
        chapters: [...prev.chapters, ...library.chapters],
        sessions: [...prev.sessions, ...library.sessions],
        revisions: [...(prev.revisions ?? []), ...(library.revisions ?? [])],
        currentBookId: library.currentBookId ?? prev.currentBookId,
        currentChapterId: library.currentChapterId ?? prev.currentChapterId,
        draft: prev.draft ?? library.draft,
      }));
      await flushSave();
    },
    [mutate, flushSave],
  );

  const book = state.books.find((b) => b.id === state.currentBookId) ?? state.books[0] ?? null;
  const chapters = useMemo(
    () => state.chapters.filter((c) => c.bookId === book?.id).sort((a, b) => a.sort - b.sort),
    [state.chapters, book?.id],
  );
  const chapter = chapters.find((c) => c.id === state.currentChapterId) ?? chapters[0] ?? null;
  const sessionsForChapter = useMemo(
    () =>
      state.sessions
        .filter((s) => s.chapterId === chapter?.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.sessions, chapter?.id],
  );
  return (
    <BookContext.Provider
      value={{
        state,
        pendingAudio: Array.from(pendingAudio.current, ([id, blob]) => ({ id, blob })),
        ready,
        loadError,
        saveError,
        saveStatus,
        book,
        chapter,
        chapters,
        sessionsForChapter,
        setCurrent,
        createBook,
        updateBook,
        addChapter,
        updateChapter,
        updateSettings,
        updateDraft,
        commitDraft,
        checkpointChapter,
        restoreRevision,
        importLibrary,
        flushSave,
      }}
    >
      {children}
    </BookContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBook() {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error("useBook must be used within BookProvider");
  return ctx;
}
