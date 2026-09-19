import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBook } from "@/lib/book-store";
import { shapeDictation } from "@/lib/ai";
import { decodeRecording, MAX_RECORDING_BYTES, type SpeechReply } from "@/lib/local-speech";
import { loadAudio, saveAudio } from "@/lib/storage";
import { downloadBlob, formatClock, uid, wordCount } from "@/lib/utils";
import type { DictationDraft } from "@/lib/types";
import { Download, Keyboard, LoaderCircle, Mic, ShieldCheck, Square, Upload } from "lucide-react";
import { toast } from "sonner";

type Phase = "idle" | "preparing" | "recording" | "working" | "review";

export function TalkFlow({ onClose, startInType }: { onClose: () => void; startInType?: boolean }) {
  const { state, book, chapter, updateDraft, commitDraft, flushSave } = useBook();
  const initial = state.draft ?? {
    bookId: book!.id,
    chapterId: chapter!.id,
    transcript: "",
    audioId: null,
    durationMs: 0,
  };
  const draft = useRef<DictationDraft>(initial);
  const [transcript, setTranscript] = useState(initial.transcript);
  const [phase, setPhase] = useState<Phase>(state.draft || startInType ? "review" : "idle");
  const [seconds, setSeconds] = useState(initial.durationMs / 1000);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [interruptionNotice, setInterruptionNotice] = useState("");
  const [audioWarning, setAudioWarning] = useState("");
  const [destination, setDestination] = useState<"append" | "new">("append");
  const [consentOpen, setConsentOpen] = useState(false);
  const [beforePolish, setBeforePolish] = useState<string | null>(
    initial.originalTranscript ?? null,
  );
  const [hasAudio, setHasAudio] = useState(!!initial.audioId);
  const [level, setLevel] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<Blob | null>(null);
  const chunks = useRef<Blob[]>([]);
  const worker = useRef<Worker | null>(null);
  const rejectJob = useRef<((error: Error) => void) | null>(null);
  const generation = useRef(0);
  const startedAt = useRef(0);
  const mounted = useRef(true);
  const submitting = useRef(false);
  const meterContext = useRef<AudioContext | null>(null);
  const stopDone = useRef<Promise<Blob> | null>(null);
  const recordingId = useRef<string | null>(null);
  const recordingWrites = useRef<Promise<void>>(Promise.resolve());
  const polishing = useRef(false);
  const savingRecording = useRef(false);
  const interrupted = useRef(false);
  const finishRef = useRef<() => void>(() => {});

  function persist(patch: Partial<DictationDraft>) {
    draft.current = { ...draft.current, ...patch };
    updateDraft(draft.current);
  }
  function changeWords(text: string) {
    setTranscript(text);
    persist({ transcript: text });
  }
  function releaseMic() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    void meterContext.current?.close().catch(() => {});
    meterContext.current = null;
  }
  function cancelWork() {
    generation.current += 1;
    rejectJob.current?.(new Error("Cancelled. Your recording is still available."));
    rejectJob.current = null;
    worker.current?.terminate();
    worker.current = null;
    releaseMic();
    setPhase(hasAudio || transcript ? "review" : "idle");
    setMessage("");
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
      rejectJob.current?.(new Error("Closed"));
      worker.current?.terminate();
      if (recorder.current?.state === "recording") recorder.current.stop();
      releaseMic();
    };
  }, []);

  useEffect(() => {
    const busy = phase === "recording" || phase === "preparing" || phase === "working";
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => setSeconds((Date.now() - startedAt.current) / 1000), 250);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "recording") return;
    let wakeLock: WakeLockSentinel | undefined;
    let disposed = false;
    // Keep the screen awake when supported; interruptions still need recovery.
    void navigator.wakeLock
      ?.request("screen")
      .then((lock) => {
        if (disposed) void lock.release().catch(() => {});
        else wakeLock = lock;
      })
      .catch(() => {});
    const pauseForInterruption = () => {
      if (recorder.current?.state !== "recording") return;
      interrupted.current = true;
      finishRef.current();
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") pauseForInterruption();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pauseForInterruption);
    const tracks = stream.current?.getAudioTracks() ?? [];
    tracks.forEach((track) => {
      track.addEventListener("ended", pauseForInterruption);
      track.addEventListener("mute", pauseForInterruption);
    });
    return () => {
      disposed = true;
      void wakeLock?.release().catch(() => {});
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pauseForInterruption);
      tracks.forEach((track) => {
        track.removeEventListener("ended", pauseForInterruption);
        track.removeEventListener("mute", pauseForInterruption);
      });
    };
  }, [phase]);

  function runWorker(type: "prepare" | "transcribe", samples?: Float32Array): Promise<string> {
    if (!worker.current)
      worker.current = new Worker(new URL("../workers/transcribe.worker.ts", import.meta.url), {
        type: "module",
      });
    const w = worker.current;
    return new Promise((resolve, reject) => {
      rejectJob.current = reject;
      w.onerror = () => {
        rejectJob.current = null;
        w.terminate();
        worker.current = null;
        reject(
          new Error(
            "Private dictation could not start. Try again, or save your recording and contact Addam.",
          ),
        );
      };
      w.onmessage = (event: MessageEvent<SpeechReply>) => {
        const reply = event.data;
        if (reply.type === "progress") setMessage(reply.message);
        if (reply.type === "ready" || reply.type === "result") {
          rejectJob.current = null;
          resolve(reply.type === "result" ? reply.text : "");
        }
        if (reply.type === "error") {
          rejectJob.current = null;
          reject(new Error(reply.message));
        }
      };
      w.postMessage({ type, audio: samples }, samples ? [samples.buffer as ArrayBuffer] : []);
    });
  }

  async function transcribe(blob: Blob, token = ++generation.current) {
    if (!mounted.current || token !== generation.current) return;
    setPhase("working");
    setError("");
    setInterruptionNotice("");
    setMessage("Opening your recording on this device…");
    try {
      const samples = await decodeRecording(blob);
      if (token !== generation.current) return;
      const text = await runWorker("transcribe", samples);
      if (token !== generation.current) return;
      if (!text)
        throw new Error(
          "No words were found. You can listen to the recording, type the words, or try again.",
        );
      changeWords(text);
      persist({ originalTranscript: text });
    } catch (err) {
      if (token === generation.current)
        setError(err instanceof Error ? err.message : "Could not transcribe this recording.");
    } finally {
      if (mounted.current && token === generation.current) setPhase("review");
    }
  }

  async function startTalking() {
    if (phase === "preparing" || recorder.current?.state === "recording") return;
    const token = ++generation.current;
    interrupted.current = false;
    setPhase("preparing");
    setError("");
    setMessage("Preparing private dictation. The first download may take a few minutes…");
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined")
        throw new Error(
          "Microphone recording needs a secure page in Safari, Edge, or Chrome. You can still type or open a recording.",
        );
      await runWorker("prepare");
      if (token !== generation.current) return;
      setMessage("Allow the microphone when your browser asks…");
      const input = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (token !== generation.current) {
        input.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = input;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg"].find((mime) =>
        MediaRecorder.isTypeSupported(mime),
      );
      const rec = new MediaRecorder(input, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 64000,
      });
      recorder.current = rec;
      chunks.current = [];
      recordingId.current = uid("aud");
      recordingWrites.current = Promise.resolve();
      let lastCheckpoint = 0;
      audio.current = null;
      let totalBytes = 0;
      stopDone.current = new Promise((resolve) => {
        rec.ondataavailable = (event) => {
          if (event.data.size) {
            chunks.current.push(event.data);
            totalBytes += event.data.size;
          }
          if (
            Date.now() - lastCheckpoint >= 5000 &&
            rec.state === "recording" &&
            chunks.current.length
          ) {
            lastCheckpoint = Date.now();
            const checkpoint = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
            const id = recordingId.current!;
            const durationMs = Date.now() - startedAt.current;
            recordingWrites.current = recordingWrites.current
              .then(async () => {
                await saveAudio(id, checkpoint);
                if (mounted.current && rec.state === "recording") {
                  persist({ audioId: id, durationMs });
                  setHasAudio(true);
                }
              })
              .catch(() => {
                if (mounted.current)
                  setAudioWarning(
                    "The recording could not be saved yet. Keep this page open and download the recording when finished.",
                  );
              });
          }
          if (
            (totalBytes > MAX_RECORDING_BYTES * 0.9 ||
              Date.now() - startedAt.current >= 55 * 60 * 1000) &&
            rec.state === "recording"
          )
            finishRef.current();
        };
        rec.onstop = () => {
          const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
          audio.current = blob;
          resolve(blob);
          if (mounted.current && rec === recorder.current) finishRef.current();
        };
        rec.onerror = () => {
          setError("The microphone stopped. We will recover what was recorded.");
          finishRef.current();
        };
      });
      startedAt.current = Date.now();
      setSeconds(0);
      rec.start(1000);
      setPhase("recording");
      try {
        const context = new AudioContext();
        meterContext.current = context;
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        context.createMediaStreamSource(input).connect(analyser);
        const buffer = new Uint8Array(analyser.fftSize);
        const tick = () => {
          if (rec.state !== "recording" || !mounted.current) return;
          analyser.getByteTimeDomainData(buffer);
          setLevel(Math.min(100, Math.max(...buffer.map((n) => Math.abs(n - 128))) * 3));
          requestAnimationFrame(tick);
        };
        tick();
      } catch {
        /* A missing volume meter must not stop recording. */
      }
    } catch (err) {
      releaseMic();
      if (token !== generation.current) return;
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was blocked. Use the site controls beside the address bar to allow the microphone, then try again."
          : err instanceof Error
            ? err.message
            : "Could not open the microphone.",
      );
      setPhase("idle");
    }
  }

  const finishing = useRef(false);
  async function finishTalking() {
    if (finishing.current || !stopDone.current) return;
    finishing.current = true;
    setPhase("working");
    setMessage("Keeping the final words of your recording…");
    const durationMs = Date.now() - startedAt.current;
    if (recorder.current?.state !== "inactive") recorder.current?.stop();
    // MediaRecorder guarantees the final dataavailable before stop, not after an arbitrary timeout.
    const blob = await stopDone.current;
    releaseMic();
    if (!mounted.current) return;
    await recordingWrites.current;
    await keepRecording(blob, durationMs);
    finishing.current = false;
    if (interrupted.current) {
      setInterruptionNotice(
        "Recording stopped when this page was interrupted. Review the saved recording, then tap Transcribe again when you are ready.",
      );
      setPhase("review");
    } else await transcribe(blob);
  }
  finishRef.current = () => {
    void finishTalking();
  };

  async function keepRecording(blob: Blob, durationMs: number) {
    savingRecording.current = true;
    audio.current = blob;
    setHasAudio(true);
    const audioId = recordingId.current ?? uid("aud");
    try {
      await saveAudio(audioId, blob);
      persist({ audioId, durationMs });
      await flushSave();
      setAudioWarning("");
    } catch {
      setAudioWarning(
        "This recording is only in this open page. Download the recording before closing; browser storage could not save it.",
      );
    } finally {
      savingRecording.current = false;
    }
  }

  async function getRecording() {
    return audio.current ?? (draft.current.audioId ? await loadAudio(draft.current.audioId) : null);
  }
  async function downloadRecording() {
    try {
      const blob = await getRecording();
      if (!blob) throw new Error("The recording was not found on this device.");
      downloadBlob(
        `My-recording.${blob.type.includes("mp4") ? "m4a" : blob.type.includes("wav") ? "wav" : blob.type.includes("mpeg") ? "mp3" : blob.type.includes("ogg") ? "ogg" : "webm"}`,
        blob,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the recording.");
    }
  }
  async function retryTranscription() {
    const token = ++generation.current;
    setPhase("working");
    setMessage("Opening your saved recording…");
    try {
      const blob = await getRecording();
      if (!mounted.current || token !== generation.current) return;
      if (blob) await transcribe(blob, token);
      else {
        setError("Recording not found. You can still type your words below.");
        setPhase("review");
      }
    } catch {
      if (mounted.current && token === generation.current) {
        setError("Could not open the saved recording.");
        setPhase("review");
      }
    }
  }
  async function onUpload(file: File) {
    if (file.size > MAX_RECORDING_BYTES) {
      setError("Please choose a recording smaller than 100 MB.");
      return;
    }
    if (!file.type.startsWith("audio/") && !/\.(mp3|wav|m4a|ogg|webm|flac|aac)$/i.test(file.name)) {
      setError("Choose an audio recording such as MP3, WAV, or M4A.");
      return;
    }
    recordingId.current = null;
    setPhase("working");
    setMessage("Saving your recording on this device…");
    await keepRecording(file, 0);
    await transcribe(file);
  }
  function closeSafely() {
    if (
      audioWarning &&
      !window.confirm(
        "The recording could not be saved. Download it first if you want to keep it. Leave this passage anyway?",
      )
    )
      return;
    onClose();
  }
  async function writeIntoBook() {
    if (submitting.current || !transcript.trim()) return;
    if (
      audioWarning &&
      !window.confirm(
        "The recording could not be saved. Add the text without a saved recording? Download the recording first if you want to keep it.",
      )
    )
      return;
    submitting.current = true;
    setPhase("working");
    setMessage("Saving your words…");
    persist({ transcript });
    try {
      await commitDraft(destination);
      toast("Your words are saved in the book.");
    } catch {
      toast("Your words are on the page, but saving needs attention. Use the save warning above.");
    }
    onClose();
  }
  async function polish() {
    polishing.current = true;
    setConsentOpen(false);
    setPhase("working");
    setMessage("Asking for help with this passage…");
    const original = transcript;
    persist({ originalTranscript: draft.current.originalTranscript ?? original });
    try {
      const result = await shapeDictation({
        data: {
          transcript,
          kind: book!.kind,
          polish: book!.polish,
          voiceNotes: book!.voiceNotes,
          onlineConsent: true,
        },
      });
      if (!result.ok) throw new Error(result.error);
      setBeforePolish(original);
      changeWords(result.body);
      toast("Review the suggested wording before adding it to your book.");
    } catch (err) {
      setError(
        err instanceof Error && err.message === "Unauthorized"
          ? "Sign in to use optional online writing help. Your private dictation still works without an account."
          : err instanceof Error
            ? err.message
            : "Online help could not finish. Your original words are unchanged.",
      );
    } finally {
      polishing.current = false;
      if (mounted.current) setPhase("review");
    }
  }

  return (
    <div className="space-y-5" aria-busy={phase === "working" || phase === "preparing"}>
      <p className="flex items-center gap-2 text-base font-bold text-moss">
        <ShieldCheck className="size-5 shrink-0" /> Private dictation · voice stays on this device
      </p>
      {interruptionNotice && (
        <p role="status" className="rounded-md border border-rule bg-paper-deep p-4">
          {interruptionNotice}
        </p>
      )}
      {audioWarning && (
        <p role="alert" className="rounded-lg border border-rule bg-paper-deep p-4 text-lg">
          {audioWarning}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-rule bg-paper-deep p-4 text-lg">
          {error}
        </p>
      )}
      {phase === "preparing" || phase === "working" ? (
        <div className="space-y-5 py-6">
          <LoaderCircle className="size-8 animate-spin text-moss" />
          <p role="status" className="font-serif text-2xl">
            {message}
          </p>
          <p className="text-lg text-ink-soft">
            Keep this page open. Longer recordings take more time. Short passages work best on a phone.
          </p>
          {!submitting.current &&
            !finishing.current &&
            !polishing.current &&
            !savingRecording.current && (
              <Button variant="secondary" onClick={cancelWork}>
                Cancel processing
              </Button>
            )}
        </div>
      ) : phase === "recording" ? (
        <div className="space-y-5">
          <h2 className="font-serif text-3xl">Recording your voice</h2>
          <p className="text-2xl tabular-nums" role="timer">
            {formatClock(seconds * 1000)}
          </p>
          <meter
            aria-label="Microphone volume"
            min={0}
            max={100}
            value={level}
            className="h-6 w-full"
          />
          <p className="text-lg text-ink-soft">
            Take your time. Your words will appear after you press I’m finished. Keep this page open
            and your screen unlocked. Switching apps or an incoming call stops this passage for
            recovery. Short passages work best on a phone. Long sessions stop and save at about 55
            minutes; you can start another passage afterward.
          </p>
          <Button size="xl" variant="ink" onClick={() => void finishTalking()}>
            <Square className="size-5 fill-current" />
            I’m finished
          </Button>
        </div>
      ) : phase === "review" ? (
        <div className="space-y-5">
          <h2 className="font-serif text-3xl">Your words, your way</h2>
          <p className="text-lg text-ink-soft">
            Read through this passage and correct any names or missed words. Earlier pages will stay
            as you wrote them.
          </p>
          <label className="block space-y-2">
            <span className="font-bold">Words to add to your book</span>
            <textarea
              autoFocus
              aria-label="Words to add to your book"
              value={transcript}
              onChange={(e) => changeWords(e.target.value)}
              rows={9}
              className="w-full rounded-lg border border-rule bg-paper px-4 py-3 text-xl leading-relaxed"
              placeholder="Type or paste your words here…"
            />
          </label>
          <p className="text-base text-ink-soft">
            {wordCount(transcript)} words · draft saved with your library when the save indicator is
            ready
          </p>
          {hasAudio && (
            <div className="flex flex-wrap gap-3">
              <Button size="md" variant="secondary" onClick={() => void downloadRecording()}>
                <Download className="size-4" />
                Save recording
              </Button>
              <Button
                size="md"
                variant="quiet"
                onClick={() => {
                  if (
                    !transcript ||
                    window.confirm(
                      "Replace the words in this draft with a fresh transcription of the recording?",
                    )
                  )
                    void retryTranscription();
                }}
              >
                Transcribe again
              </Button>
            </div>
          )}
          <fieldset className="space-y-3">
            <legend className="mb-2 text-lg font-bold">Where should this go?</legend>
            <label className="flex gap-3">
              <input
                type="radio"
                name="destination"
                checked={destination === "append"}
                onChange={() => setDestination("append")}
                className="size-5 accent-moss"
              />
              Add to “{state.chapters.find((c) => c.id === draft.current.chapterId)?.title}”
            </label>
            <label className="flex gap-3">
              <input
                type="radio"
                name="destination"
                checked={destination === "new"}
                onChange={() => setDestination("new")}
                className="size-5 accent-moss"
              />
              Start a new chapter
            </label>
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <Button size="xl" disabled={!transcript.trim()} onClick={() => void writeIntoBook()}>
              Write this into the book
            </Button>
            <Button variant="secondary" onClick={closeSafely}>
              Keep draft for later
            </Button>
          </div>
          <details className="border-t border-rule pt-4">
            <summary className="cursor-pointer text-lg text-ink-soft">
              Optional writing help & draft tools
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-base text-ink-soft">
                Online writing help sends only this passage and your voice notes as text to xAI. It
                does not receive the recording. Private dictation does not need this.
              </p>
              <Button
                size="md"
                variant="secondary"
                disabled={!transcript.trim()}
                onClick={() => setConsentOpen(true)}
              >
                Review online writing help
              </Button>
              {beforePolish !== null && (
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => {
                    changeWords(beforePolish);
                    setBeforePolish(null);
                  }}
                >
                  Restore my original wording
                </Button>
              )}
              {consentOpen && (
                <div className="space-y-3 rounded-lg border border-rule p-4">
                  <p>
                    This sends the passage above and your writing preferences to xAI for processing
                    under its policies. Ghostwriter cannot promise how an outside service retains
                    data. Continue only if you agree.
                  </p>
                  <a
                    href="https://x.ai/legal/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Read xAI’s privacy policy
                  </a>
                  <div className="flex flex-wrap gap-3">
                    <Button size="md" onClick={() => void polish()}>
                      Send this text to xAI
                    </Button>
                    <Button size="md" variant="secondary" onClick={() => setConsentOpen(false)}>
                      Keep it private
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <Button
                  size="md"
                  variant="quiet"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Discard this unfinished passage? Your saved chapters will stay unchanged.",
                      )
                    ) {
                      updateDraft(null);
                      onClose();
                    }
                  }}
                >
                  Discard this draft
                </Button>
              </div>
            </div>
          </details>
        </div>
      ) : (
        <div className="space-y-5">
          <h2 className="font-serif text-3xl">Tell the next part</h2>
          <p className="text-lg text-ink-soft">
            Speak naturally. We’ll turn your recording into words right here on the laptop, then let
            you review them.
          </p>
          <p className="rounded-lg border border-rule bg-paper-deep/50 p-4 text-base text-ink-soft">
            The first use downloads speech files from Hugging Face. Downloads need internet; your
            recording is processed on this device and is not sent with them.
          </p>
          <Button size="xl" onClick={() => void startTalking()}>
            <Mic className="size-6" />
            Start private dictation
          </Button>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setPhase("review")}>
              <Keyboard className="size-5" />
              I’d rather type
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="size-5" />I have a recording
            </Button>
            <Button variant="quiet" onClick={onClose}>
              Not now
            </Button>
          </div>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac"
        className="hidden"
        aria-label="Open an audio recording"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onUpload(file);
        }}
      />
    </div>
  );
}
