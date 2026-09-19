import { useState } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import { Button } from "./ui/button";

export function PhoneSetup({ offlineStatus }: { offlineStatus: string }) {
  const [storage, setStorage] = useState("");
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
        Protect local storage
      </Button>
      {storage && <p role="status">{storage}</p>}
    </div>
  );
}
