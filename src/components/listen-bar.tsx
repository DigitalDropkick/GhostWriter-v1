import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBook } from "@/lib/book-store";
import { loadAudio } from "@/lib/storage";
import { Pause, Play, Square } from "lucide-react";
import { toast } from "sonner";

function splitForSpeech(text: string, max = 3800): string[] {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > max && buf) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length ? chunks : [text.slice(0, max)];
}

export function ListenBar() {
  const { chapter, sessionsForChapter } = useBook();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopFlag = useRef(false);
  const [playing, setPlaying] = useState<"page" | "tape" | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    return () => stopAll();
  }, []);

  function stopAll() {
    stopFlag.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setPlaying(null);
    setStatus("");
  }

  function playUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const el = audioRef.current ?? new Audio();
      audioRef.current = el;
      el.src = url;
      el.onended = () => resolve();
      el.onerror = () => reject(new Error("audio"));
      el.play().catch(reject);
    });
  }

  async function listenToPage() {
    const text = chapter?.body.trim() ?? "";
    if (!text) {
      toast("This chapter is still empty.");
      return;
    }
    stopFlag.current = false;
    setPlaying("page");
    setStatus("Reading the page…");
    const chunks = splitForSpeech(text);
    try {
      for (let i = 0; i < chunks.length; i += 1) {
        if (stopFlag.current) return;
        setStatus(
          chunks.length > 1
            ? `Reading the page… ${i + 1} of ${chunks.length}`
            : "Reading the page…",
        );
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunks[i], voice: "lux" }),
        });
        if (!res.ok) {
          toast("I could not read the page just now.");
          stopAll();
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        try {
          await playUrl(url);
        } finally {
          URL.revokeObjectURL(url);
        }
      }
    } catch {
      if (!stopFlag.current) toast("Listening stopped.");
    }
    if (!stopFlag.current) stopAll();
  }

  async function listenToTape() {
    const withAudio = sessionsForChapter.find((s) => s.audioId);
    if (!withAudio?.audioId) {
      toast("There is no original recording for this chapter yet.");
      return;
    }
    const blob = await loadAudio(withAudio.audioId);
    if (!blob) {
      toast("I could not find that recording on this computer.");
      return;
    }
    stopFlag.current = false;
    setPlaying("tape");
    setStatus("Playing what you said…");
    const url = URL.createObjectURL(blob);
    try {
      await playUrl(url);
    } catch {
      toast("The recording would not play.");
    } finally {
      URL.revokeObjectURL(url);
      if (!stopFlag.current) stopAll();
    }
  }

  const busy = playing !== null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {busy ? (
        <>
          <Button size="lg" variant="ink" onClick={stopAll}>
            {playing === "page" ? (
              <Pause className="size-5" />
            ) : (
              <Square className="size-5 fill-current" />
            )}
            Stop
          </Button>
          <p className="text-lg text-ink-soft">{status}</p>
        </>
      ) : (
        <>
          <Button size="lg" variant="listen" onClick={() => void listenToPage()}>
            <Play className="size-5" />
            Listen to the page
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => void listenToTape()}
            disabled={!sessionsForChapter.some((s) => s.audioId)}
          >
            Play my recording
          </Button>
        </>
      )}
    </div>
  );
}
