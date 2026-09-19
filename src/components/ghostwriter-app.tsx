import { useMemo, useState } from "react";
import {
  BookOpen,
  Download,
  Feather,
  History,
  Mic,
  MoreHorizontal,
  Printer,
  Settings,
  ShieldCheck,
  Share,
  Smartphone,
  Type,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WelcomeFlow } from "@/components/welcome-flow";
import { TalkFlow } from "@/components/talk-flow";
import { ManuscriptPage } from "@/components/manuscript-page";
import { ListenBar } from "@/components/listen-bar";
import { useBook } from "@/lib/book-store";
import { shareFile } from "@/lib/share-file";
import { downloadText, wordCount } from "@/lib/utils";
import { KIND_LABEL, POLISH_LABEL, type AppMode, type TypeSize } from "@/lib/types";
import { SignedIn, UserButton } from "@/lib/auth/gates";
import { toast } from "sonner";
import { Modal } from "./ui/modal";
import { LibraryTools } from "./library-tools";
import { BookCover } from "./book-cover";
import { PhoneSetup } from "./phone-setup";
import { useOfflineRoom } from "@/lib/use-offline-room";

export function GhostwriterApp() {
  const {
    ready,
    loadError,
    saveError,
    saveStatus,
    flushSave,
    checkpointChapter,
    restoreRevision,
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
  const [backupsOpen, setBackupsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [booksOpen, setBooksOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const { status: offlineStatus, offline } = useOfflineRoom();
  const sessionOpen = talkOpen || typeOpen;

  const sizeClass =
    state.settings.typeSize === "xlarge"
      ? "size-xlarge"
      : state.settings.typeSize === "comfortable"
        ? "size-comfortable"
        : "size-large";

  const totalWords = useMemo(() => chapters.reduce((n, c) => n + wordCount(c.body), 0), [chapters]);

  if (!ready)
    return (
      <main className="mx-auto max-w-xl space-y-5 px-5 py-16">
        <h1 className="font-serif text-3xl">
          {loadError ? "Your books need attention" : "Opening your books…"}
        </h1>
        <p role={loadError ? "alert" : "status"} className="text-lg text-ink-soft">
          {loadError ?? "Waiting for this browser’s saved library."}
        </p>
        {loadError && <Button onClick={() => window.location.reload()}>Try opening again</Button>}
      </main>
    );

  if (mode === "welcome" && !state.books.some((b) => !b.isSample)) {
    return <WelcomeFlow offlineStatus={offlineStatus} onEnterDesk={() => setMode("desk")} />;
  }

  function printNow() {
    window.print();
  }

  function saveCopy(share = false) {
    if (!book) return;
    const parts = [
      book.title,
      `by ${book.author}`,
      "",
      ...chapters.flatMap((c) => [`${c.title}`, "", c.body.trim(), "", ""]),
    ];
    const slug = book.title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "book";
    if (share) {
      void shareFile(new File([parts.join("\n")], `${slug}.txt`, { type: "text/plain" }))
        .then((result) => {
          if (result !== "cancelled")
            toast(
              result === "shared"
                ? "Book handed to the share sheet."
                : "A copy of the book is in your downloads.",
            );
        })
        .catch((error) => toast.error(error.message));
      return;
    }
    downloadText(`${slug}.txt`, parts.join("\n"));
    toast("A copy of the book is in your downloads.");
  }

  const shelf = (
    <div className="space-y-5">
      {book && (
        <BookCover
          title={book.title}
          author={book.author}
          detail={`${chapters.length} ${chapters.length === 1 ? "chapter" : "chapters"} · ${totalWords} words`}
        />
      )}
      <label className="block space-y-2">
        <span className="text-base font-bold text-ink-soft">Your books</span>
        <select
          aria-label="Your books"
          value={book?.id ?? ""}
          onChange={(e) => {
            setCurrent(e.target.value);
            setEditingPage(false);
          }}
          className="h-14 w-full min-w-0 rounded-md border border-rule bg-paper px-3 text-lg"
        >
          {state.books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
              {b.isSample ? " (sample)" : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="rounded-[24px] border border-rule bg-paper-deep/40 p-4">
        <p className="text-sm font-bold tracking-[0.16em] text-ink-faint uppercase">Chapters</p>
        <ul className="mt-3 space-y-1">
          {chapters.map((c) => {
            const active = c.id === chapter?.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    if (book) setCurrent(book.id, c.id);
                    setEditingPage(false);
                    setBooksOpen(false);
                  }}
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
            Talk. We write. You read, listen, or print. Fix anything on the page if we missed a
            word.
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
    </div>
  );

  return (
    <div className={`writing-room paper-grain min-h-dvh ${sizeClass}`}>
      <header className="room-header no-print sticky top-0 z-20 border-b border-rule bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={sessionOpen}
              onClick={() => setMode("desk")}
              className="flex items-center gap-2"
            >
              <img src="/favicon.svg" alt="" className="brand-mark" />
              <span className="font-serif text-xl text-ink">Ghostwriter</span>
            </button>
            <div className="desktop-tools flex flex-wrap items-center justify-end gap-2">
              <Button
                size="md"
                variant={mode === "read" ? "primary" : "secondary"}
                disabled={sessionOpen}
                onClick={() => setMode(mode === "read" ? "desk" : "read")}
              >
                <BookOpen className="size-4" />
                {mode === "read" ? "Write" : "Read"}
              </Button>
              <Button size="md" variant="secondary" onClick={printNow}>
                <Printer className="size-4" />
                Print
              </Button>
              <Link
                to="/start"
                onClick={(e) => {
                  if (sessionOpen) {
                    e.preventDefault();
                    toast("Keep this draft for later before opening the guide.");
                  }
                }}
              >
                <Button size="md" variant="quiet">
                  Guide
                </Button>
              </Link>
              <Button
                size="md"
                variant="secondary"
                disabled={sessionOpen}
                onClick={() => setBackupsOpen(true)}
              >
                <Download className="size-4" />
                Backups
              </Button>
              <Button
                size="md"
                variant="quiet"
                disabled={sessionOpen}
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
            <div className="phone-header-tools">
              <Button
                size="md"
                variant="quiet"
                disabled={sessionOpen}
                onClick={() => setMode(mode === "read" ? "desk" : "read")}
              >
                {mode === "read" ? "Write" : "Read"}
              </Button>
              <Button
                size="md"
                variant="quiet"
                aria-label="More options"
                disabled={sessionOpen}
                onClick={() => setMoreOpen(true)}
              >
                <MoreHorizontal />
              </Button>
            </div>
          </div>
          {book ? (
            <p className="desktop-book-line mt-1 truncate text-base text-ink-soft">
              {book.title}
              <span aria-hidden="true"> · </span>
              {book.author}
              {totalWords ? ` · ${totalWords} words` : ""}
            </p>
          ) : null}
        </div>
      </header>

      <div className="no-print mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 pt-4 text-base sm:px-6">
        <p className="flex items-center gap-2 font-bold text-moss">
          <ShieldCheck className="size-5" />
          Private dictation
        </p>
        <p role="status" aria-live="polite" className="text-ink-soft">
          {saveStatus === "saved"
            ? "Saved on this device"
            : saveStatus === "saving"
              ? "Saving your words…"
              : "Changes need saving"}
        </p>
      </div>
      {offline && (
        <p
          role="status"
          className="no-print mx-auto mt-4 max-w-4xl rounded-md border border-rule bg-paper-deep p-4"
        >
          You’re offline. Your words still save on this device. Dictation needs its speech files
          downloaded beforehand.
        </p>
      )}
      {saveError && (
        <div
          role="alert"
          className="no-print mx-auto mt-4 max-w-4xl space-y-3 rounded-lg border border-rule bg-paper-deep p-5"
        >
          <p>{saveError}</p>
          <div className="flex flex-wrap gap-3">
            <Button size="md" onClick={() => setBackupsOpen(true)}>
              Download a backup now
            </Button>
            <Button size="md" variant="secondary" onClick={() => void flushSave().catch(() => {})}>
              Retry saving
            </Button>
          </div>
        </div>
      )}
      {state.draft && !sessionOpen && (
        <div className="no-print mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-lg border border-rule bg-paper-deep/50 p-5">
          <p>You have an unfinished passage. Your words are waiting.</p>
          <Button
            size="md"
            onClick={() => {
              if (state.draft) setCurrent(state.draft.bookId, state.draft.chapterId);
              setMode("desk");
              setTypeOpen(true);
            }}
          >
            Continue my draft
          </Button>
        </div>
      )}

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
        <div className="desk-grid no-print mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[18rem_minmax(0,1fr)] sm:px-6">
          <aside className="writing-shelf no-print min-w-0" inert={sessionOpen}>
            {shelf}
          </aside>

          <main className="min-w-0 space-y-5">
            {book?.isSample ? (
              <div className="no-print flex flex-col gap-3 rounded-[24px] border border-rule bg-paper-deep/50 px-5 py-4 text-lg text-ink sm:flex-row sm:items-center sm:justify-between">
                <p>
                  This is a sample, so you can try Read, Listen, and Print before you speak a word.
                </p>
                <Button
                  size="md"
                  onClick={() => {
                    createBook({
                      title: "My Story",
                      author: "Author",
                      kind: "memoir",
                      polish: "faithful",
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
              <section className="recording-panel no-print rounded-lg border border-rule bg-paper p-5 sm:p-8">
                <TalkFlow
                  startInType={typeOpen && !talkOpen}
                  onClose={() => {
                    setTalkOpen(false);
                    setTypeOpen(false);
                  }}
                />
              </section>
            ) : (
              <section className="story-console no-print">
                <div className="story-console-heading">
                  <div>
                    <p className="room-eyebrow">Your writing room</p>
                    <h1 className="console-title">{book?.title || "Your book"}</h1>
                    <p className="console-chapter">
                      {chapter?.title} <span aria-hidden="true">·</span>{" "}
                      {totalWords.toLocaleString()} words so far
                    </p>
                  </div>
                  <div className="writing-actions">
                    <Button
                      className="talk-button"
                      size="xl"
                      disabled={!chapter}
                      onClick={() => {
                        if (state.draft) setCurrent(state.draft.bookId, state.draft.chapterId);
                        setEditingPage(false);
                        setTalkOpen(true);
                      }}
                    >
                      <span className="talk-medallion">
                        <Mic aria-hidden="true" />
                      </span>
                      <span>
                        Talk
                        <span className="talk-hint" aria-hidden="true">
                          Tell the next part of your story
                        </span>
                      </span>
                    </Button>
                    <Button
                      className="type-button"
                      size="lg"
                      variant="secondary"
                      disabled={!chapter}
                      onClick={() => {
                        if (state.draft) setCurrent(state.draft.bookId, state.draft.chapterId);
                        setEditingPage(false);
                        setTypeOpen(true);
                      }}
                    >
                      Type instead
                    </Button>
                  </div>
                </div>
                <div className="console-listen">
                  <ListenBar />
                </div>
              </section>
            )}

            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="page-tool text-base text-moss underline-offset-4 hover:underline"
                disabled={sessionOpen}
                onClick={() => {
                  if (!editingPage && chapter) checkpointChapter(chapter.id);
                  setEditingPage((v) => !v);
                }}
              >
                {editingPage ? "Done editing the page" : "Edit the page myself"}
              </button>
              <Button
                size="md"
                variant="quiet"
                disabled={sessionOpen}
                onClick={() => setHistoryOpen(true)}
              >
                <History className="size-4" />
                Page history
              </Button>
              <button
                type="button"
                className="page-tool text-base text-ink-soft underline-offset-4 hover:underline"
                onClick={() => saveCopy()}
              >
                Save a text copy
              </button>
              <Button size="md" variant="quiet" onClick={() => saveCopy(true)}>
                <Share className="size-4" />
                Share book
              </Button>
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
              <Field label="Optional online writing style">
                <p className="mb-2 text-base text-ink-soft">{POLISH_LABEL[book.polish]}</p>
                <div className="grid gap-2">
                  {(["faithful", "light", "literary"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={book.polish === p}
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
                      aria-pressed={state.settings.typeSize === id}
                      onClick={() => updateSettings({ typeSize: id })}
                    >
                      <Type className="size-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </Field>
              <Button
                size="md"
                variant="secondary"
                onClick={() => {
                  setSettingsOpen(false);
                  setPhoneOpen(true);
                }}
              >
                <Smartphone className="size-5" />
                Set up on iPhone
              </Button>
              <p className="text-base text-ink-faint">
                This is a {KIND_LABEL[book.kind].toLowerCase()}. Your library is saved in this
                browser. Private dictation processes audio on your device. Optional online writing
                help sends text only after you agree.
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
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {helpOpen ? (
        <Modal title="How this works" onClose={() => setHelpOpen(false)}>
          <ol className="space-y-4 text-lg leading-relaxed text-ink-soft">
            <li>
              <strong className="text-ink">Talk.</strong> Press the green button and tell a memory
              the way you would tell a friend.
            </li>
            <li>
              <strong className="text-ink">We write.</strong> You will see the words. Fix anything
              we heard wrong, then put them in the book.
            </li>
            <li>
              <strong className="text-ink">Read.</strong> Use Read for a quiet page with large type.
            </li>
            <li>
              <strong className="text-ink">Listen or print.</strong> Listen reads the page aloud.
              Print opens this device’s print options.
            </li>
            <li>
              <strong className="text-ink">Keep a paper guide.</strong>{" "}
              <Link to="/start" className="text-moss underline-offset-4 hover:underline">
                Print the one-page getting-started sheet
              </Link>{" "}
              and keep it nearby.
            </li>
          </ol>
        </Modal>
      ) : null}

      {backupsOpen && (
        <Modal title="Back up your books" onClose={() => setBackupsOpen(false)}>
          <LibraryTools />
        </Modal>
      )}
      {historyOpen && (
        <Modal title="Page history & original words" onClose={() => setHistoryOpen(false)}>
          <div className="space-y-5">
            <p className="text-lg text-ink-soft">
              Previous pages are kept before dictation and editing. Restoring a page also keeps the
              current version here.
            </p>
            {(state.revisions ?? [])
              .filter(
                (r) =>
                  r.chapterId === chapter?.id &&
                  (r.body !== chapter.body || r.title !== chapter.title),
              )
              .map((r) => (
                <details key={r.id} className="rounded-lg border border-rule p-4">
                  <summary className="cursor-pointer">
                    {new Date(r.createdAt).toLocaleString()} · {wordCount(r.body)} words
                  </summary>
                  <p className="my-4 whitespace-pre-wrap">{r.body || "Empty page"}</p>
                  <Button
                    size="md"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Restore this earlier page? The current page will also be kept in history.",
                        )
                      ) {
                        restoreRevision(r.id);
                        setHistoryOpen(false);
                      }
                    }}
                  >
                    Restore this page
                  </Button>
                </details>
              ))}
            {!(state.revisions ?? []).some(
              (r) =>
                r.chapterId === chapter?.id &&
                (r.body !== chapter.body || r.title !== chapter.title),
            ) && <p>No earlier page versions yet.</p>}
            <h3 className="font-serif text-2xl">Original passages</h3>
            {state.sessions
              .filter((s) => s.chapterId === chapter?.id)
              .map((s) => (
                <details key={s.id} className="rounded-lg border border-rule p-4">
                  <summary className="cursor-pointer">
                    {new Date(s.createdAt).toLocaleString()} · {wordCount(s.transcript)} words
                  </summary>
                  <p className="mt-4 whitespace-pre-wrap">{s.transcript}</p>
                </details>
              ))}
          </div>
        </Modal>
      )}
      <nav className="phone-nav no-print" aria-label="Writing room navigation">
        <button
          type="button"
          disabled={sessionOpen}
          aria-current={mode !== "read" ? "page" : undefined}
          onClick={() => {
            setMode("desk");
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        >
          <Feather aria-hidden="true" />
          <span>Write</span>
        </button>
        <button type="button" disabled={sessionOpen} onClick={() => setBooksOpen(true)}>
          <BookOpen aria-hidden="true" />
          <span>Books</span>
        </button>
        <button type="button" disabled={sessionOpen} onClick={() => setBackupsOpen(true)}>
          <ShieldCheck aria-hidden="true" />
          <span>Keep safe</span>
        </button>
      </nav>
      {booksOpen && (
        <Modal title="Your library" onClose={() => setBooksOpen(false)}>
          {shelf}
          <Button className="mt-5 w-full" onClick={() => setBooksOpen(false)}>
            Back to writing
          </Button>
        </Modal>
      )}
      {moreOpen && (
        <Modal title="Your writing room" onClose={() => setMoreOpen(false)}>
          <div className="grid gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setMoreOpen(false);
                setSettingsOpen(true);
              }}
            >
              <Settings />
              Settings
            </Button>
            <Button variant="secondary" onClick={printNow}>
              <Printer />
              Print this book
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMoreOpen(false);
                setPhoneOpen(true);
              }}
            >
              <Smartphone />
              Set up on iPhone
            </Button>
            <Link to="/start" className="page-tool text-center underline">
              Getting-started guide
            </Link>
          </div>
        </Modal>
      )}
      {phoneOpen && (
        <Modal title="Ghostwriter on your iPhone" onClose={() => setPhoneOpen(false)}>
          <PhoneSetup offlineStatus={offlineStatus} />
        </Modal>
      )}
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
          <div className="print-prose mt-8 space-y-5 font-serif leading-[1.65]">
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
        className="min-w-0 max-w-full h-12 rounded-[14px] border border-rule bg-paper px-3 text-lg outline-none focus:border-moss"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-base font-bold text-ink">{label}</span>
      {children}
    </label>
  );
}
