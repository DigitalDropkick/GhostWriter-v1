import { useEffect, useRef, useState } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { useInstallApp } from "@/lib/install-app";
import type { SpeechReply } from "@/lib/local-speech";

export function PhoneSetup({ offlineStatus }: { offlineStatus: string }) {
  const [storage, setStorage] = useState("");
  const { available, installed, install } = useInstallApp();
  const [installMessage, setInstallMessage] = useState("");
  const [speech, setSpeech] = useState("");
  const [preparing, setPreparing] = useState(false);
  const speechWorker = useRef<Worker | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      speechWorker.current?.terminate();
      clearTimeout(speechTimer.current);
    },
    [],
  );
  function prepareSpeech() {
    setPreparing(true);
    setSpeech("Preparing private dictation. Keep this window open…");
    function finish(message: string) {
      setSpeech(message);
      setPreparing(false);
      speechWorker.current?.terminate();
      speechWorker.current = null;
      clearTimeout(speechTimer.current);
    }
    try {
      const worker = new Worker(new URL("../workers/transcribe.worker.ts", import.meta.url), {
        type: "module",
      });
      speechWorker.current = worker;
      worker.onmessage = (event: MessageEvent<SpeechReply>) => {
        if (event.data.type === "progress") setSpeech(event.data.message);
        if (event.data.type === "ready")
          finish(
            event.data.offlineReady
              ? "Speech files are saved for offline dictation. Try a short recording with internet turned off before you rely on it."
              : "Dictation can work while this page is open, but its offline download is incomplete. Keep internet on, free some device storage, then try again.",
          );
        if (event.data.type === "error") finish(event.data.message);
      };
      worker.onerror = () =>
        finish(
          "The speech download did not finish. Keep your internet connection on and try again. Typing still works.",
        );
      speechTimer.current = setTimeout(
        () =>
          finish(
            "The speech download is taking too long. Try again with a steady internet connection. Typing still works.",
          ),
        240000,
      );
      worker.postMessage({ type: "prepare" });
    } catch {
      finish(
        "Private dictation could not be prepared in this browser. You can still type and save your words.",
      );
    }
  }
  async function protectStorage() {
    try {
      const kept = await navigator.storage?.persist?.();
      setStorage(
        kept
          ? "Extra storage protection is on. Keep a separate backup too."
          : "This browser decides when local storage can be cleared. A saved backup is your protection.",
      );
    } catch {
      setStorage("Storage protection is unavailable. Keep a separate backup of your books.");
    }
  }
  return (
    <div className="space-y-5">
      <p className="font-serif text-2xl">Your writing room, one tap away.</p>
      {installed ? (
        <p role="status">Ghostwriter is open as an installed app.</p>
      ) : (
        <div className="space-y-3 rounded-lg border border-rule p-4">
          <h3 className="font-serif text-xl">On a Windows computer</h3>
          <p>
            Open this site in Chrome or Edge. Choose the install icon beside the address bar, or
            find Apps in the browser menu and choose to install this site.
          </p>
          {available && (
            <Button
              onClick={() => {
                void install().then((result) =>
                  setInstallMessage(
                    result === "accepted"
                      ? "Installation requested. Open Ghostwriter from its new icon when it appears."
                      : result === "dismissed"
                        ? "Installation cancelled. You can keep writing here."
                        : "Use your browser’s install option beside the address bar.",
                  ),
                );
              }}
            >
              Install on this device
            </Button>
          )}
          {installMessage && <p role="status">{installMessage}</p>}
        </div>
      )}
      <h3 className="font-serif text-xl">On an iPhone or iPad</h3>
      <ol className="setup-steps">
        <li>
          <Share aria-hidden="true" />
          <span>
            Open Ghostwriter in <strong>Safari</strong>. Tap the Share button (sometimes inside the
            page menu).
          </span>
        </li>
        <li>
          <Smartphone aria-hidden="true" />
          <span>
            Choose <strong>Add to Home Screen</strong>. Turn on <strong>Open as Web App</strong> if
            shown, then tap Add.
          </span>
        </li>
        <li>
          <Download aria-hidden="true" />
          <span>Open the new icon while online. Keep using that icon for your books.</span>
        </li>
      </ol>
      <p role="status" className="rounded-md bg-paper-deep p-4">
        {offlineStatus}
      </p>
      <div className="space-y-3">
        <h3 className="font-serif text-xl">Get ready to write offline</h3>
        <p>
          The first setup needs internet and sign-in. Download the speech files here if you want to
          dictate without internet. Online editing always needs a connection.
        </p>
        <Button disabled={preparing} variant="secondary" onClick={prepareSpeech}>
          {preparing ? "Preparing dictation…" : "Prepare offline dictation"}
        </Button>
        {speech && <p role="status">{speech}</p>}
      </div>
      <p>
        Books stay on this device. To move from Safari or your laptop, save a Ghostwriter backup
        there, then restore it inside this app. Books do not automatically sync.
      </p>
      <p className="text-ink-soft">
        Save a backup to Files after writing. Deleting the app or clearing website data can erase
        its library. Record short passages with Ghostwriter open; calls and screen locking can
        interrupt recording.
      </p>
      <Button variant="secondary" onClick={() => void protectStorage()}>
        Help this device keep my books
      </Button>
      {storage && <p role="status">{storage}</p>}
    </div>
  );
}
