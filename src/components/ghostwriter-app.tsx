import { useMemo, useState } from "react";
import { BookOpen, Feather, Mic, Printer, Settings, Type } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WelcomeFlow } from "@/components/welcome-flow";
import { TalkFlow } from "@/components/talk-flow";
import { ManuscriptPage } from "@/components/manuscript-page";
import { ListenBar } from "@/components/listen-bar";
import { useBook } from "@/lib/book-store";
import { downloadText, wordCount } from "@/lib/utils";
import { KIND_LABEL, POLISH_LABEL, type AppMode, type TypeSize } from "@/lib/types";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { toast } from "sonner";

export function GhostwriterApp() {
  const {
    book,
    chapter,
    chapters,
    state,
    setCurrent,
    addChapter,
    updateChapter,
    updateBook,
    updateSettings,
    createBook,
  } = useBook();
  const [mode, setMode] = useState<AppMode>("welcome");
  const [talkOpen, setTalkOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const sizeClass =
    state.settings.typeSize === "xlarge"
      ? "size-xlarge"
      : state.settings.typeSize === "comfortable"
        ? "size-comfortable"
        : "size-large";

  const totalWords = useMemo(
    () => chapters.reduce((n, c) => n + wordCount(c.body), 0),
    [chapters],
  );

  if (mode === "welcome" && !state.books.some((b) => !b.isSample)) {
    return <WelcomeFlow onEnterDesk={() => setMode("desk")} />;
  }

  function printNow() {
    window.print();
  }

  function saveCopy() {
    if (!book) return;
    const parts = [
      book.title,
      `by ${book.author}`,
      "",
      ...chapters.flatMap((c) => [`${c.title}`, "", c.body.trim(), "", ""]),
    ];
    const slug = book.title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "book";
    downloadText(`${slug}.txt`, parts.join("\n"));
    toast("A copy of the book is in your downloads.");
  }

  return (
    <div className={`paper-grain min-h-dvh ${sizeClass}`}>
      <header className="no-print sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMode("desk")}
              className="flex items-center gap-2"
            >
              <Feather className="size-5 text-moss" />
              <span className="font-serif text-xl text-ink">Ghostwriter</span>
            </button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                size="md"
                variant={mode === "read" ? "primary" : "secondary"}
                onClick={() => setMode(mode === "read" ? "desk" : "read")}
              >
                <BookOpen className="size-4" />
                {mode === "read" ? "Write" : "Read"}
              </Button>
              <Button size="md" variant="secondary" onClick={printNow}>
                <Printer className="size-4" />
                Print
              </Button>
              <Link to="/start">
                <Button size="md" variant="quiet">
                  Guide
                </Button>
              </Link>
              <Button
                size="md"
                variant="quiet"
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
              >
                <Settings className="size-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
          {book ? (
            <p className="mt-1 truncate text-base text-ink-soft">
              {book.title}
              <span aria-hidden="true"> · </span>
              {book.author}
              {totalWords ? ` · ${totalWords} words` : ""}
            </p>
          ) : null}
        </div>
      </header>

      {mode === "read" ? (
        <div className="no-print mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="no-print mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ChapterPicker
              chapters={chapters}
              currentId={chapter?.id}
              onPick={(id) => book && setCurrent(book.id, id)}
            />
            <ListenBar />
          </div>
          <div className="print:hidden">
            <ManuscriptPage readMode />
          </div>
          <div className="no-print mt-10 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={!chapter || chapters[0]?.id === chapter.id}
              onClick={() => {
                const i = chapters.findIndex((c) => c.id === chapter?.id);
                if (i > 0 && book) setCurrent(book.id, chapters[i - 1].id);
              }}
            >
              Previous chapter
            </Button>
            <Button
              variant="secondary"
              disabled={!chapter || chapters.at(-1)?.id === chapter.id}
              onClick={() => {
                const i = chapters.findIndex((c) => c.id === chapter?.id);
                if (i >= 0 && i < chapters.length - 1 && book)
                  setCurrent(book.id, chapters[i + 1].id);
              }}
            >
              Next chapter
            </Button>
          </div>
        </div>
      ) : (
        <div className="no-print mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[18rem_minmax(0,1fr)] sm:px-6">
          <aside className="no-print space-y-4">
            <div className="rounded-[24px] border border-rule bg-paper-deep/40 p-4">
              <p className="text-sm font-bold tracking-[0.16em] text-ink-faint uppercase">
                Chapters
              </p>
              <ul className="mt-3 space-y-1">
                {chapters.map((c) => {
                  const active = c.id === chapter?.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => book && setCurrent(book.id, c.id)}
                        className={`w-full rounded-[14px] px-3 py-3 text-left text-lg ${
                          active ? "bg-paper text-ink" : "text-ink-soft hover:bg-paper/70"
                        }`}
                      >
                        <span className="block truncate font-bold">{c.title}</span>
                        <span className="block text-sm text-ink-faint">
                          {wordCount(c.body) ? `${wordCount(c.body)} words` : "Empty"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button
                size="md"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => book && addChapter(book.id)}
              >
                New chapter
              </Button>
            </div>
            {!state.settings.helpDismissed ? (
              <div className="rounded-[24px] border border-rule bg-paper p-4 text-base leading-relaxed text-ink-soft">
                <p className="font-bold text-ink">How this works</p>
                <p className="mt-2">
                  Talk. We write. You read, listen, or print. Fix anything on the
                  page if we missed a word.
                </p>
                <button
                  type="button"
                  className="mt-3 text-moss underline-offset-4 hover:underline"
                  onClick={() => updateSettings({ helpDismissed: true })}
                >
                  Hide this
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="text-base text-ink-faint underline-offset-4 hover:underline"
                onClick={() => setHelpOpen(true)}
              >
                How this works
              </button>
            )}
          </aside>

          <main className="space-y-5">
            {book?.isSample ? (
              <div className="no-print flex flex-col gap-3 rounded-[24px] border border-rule bg-paper-deep/50 px-5 py-4 text-lg text-ink sm:flex-row sm:items-center sm:justify-between">
                <p>
                  This is a sample, so you can try Read, Listen, and Print before
                  you speak a word.
                </p>
                <Button
                  size="md"
                  onClick={() => {
                    createBook({
                      title: "My Story",
                      author: "Author",
                      kind: "memoir",
                      polish: "light",
                      voiceNotes: "",
                    });
                    setSettingsOpen(true);
                    toast("Your book is open. Put your name on the title page.");
                  }}
                >
                  Start my book
                </Button>
              </div>
            ) : null}

            {talkOpen || typeOpen ? (
              <section className="no-print rounded-[28px] border border-rule bg-paper p-6 sm:p-8">
                <TalkFlow
                  startInType={typeOpen && !talkOpen}
                  onClose={() => {
                    setTalkOpen(false);
                    setTypeOpen(false);
                  }}
                />
              </section>
            ) : (
              <section className="no-print rounded-[28px] border border-rule bg-paper p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-serif text-2xl text-ink">
                      {chapter ? chapter.title : "Your book"}
                    </p>
                    <p className="text-base text-ink-soft">
                      Press Talk and tell the next memory. Or type, if you'd rather.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button size="xl" onClick={() => setTalkOpen(true)}>
                      <Mic className="size-6" />
                      Talk
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => setTypeOpen(true)}
                    >
                      Type instead
                    </Button>
                  </div>
                </div>
                <div className="mt-5">
                  <ListenBar />
                </div>
              </section>
            )}

            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="text-base text-moss underline-offset-4 hover:underline"
                onClick={() => setEditingPage((v) => !v)}
              >
                {editingPage ? "Done editing the page" : "Edit the page myself"}
              </button>
              <button
                type="button"
                className="text-base text-ink-faint underline-offset-4 hover:underline"
                onClick={saveCopy}
              >
                Save a text copy
              </button>
            </div>

            <div className="print:hidden">
              <ManuscriptPage editable={editingPage} />
            </div>
          </main>
        </div>
      )}

      {settingsOpen ? (
        <Modal title="Settings" onClose={() => setSettingsOpen(false)}>
          {book ? (
            <div className="space-y-6">
              <Field label="Book title">
                <input
                  value={book.title}
                  onChange={(e) => updateBook(book.id, { title: e.target.value })}
                  className="h-14 w-full rounded-[16px] border border-rule bg-paper px-4 text-lg outline-none focus:border-moss"
                />
              </Field>
              <Field label="Author name on the title page">
                <input
                  value={book.author}
                  onChange={(e) => updateBook(book.id, { author: e.target.value })}
                  className="h-14 w-full rounded-[16px] border border-rule bg-paper px-4 text-lg outline-none focus:border-moss"
                />
              </Field>
              {chapter ? (
                <Field label="This chapter’s title">
                  <input
                    value={chapter.title}
                    onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
                    className="h-14 w-full rounded-[16px] border border-rule bg-paper px-4 text-lg outline-none focus:border-moss"
                  />
                </Field>
              ) : null}
              <Field label="How we treat your words">
                <p className="mb-2 text-base text-ink-soft">{POLISH_LABEL[book.polish]}</p>
                <div className="grid gap-2">
                  {(["faithful", "light", "literary"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateBook(book.id, { polish: p })}
                      className={`rounded-[14px] border px-4 py-3 text-left ${
                        book.polish === p ? "border-moss bg-paper-deep" : "border-rule"
                      }`}
                    >
                      {POLISH_LABEL[p]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Notes about your voice (optional)">
                <textarea
                  value={book.voiceNotes}
                  onChange={(e) => updateBook(book.id, { voiceNotes: e.target.value })}
                  rows={3}
                  placeholder="I say y’all. I grew up in Kentucky. Don’t make me sound fancy."
                  className="w-full rounded-[16px] border border-rule bg-paper px-4 py-3 text-lg outline-none focus:border-moss"
                />
              </Field>
              <Field label="Print and reading size">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["comfortable", "Comfortable"],
                      ["large", "Large"],
                      ["xlarge", "Extra large"],
                    ] as [TypeSize, string][]
                  ).map(([id, label]) => (
                    <Button
                      key={id}
                      size="md"
                      variant={state.settings.typeSize === id ? "primary" : "secondary"}
                      onClick={() => updateSettings({ typeSize: id })}
                    >
                      <Type className="size-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </Field>
              <p className="text-base text-ink-faint">
                This is a {KIND_LABEL[book.kind].toLowerCase()}. Words stay on this
                computer unless you print them or save a copy.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={() => {
                    createBook({
                      title: "My Story",
                      author: book.author,
                      kind: book.kind,
                      polish: book.polish,
                      voiceNotes: book.voiceNotes,
                    });
                    setSettingsOpen(false);
                    setMode("desk");
                    toast("A fresh book is open.");
                  }}
                >
                  Start another book
                </Button>
                <SignedOut>
                  <a
                    href="/login"
                    className="inline-flex h-16 items-center justify-center rounded-[18px] px-7 text-lg text-ink-soft underline-offset-4 hover:underline"
                  >
                    Optional: sign in for a named backup
                  </a>
                </SignedOut>
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {helpOpen ? (
        <Modal title="How this works" onClose={() => setHelpOpen(false)}>
          <ol className="space-y-4 text-lg leading-relaxed text-ink-soft">
            <li>
              <strong className="text-ink">Talk.</strong> Press the green button
              and tell a memory the way you would tell a friend.
            </li>
            <li>
              <strong className="text-ink">We write.</strong> You will see the
              words. Fix anything we heard wrong, then put them in the book.
            </li>
            <li>
              <strong className="text-ink">Read.</strong> Use Read for a quiet
              page with large type.
            </li>
            <li>
              <strong className="text-ink">Listen or print.</strong> Listen reads
              the page aloud. Print uses the printer already on this computer.
            </li>
            <li>
              <strong className="text-ink">Keep a paper guide.</strong>{" "}
              <Link to="/start" className="text-moss underline-offset-4 hover:underline">
                Print the one-page getting-started sheet
              </Link>{" "}
              and leave it beside the laptop.
            </li>
          </ol>
        </Modal>
      ) : null}

      <PrintBook />
    </div>
  );
}

function PrintBook() {
  const { book, chapters } = useBook();
  if (!book) return null;
  return (
    <div className="print-only mx-auto max-w-3xl bg-white text-black">
      <section className="flex min-h-[80vh] flex-col items-center justify-center text-center">
        <p className="text-sm tracking-[0.25em] uppercase">Ghostwriter</p>
        <h1 className="mt-8 font-serif text-5xl leading-tight">{book.title}</h1>
        <p className="mt-6 font-serif text-2xl">{book.author}</p>
      </section>
      {chapters.map((c) => (
        <section key={c.id} className="break-before-page py-4">
          <h2 className="font-serif text-3xl">{c.title}</h2>
          <div className="mt-8 space-y-5 font-serif text-[14pt] leading-[1.65]">
            {(c.body.trim() || " ").split(/\n{2,}/).map((para, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {para.trim()}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ChapterPicker({
  chapters,
  currentId,
  onPick,
}: {
  chapters: { id: string; title: string }[];
  currentId?: string;
  onPick: (id: string) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-lg">
      <span className="text-ink-soft">Chapter</span>
      <select
        value={currentId}
        onChange={(e) => onPick(e.target.value)}
        className="h-12 rounded-[14px] border border-rule bg-paper px-3 text-lg outline-none focus:border-moss"
      >
        {chapters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="no-print fixed inset-0 z-40 grid place-items-end bg-ink/40 p-3 sm:place-items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90dvh] w-full max-w-xl overflow-auto rounded-[28px] bg-paper p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-serif text-3xl text-ink">{title}</h2>
          <Button size="md" variant="quiet" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-base font-bold text-ink">{label}</span>
      {children}
    </label>
  );
}
