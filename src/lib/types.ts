export type PolishLevel = "faithful" | "light" | "literary";
export type BookKind = "memoir" | "family" | "novel" | "other";
export type TypeSize = "comfortable" | "large" | "xlarge";
export type AppMode = "welcome" | "desk" | "read";

export interface Book {
  id: string;
  title: string;
  author: string;
  kind: BookKind;
  polish: PolishLevel;
  voiceNotes: string;
  isSample?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  body: string;
  sort: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  bookId: string;
  chapterId: string;
  transcript: string;
  audioId: string | null;
  durationMs: number;
  createdAt: number;
}

export interface Settings {
  typeSize: TypeSize;
  helpDismissed: boolean;
}

export interface PersistedState {
  books: Book[];
  chapters: Chapter[];
  sessions: Session[];
  currentBookId: string | null;
  currentChapterId: string | null;
  settings: Settings;
}

export const KIND_LABEL: Record<BookKind, string> = {
  memoir: "A life story",
  family: "Family stories",
  novel: "A novel",
  other: "Something else",
};

export const POLISH_LABEL: Record<PolishLevel, string> = {
  faithful: "Keep my words",
  light: "Clean them up a little",
  literary: "Shape them into chapters",
};

export const POLISH_HELP: Record<PolishLevel, string> = {
  faithful:
    "We add punctuation and paragraphs. Your sentences stay as you said them.",
  light:
    "We fix false starts and speech-to-text mistakes, and make the paragraphs easy to read. It still sounds like you.",
  literary:
    "We turn rambling talk into a clear chapter, keeping your voice, humor, and the way you tell a story. We do not invent facts.",
};
