import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useBook } from "@/lib/book-store";
import {
  KIND_LABEL,
  POLISH_HELP,
  POLISH_LABEL,
  type BookKind,
  type PolishLevel,
} from "@/lib/types";
import { Feather, Mic } from "lucide-react";

const KINDS: BookKind[] = ["memoir", "family", "novel", "other"];
const POLISH: PolishLevel[] = ["faithful", "light", "literary"];

export function WelcomeFlow({ onEnterDesk }: { onEnterDesk: () => void }) {
  const { createBook, setCurrent, state } = useBook();
  const [step, setStep] = useState(0);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<BookKind>("memoir");
  const [polish, setPolish] = useState<PolishLevel>("light");

  const sample = state.books.find((b) => b.isSample);

  function finish() {
    createBook({
      title: title || "My Story",
      author: author || "Anonymous",
      kind,
      polish,
      voiceNotes: "",
    });
    onEnterDesk();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-start px-5 py-10 sm:px-8 sm:py-14">
      {step === 0 ? (
        <div className="space-y-10">
          <div className="space-y-4">
            <p className="text-sm font-bold tracking-[0.22em] text-moss uppercase">
              Ghostwriter
            </p>
            <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
              Speak your story.
              <br />
              We'll set it on the page in your voice.
            </h1>
            <p className="max-w-xl text-xl leading-relaxed text-ink-soft">
              Talk the way you talk. We listen, write it down, turn it into a
              book you can read, hear, and print — without you having to type.
            </p>
          </div>
          <ol className="space-y-4 text-lg text-ink-soft">
            <li className="flex gap-4">
              <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-moss text-sm font-bold text-moss-fg">
                1
              </span>
              <span>
                Press <strong className="text-ink">Talk</strong> and tell a memory.
              </span>
            </li>
            <li className="flex gap-4">
              <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-moss text-sm font-bold text-moss-fg">
                2
              </span>
              <span>We put it on the page, sounding like you.</span>
            </li>
            <li className="flex gap-4">
              <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-moss text-sm font-bold text-moss-fg">
                3
              </span>
              <span>Read it, listen to it, or print it whenever you like.</span>
            </li>
          </ol>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="xl" onClick={() => setStep(1)}>
              <Feather className="size-5" />
              Start my book
            </Button>
            {sample ? (
              <Button
                size="xl"
                variant="secondary"
                onClick={() => {
                  setCurrent(sample.id);
                  onEnterDesk();
                }}
              >
                Look at a sample first
              </Button>
            ) : null}
          </div>
          <p className="text-base text-ink-faint">
            Your words stay on this computer. Nothing is kept to train anyone
            else's system.{" "}
            <Link
              to="/start"
              className="text-moss underline-offset-4 hover:underline"
            >
              Print a one-page getting-started sheet
            </Link>
            .
          </p>
        </div>
      ) : null}

      {step === 1 ? (
        <Question
          kicker="Your name"
          title="What name should go on the title page?"
          hint="This is the byline. You can change it later."
        >
          <input
            autoFocus
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="For example: James Whitaker"
            className="h-16 w-full rounded-[18px] border border-rule bg-paper px-5 text-xl outline-none focus:border-moss"
          />
          <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} nextLabel="Next" />
        </Question>
      ) : null}

      {step === 2 ? (
        <Question
          kicker="The book"
          title="What do you want to call it?"
          hint="A working title is fine. “My Story” works too."
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Story"
            className="h-16 w-full rounded-[18px] border border-rule bg-paper px-5 text-xl outline-none focus:border-moss"
          />
          <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Next" />
        </Question>
      ) : null}

      {step === 3 ? (
        <Question
          kicker="Kind of book"
          title="What are you telling?"
          hint="This only helps the writing. You can switch later."
        >
          <div className="grid gap-3">
            {KINDS.map((k) => (
              <Choice
                key={k}
                selected={kind === k}
                title={KIND_LABEL[k]}
                onClick={() => setKind(k)}
              />
            ))}
          </div>
          <Nav onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="Next" />
        </Question>
      ) : null}

      {step === 4 ? (
        <Question
          kicker="Your voice"
          title="How should we treat your words?"
          hint="You can try one way and change it on the next chapter."
        >
          <div className="grid gap-3">
            {POLISH.map((p) => (
              <Choice
                key={p}
                selected={polish === p}
                title={POLISH_LABEL[p]}
                body={POLISH_HELP[p]}
                onClick={() => setPolish(p)}
              />
            ))}
          </div>
          <Nav
            onBack={() => setStep(3)}
            onNext={finish}
            nextLabel="Open the writing room"
            icon
          />
        </Question>
      ) : null}
    </div>
  );
}

function Question({
  kicker,
  title,
  hint,
  children,
}: {
  kicker: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-bold tracking-[0.22em] text-moss uppercase">{kicker}</p>
        <h1 className="font-serif text-4xl leading-tight text-ink">{title}</h1>
        <p className="text-lg text-ink-soft">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Choice({
  selected,
  title,
  body,
  onClick,
}: {
  selected: boolean;
  title: string;
  body?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[20px] border px-5 py-4 text-left transition-colors ${
        selected
          ? "border-moss bg-paper-deep"
          : "border-rule bg-paper hover:bg-paper-deep"
      }`}
    >
      <div className="text-xl font-bold text-ink">{title}</div>
      {body ? <p className="mt-1 text-base leading-relaxed text-ink-soft">{body}</p> : null}
    </button>
  );
}

function Nav({
  onBack,
  onNext,
  nextLabel,
  icon,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  icon?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
      <Button size="xl" onClick={onNext}>
        {icon ? <Mic className="size-5" /> : null}
        {nextLabel}
      </Button>
      <Button size="xl" variant="quiet" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}
