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
import { Modal } from "./ui/modal";
import { LibraryTools } from "./library-tools";
import { BookCover } from "./book-cover";
import { PhoneSetup } from "./phone-setup";
import { Feather, Mic, Smartphone } from "lucide-react";

const KINDS: BookKind[] = ["memoir", "family", "novel", "other"];
const POLISH: PolishLevel[] = ["faithful", "light", "literary"];

export function WelcomeFlow({
  onEnterDesk,
  offlineStatus,
}: {
  onEnterDesk: () => void;
  offlineStatus: string;
}) {
  const { createBook, setCurrent, state } = useBook();
  const [step, setStep] = useState(0);
  const [backupsOpen, setBackupsOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<BookKind>("memoir");
  const [polish, setPolish] = useState<PolishLevel>("faithful");

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
    <div className={`welcome-room ${step === 0 ? "welcome-intro" : "welcome-question"}`}>
      <header className="welcome-brand">
        <img src="/favicon.svg" alt="" className="brand-mark" />
        <span>Ghostwriter</span>
        <span className="edition-label">THE WRITING ROOM</span>
      </header>
      {phoneOpen && (
        <Modal title="Ghostwriter on your iPhone" onClose={() => setPhoneOpen(false)}>
          <PhoneSetup offlineStatus={offlineStatus} />
        </Modal>
      )}
      {backupsOpen && (
        <Modal title="Restore your books" onClose={() => setBackupsOpen(false)}>
          <LibraryTools />
        </Modal>
      )}
      {step === 0 ? (
        <div className="welcome-spread">
          <div className="welcome-copy">
            <p className="room-eyebrow">A place for the stories only you can tell</p>
            <h1>
              Your stories.
              <br />
              <em>In your words.</em>
            </h1>
            <p className="welcome-lead">
              A memory, a chapter, a whole book. Just talk, and watch your words find their way onto
              the page.
            </p>
            <div className="welcome-actions">
              <Button size="xl" onClick={() => setStep(1)}>
                <Feather className="size-5" />
                Start my book
              </Button>
              {sample && (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    setCurrent(sample.id);
                    onEnterDesk();
                  }}
                >
                  Look at a sample first
                </Button>
              )}
            </div>
            <p className="welcome-reassurance">No blank-page pressure. No need to type.</p>
          </div>
          <div className="welcome-book">
            <BookCover title="Every life holds a library." detail="Yours begins here" />
            <p>Your voice. Your pages. Your book.</p>
          </div>
          <ol className="welcome-steps">
            <li>
              <span>01</span>
              <div>
                <strong>Tell it.</strong>
                <p>Press Talk. Start with a memory.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Make it yours.</strong>
                <p>Read your words. Change anything.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Keep it forever.</strong>
                <p>Save a copy, share it, or print your book.</p>
              </div>
            </li>
          </ol>
          <footer className="welcome-foot">
            <p>
              Private dictation processes your voice on this device. Speech files download on first
              use; recordings are not uploaded. Save regular backups to keep your stories safe.
            </p>
            <div>
              <Button variant="quiet" size="md" onClick={() => setBackupsOpen(true)}>
                Restore a backup
              </Button>
              <Button variant="quiet" size="md" onClick={() => setPhoneOpen(true)}>
                <Smartphone className="size-4" />
                Set up on iPhone
              </Button>
              <Link to="/start" className="page-tool text-moss underline">
                Getting-started guide
              </Link>
            </div>
          </footer>
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
            aria-label="Author name"
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
            aria-label="Book title"
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
          hint="This describes your book. You can change it later."
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
          kicker="Optional writing help"
          title="If you ask for editing help, how much?"
          hint="Private dictation keeps your words as you review them. These preferences apply only if you later agree to send a passage for online editing."
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
          <Nav onBack={() => setStep(3)} onNext={finish} nextLabel="Open the writing room" icon />
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
      aria-pressed={selected}
      className={`rounded-[20px] border px-5 py-4 text-left transition-colors ${
        selected ? "border-moss bg-paper-deep" : "border-rule bg-paper hover:bg-paper-deep"
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
