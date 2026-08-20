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
  PersistedState,
  PolishLevel,
  Session,
  Settings,
} from "./types";
import { emptyState, loadState, saveAudio, saveState } from "./storage";
import { uid } from "./utils";

type BookContextValue = {
  ready: boolean;
  state: PersistedState;
  book: Book | null;
  chapter: Chapter | null;
  chapters: Chapter[];
  sessionsForChapter: Session[];
  setCurrent: (bookId: string, chapterId?: string | null) => void;
  createBook: (input: {
    title: string;
    author: string;
    kind: BookKind;
    polish: PolishLevel;
    voiceNotes: string;
  }) => { book: Book; chapter: Chapter };
  updateBook: (id: string, patch: Partial<Book>) => void;
  addChapter: (bookId: string, title?: string) => Chapter;
  updateChapter: (id: string, patch: Partial<Chapter>) => void;
  deleteChapter: (id: string) => void;
  addSession: (session: Session, audio?: Blob | null) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
};

const BookContext = createContext<BookContextValue | null>(null);

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch(() => {
        clearTimeout(t);
        resolve(fallback);
      });
  });
}

export function BookProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PersistedState>(emptyState);
  const skipSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    withTimeout(loadState(), 1200, emptyState()).then((loaded) => {
      if (cancelled) return;
      setState(loaded);
      setReady(true);
      skipSave.current = false;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || skipSave.current) return;
    const handle = window.setTimeout(() => {
      void saveState(state);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [state, ready]);

  const mutate = useCallback((fn: (prev: PersistedState) => PersistedState) => {
    setState((prev) => fn(prev));
  }, []);

  const setCurrent = useCallback((bookId: string, chapterId?: string | null) => {
    mutate((prev) => {
      const chapters = prev.chapters
        .filter((c) => c.bookId === bookId)
        .sort((a, b) => a.sort - b.sort);
      const nextChapter =
        chapterId === undefined
          ? (chapters[0]?.id ?? null)
          : chapterId;
      return { ...prev, currentBookId: bookId, currentChapterId: nextChapter };
    });
  }, [mutate]);

  const createBook = useCallback(
    (input: {
      title: string;
      author: string;
      kind: BookKind;
      polish: PolishLevel;
      voiceNotes: string;
    }) => {
      const now = Date.now();
      const book: Book = {
        id: uid("book"),
        title: input.title.trim() || "My Story",
        author: input.author.trim() || "Anonymous",
        kind: input.kind,
        polish: input.polish,
        voiceNotes: input.voiceNotes.trim(),
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
        books: [...prev.books.filter((b) => !b.isSample), book, ...prev.books.filter((b) => b.isSample)],
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
          b.id === id ? { ...b, ...patch, isSample: false, updatedAt: Date.now() } : b,
        ),
      }));
    },
    [mutate],
  );

  const addChapter = useCallback(
    (bookId: string, title?: string) => {
      const siblings = state.chapters.filter((c) => c.bookId === bookId);
      const chapter: Chapter = {
        id: uid("ch"),
        bookId,
        title: title?.trim() || `Chapter ${siblings.length + 1}`,
        body: "",
        sort: siblings.length,
        updatedAt: Date.now(),
      };
      mutate((prev) => ({
        ...prev,
        chapters: [...prev.chapters, chapter],
        currentBookId: bookId,
        currentChapterId: chapter.id,
        books: prev.books.map((b) =>
          b.id === bookId ? { ...b, updatedAt: Date.now() } : b,
        ),
      }));
      return chapter;
    },
    [mutate, state.chapters],
  );

  const updateChapter = useCallback(
    (id: string, patch: Partial<Chapter>) => {
      mutate((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) =>
          c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c,
        ),
      }));
    },
    [mutate],
  );

  const deleteChapter = useCallback(
    (id: string) => {
      mutate((prev) => {
        const target = prev.chapters.find((c) => c.id === id);
        const remaining = prev.chapters.filter((c) => c.id !== id);
        const nextInBook = remaining
          .filter((c) => c.bookId === target?.bookId)
          .sort((a, b) => a.sort - b.sort)[0];
        return {
          ...prev,
          chapters: remaining,
          currentChapterId:
            prev.currentChapterId === id
              ? (nextInBook?.id ?? null)
              : prev.currentChapterId,
        };
      });
    },
    [mutate],
  );

  const addSession = useCallback(
    async (session: Session, audio?: Blob | null) => {
      if (audio) {
        try {
          await saveAudio(session.audioId || session.id, audio);
        } catch {
          session = { ...session, audioId: null };
        }
      }
      mutate((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
    },
    [mutate],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      mutate((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    },
    [mutate],
  );

  const book = state.books.find((b) => b.id === state.currentBookId) ?? null;
  const chapters = useMemo(
    () =>
      state.chapters
        .filter((c) => c.bookId === state.currentBookId)
        .sort((a, b) => a.sort - b.sort),
    [state.chapters, state.currentBookId],
  );
  const chapter = chapters.find((c) => c.id === state.currentChapterId) ?? chapters[0] ?? null;
  const sessionsForChapter = useMemo(
    () =>
      state.sessions
        .filter((s) => s.chapterId === chapter?.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.sessions, chapter?.id],
  );

  const value = useMemo<BookContextValue>(
    () => ({
      ready,
      state,
      book,
      chapter,
      chapters,
      sessionsForChapter,
      setCurrent,
      createBook,
      updateBook,
      addChapter,
      updateChapter,
      deleteChapter,
      addSession,
      updateSettings,
    }),
    [
      ready,
      state,
      book,
      chapter,
      chapters,
      sessionsForChapter,
      setCurrent,
      createBook,
      updateBook,
      addChapter,
      updateChapter,
      deleteChapter,
      addSession,
      updateSettings,
    ],
  );

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

export function useBook() {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error("useBook must be used within BookProvider");
  return ctx;
}
