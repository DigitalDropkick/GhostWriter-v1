import { useBook } from "@/lib/book-store";
import { formatLongDate, wordCount } from "@/lib/utils";

export function ManuscriptPage({
  readMode = false,
  editable = false,
}: {
  readMode?: boolean;
  editable?: boolean;
}) {
  const { book, chapter, updateChapter } = useBook();
  if (!book || !chapter) {
    return (
      <div className="manuscript-sheet rounded-[28px] px-8 py-16 text-center text-xl text-ink-soft">
        This book has no chapters yet.
      </div>
    );
  }

  const empty = !chapter.body.trim();

  return (
    <article
      className={`manuscript-sheet mx-auto w-full rounded-[28px] ${
        readMode ? "max-w-3xl px-8 py-12 sm:px-14 sm:py-16" : "max-w-3xl px-7 py-10 sm:px-12 sm:py-12"
      }`}
    >
      <header className="border-b border-rule pb-6 print-header">
        <p className="text-sm font-bold tracking-[0.2em] text-ink-faint uppercase">
          {book.title}
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight text-ink sm:text-4xl">
          {chapter.title}
        </h1>
        <p className="mt-3 text-base text-ink-soft">
          {book.author}
          <span aria-hidden="true"> · </span>
          {wordCount(chapter.body)} words
          <span aria-hidden="true"> · </span>
          {formatLongDate(chapter.updatedAt)}
        </p>
      </header>

      {editable ? (
        <textarea
          value={chapter.body}
          onChange={(e) => updateChapter(chapter.id, { body: e.target.value, title: chapter.title })}
          placeholder="The page is empty. Press Talk, and we will write what you say here."
          className="mt-8 min-h-[28rem] w-full resize-y bg-transparent font-serif leading-[1.7] text-ink outline-none"
          style={{ fontSize: "var(--page-size, 1.4rem)" }}
        />
      ) : empty ? (
        <p
          className="mt-10 font-serif italic text-ink-faint"
          style={{ fontSize: "var(--page-size, 1.4rem)" }}
        >
          The page is empty. Press Talk, and we will write what you say here.
        </p>
      ) : (
        <div
          className="mt-8 space-y-6 font-serif leading-[1.7] text-ink"
          style={{ fontSize: "var(--page-size, 1.4rem)" }}
        >
          {chapter.body.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {para.trim()}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
