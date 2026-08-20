import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBook } from "@/lib/book-store";
import { shapeDictation } from "@/lib/ai";
import { formatClock, uid, wordCount } from "@/lib/utils";
import { Keyboard, LoaderCircle, Mic, Square, Upload } from "lucide-react";
import { toast } from "sonner";

type TalkPhase = "idle" | "recording" | "review" | "shaping";

interface SpeechRec {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((ev: SpeechRecEvent) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecEvent {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

function getSpeechRecognizer(): SpeechRec | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function pickMime(): string | undefined {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];
  if (typeof MediaRecorder === "undefined") return undefined;
  return types.find((t) => MediaRecorder.isTypeSupported(t));
}

export function TalkFlow({
  onClose,
  startInType,
}: {
  onClose: () => void;
  startInType?: boolean;
}) {
  const { book, chapter, addChapter, updateChapter, addSession } = useBook();
  const [phase, setPhase] = useState<TalkPhase>(startInType ? "review" : "idle");
  const [seconds, setSeconds] = useState(0);
  const [live, setLive] = useState("");
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [destination, setDestination] = useState<"append" | "new">("append");
  const [note, setNote] = useState<string | null>(null);
  const [busyLabel, setBusyLabel] = useState("Setting your words on the page…");

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const keepListening = useRef(false);
  const startedAt = useRef(0);
  const audioBlob = useRef<Blob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    return () => stopEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopEverything() {
    keepListening.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      try {
        mediaRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startTalking() {
    setMicError(null);
    setLive("");
    chunksRef.current = [];
    audioBlob.current = null;
    keepListening.current = true;
    startedAt.current = Date.now();
    setSeconds(0);
    setPhase("recording");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRef.current = recorder;
      recorder.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        if (chunksRef.current.length) {
          audioBlob.current = new Blob(chunksRef.current, { type });
        }
      };
      recorder.start(1000);
    } catch {
      setMicError(
        "This browser would not turn the microphone on. You can type, paste, or upload a recording instead.",
      );
    }

    const rec = getSpeechRecognizer();
    if (rec) {
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (ev) => {
        let finalText = "";
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
          const piece = ev.results[i][0].transcript;
          if (ev.results[i].isFinal) finalText += `${piece} `;
          else interim += piece;
        }
        if (finalText) {
          setTranscript((prev) => `${prev} ${finalText}`.replace(/\s+/g, " ").trim());
        }
        setLive(interim);
      };
      rec.onend = () => {
        if (keepListening.current) {
          try {
            rec.start();
          } catch {
            /* ignore */
          }
        }
      };
      rec.onerror = () => {
        /* live captions are optional */
      };
      recRef.current = rec;
      try {
        rec.start();
      } catch {
        /* ignore */
      }
    }
  }

  async function finishTalking() {
    keepListening.current = false;
    stopEverything();
    await new Promise((r) => setTimeout(r, 120));
    setBusyLabel("Listening back through what you said…");
    setPhase("shaping");

    let text = transcript.trim();
    const blob = audioBlob.current;
    if (blob && blob.size > 400) {
      try {
        const fd = new FormData();
        fd.append("file", blob, "session.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        const json = (await res.json()) as { ok?: boolean; text?: string };
        if (json.ok && json.text?.trim()) text = json.text.trim();
      } catch {
        /* keep live captions */
      }
    }
    setTranscript(text);
    setLive("");
    setPhase("review");
    setBusyLabel("Setting your words on the page…");
    if (!text) {
      toast("I didn't catch any words. You can type them, or talk again.");
    }
  }

  async function onUpload(file: File) {
    audioBlob.current = file;
    setBusyLabel("Listening to your recording…");
    setPhase("shaping");
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const json = (await res.json()) as { ok?: boolean; text?: string; error?: string };
      if (json.ok && json.text?.trim()) {
        setTranscript(json.text.trim());
      } else {
        toast(json.error || "I could not make out that recording.");
      }
    } catch {
      toast("I could not read that file.");
    }
    setPhase("review");
    setBusyLabel("Setting your words on the page…");
  }

  async function writeIntoBook() {
    if (!book || !chapter) return;
    const spoken = transcript.trim();
    if (spoken.length < 8) {
      toast("Please talk a little more, or type a few sentences, then try again.");
      return;
    }
    setPhase("shaping");
    setNote(null);

    try {
    const sessionId = uid("sess");
    const audioId = audioBlob.current ? uid("aud") : null;
    await addSession(
      {
        id: sessionId,
        bookId: book.id,
        chapterId: chapter.id,
        transcript: spoken,
        audioId,
        durationMs: seconds * 1000,
        createdAt: Date.now(),
      },
      audioBlob.current,
    );

    const target =
      destination === "new" ? addChapter(book.id, "New chapter") : chapter;

    const result = await shapeDictation({
      data: {
        transcript: spoken,
        existingBody: destination === "new" ? "" : target.body,
        chapterTitle: target.title,
        bookTitle: book.title,
        author: book.author,
        kind: book.kind,
        polish: book.polish,
        voiceNotes: book.voiceNotes,
        destination,
      },
    });

    if (result.ok) {
      updateChapter(target.id, {
        title: result.chapterTitle,
        body: result.body,
      });
      setNote(result.note);
      toast(result.note);
      onClose();
    } else {
      if (!target.body) {
        updateChapter(target.id, { body: spoken });
      } else {
        updateChapter(target.id, {
          body: `${target.body.trim()}\n\n${spoken}`,
        });
      }
      toast(result.error + " I saved your spoken words on the page so nothing is lost.");
      onClose();
    }
    } catch (err) {
      toast(
        err instanceof Error
          ? err.message
          : "Something went wrong. Your words are still in the box.",
      );
      setPhase("review");
    }
  }

  if (phase === "shaping") {
    return (
      <div className="flex min-h-[22rem] flex-col items-center justify-center gap-5 px-6 text-center">
        <LoaderCircle className="size-10 animate-spin text-moss" />
        <p className="font-serif text-3xl text-ink">{busyLabel}</p>
        <p className="max-w-md text-lg text-ink-soft">
          This can take a short moment. Do not close the page.
        </p>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="relative grid size-14 place-items-center">
            <span className="pulse-ring absolute inset-0 rounded-full bg-moss" />
            <span className="relative size-5 rounded-full bg-moss" />
          </span>
          <div>
            <p className="font-serif text-3xl text-ink">I'm listening</p>
            <p className="font-sans text-xl tabular-nums text-ink-soft">
              {formatClock(seconds * 1000)}
            </p>
          </div>
        </div>
        <div className="min-h-32 rounded-[22px] border border-rule bg-paper-deep/60 px-5 py-4 text-xl leading-relaxed text-ink">
          {transcript || live ? (
            <>
              {transcript} <span className="text-ink-faint">{live}</span>
            </>
          ) : (
            <span className="text-ink-faint">
              Go ahead. Tell it the way you would tell a friend.
            </span>
          )}
        </div>
        {micError ? <p className="text-lg text-ink-soft">{micError}</p> : null}
        <Button size="xl" variant="ink" className="w-full sm:w-auto" onClick={() => void finishTalking()}>
          <Square className="size-5 fill-current" />
          I'm finished
        </Button>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-bold tracking-[0.18em] text-moss uppercase">
            Your words
          </p>
          <h2 className="mt-1 font-serif text-3xl text-ink">Did I hear you right?</h2>
          <p className="mt-2 text-lg text-ink-soft">
            Fix anything that looks wrong. Then we'll put it in the book.
          </p>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={10}
          className="w-full rounded-[22px] border border-rule bg-paper px-5 py-4 text-xl leading-relaxed outline-none focus:border-moss"
          placeholder="Type or paste what you want in the book…"
        />
        <p className="text-base text-ink-faint">{wordCount(transcript)} words</p>
        <fieldset className="space-y-3">
          <legend className="text-lg font-bold text-ink">Where should this go?</legend>
          <label className="flex items-start gap-3 text-lg">
            <input
              type="radio"
              className="mt-1.5 size-5 accent-moss"
              checked={destination === "append"}
              onChange={() => setDestination("append")}
            />
            <span>
              Add it to this chapter
              {chapter ? ` (“${chapter.title}”)` : ""}
            </span>
          </label>
          <label className="flex items-start gap-3 text-lg">
            <input
              type="radio"
              className="mt-1.5 size-5 accent-moss"
              checked={destination === "new"}
              onChange={() => setDestination("new")}
            />
            <span>Start a new chapter with it</span>
          </label>
        </fieldset>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="xl" onClick={() => void writeIntoBook()}>
            Write this into the book
          </Button>
          <Button size="xl" variant="secondary" onClick={() => void startTalking()}>
            <Mic className="size-5" />
            Talk again
          </Button>
          <Button size="xl" variant="quiet" onClick={onClose}>
            Cancel
          </Button>
        </div>
        {note ? <p className="text-ink-soft">{note}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold tracking-[0.18em] text-moss uppercase">Talk</p>
        <h2 className="mt-1 font-serif text-3xl text-ink">Tell the next part</h2>
        <p className="mt-2 max-w-xl text-lg text-ink-soft">
          Press the green button and speak. When you are done, press I'm
          finished. You can also type, or bring in a recording you already have.
        </p>
      </div>
      <Button size="xl" className="w-full sm:w-auto" onClick={() => void startTalking()}>
        <Mic className="size-6" />
        Start talking
      </Button>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" variant="secondary" onClick={() => setPhase("review")}>
          <Keyboard className="size-5" />
          I'd rather type
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-5" />
          I have a recording
        </Button>
        <Button size="lg" variant="quiet" onClick={onClose}>
          Not now
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onUpload(file);
          e.target.value = "";
        }}
      />
      {micError ? <p className="text-lg text-ink-soft">{micError}</p> : null}
    </div>
  );
}
