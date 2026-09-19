import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBook } from "@/lib/book-store";
import { loadAudio } from "@/lib/storage";
import { splitForSpeech } from "@/lib/local-speech";
import { Play, Square } from "lucide-react";

export function ListenBar() {
  const { chapter, sessionsForChapter } = useBook();
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("");
  const [rate, setRate] = useState(0.9);
  const [recordingId, setRecordingId] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const generation = useRef(0);
  const recordings = sessionsForChapter.filter((s) => s.audioId);

  function stopAll() {
    generation.current += 1;
    window.speechSynthesis?.cancel();
    utterance.current = null;
    audio.current?.pause();
    if (audio.current) audio.current.src = "";
    audio.current = null;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    setPlaying(false);
    setStatus("");
  }
  useEffect(() => {
    stopAll();
    setRecordingId("");
    return stopAll;
  }, [chapter?.id]);

  async function listenToPage() {
    stopAll();
    const token = generation.current;
    if (!chapter?.body.trim()) return;
    if (!("speechSynthesis" in window)) {
      setStatus(
        "This browser has no installed reading voice. Try Safari on iPhone or Microsoft Edge on Windows.",
      );
      return;
    }
    setPlaying(true);
    setStatus("Finding an installed voice…");
    const synth = window.speechSynthesis;
    if (!synth.getVoices().length) {
      await new Promise<void>((resolve) => {
        const done = () => {
          clearTimeout(timer);
          synth.removeEventListener("voiceschanged", done);
          resolve();
        };
        const timer = window.setTimeout(done, 2000);
        synth.addEventListener("voiceschanged", done);
      });
    }
    if (token !== generation.current) return;
    const voices = synth.getVoices().filter((v) => v.localService && /^en(?:-|$)/i.test(v.lang));
    const voice = voices.find((v) => v.default) ?? voices[0];
    if (!voice) {
      setPlaying(false);
      setStatus(
        "No English voice installed for private reading. Add an English voice in your device’s speech/accessibility settings, then reopen this page. No text was sent online.",
      );
      return;
    }
    const chunks = splitForSpeech(chapter.body);
    const speak = (index: number) => {
      if (token !== generation.current) return;
      if (index === chunks.length) {
        stopAll();
        return;
      }
      setStatus(`Reading privately · ${index + 1} of ${chunks.length}`);
      const next = new SpeechSynthesisUtterance(chunks[index]);
      utterance.current = next;
      next.voice = voice;
      next.lang = voice.lang;
      next.rate = rate;
      next.onend = () => speak(index + 1);
      next.onerror = () => {
        if (token === generation.current) {
          stopAll();
          setStatus("Reading stopped. You can try again.");
        }
      };
      synth.speak(next);
    };
    speak(0);
  }
  async function listenToTape() {
    stopAll();
    const token = generation.current;
    const selected = recordings.find((s) => s.id === recordingId) ?? recordings[0];
    if (!selected?.audioId) return;
    setPlaying(true);
    setStatus("Opening your recording…");
    try {
      const blob = await loadAudio(selected.audioId);
      if (token !== generation.current) return;
      if (!blob) throw new Error("Recording missing");
      objectUrl.current = URL.createObjectURL(blob);
      const el = new Audio(objectUrl.current);
      audio.current = el;
      el.onended = () => {
        if (token === generation.current) stopAll();
      };
      el.onerror = () => {
        if (token === generation.current) {
          stopAll();
          setStatus("This recording could not be played.");
        }
      };
      await el.play();
      if (token === generation.current) setStatus("Playing your saved recording…");
    } catch {
      if (token === generation.current) {
        stopAll();
        setStatus("Could not play this recording. Try another recording or restore a backup.");
      }
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {playing ? (
          <Button variant="ink" onClick={stopAll}>
            <Square className="size-5" />
            Stop listening
          </Button>
        ) : (
          <>
            <Button
              variant="listen"
              disabled={!chapter?.body.trim()}
              onClick={() => void listenToPage()}
            >
              <Play className="size-5" />
              Listen to the page
            </Button>
            <Button
              variant="secondary"
              disabled={!recordings.length}
              onClick={() => void listenToTape()}
            >
              Play my recording
            </Button>
          </>
        )}
      </div>
      {status && (
        <p role="status" className="text-base text-ink-soft">
          {status}
        </p>
      )}
      <details className="text-base text-ink-soft">
        <summary className="cursor-pointer">Reading speed & recordings</summary>
        <div className="mt-3 flex flex-wrap gap-4">
          <label>
            Reading speed
            <select
              aria-label="Reading speed"
              disabled={playing}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="ml-2 min-h-12 rounded-md border border-rule bg-paper px-2"
            >
              <option value={0.75}>Slower</option>
              <option value={0.9}>Gentle</option>
              <option value={1}>Normal</option>
            </select>
          </label>
          {recordings.length > 0 && (
            <label className="min-w-0">
              Recording
              <select
                aria-label="Saved recording"
                disabled={playing}
                value={recordingId || recordings[0].id}
                onChange={(e) => setRecordingId(e.target.value)}
                className="max-w-full min-h-12 rounded-md border border-rule bg-paper px-2"
              >
                {recordings.map((s, i) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.createdAt).toLocaleString()} · {recordings.length - i}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </details>
    </div>
  );
}
