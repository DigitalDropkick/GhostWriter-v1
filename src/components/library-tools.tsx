import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { useBook } from "@/lib/book-store";
import { createBackup, parseBackup, prepareImport } from "@/lib/backup";
import { downloadBlob } from "@/lib/utils";
import { shareFile } from "@/lib/share-file";
import { Download, FolderOpen, Share } from "lucide-react";

export function LibraryTools() {
  const { state, pendingAudio, importLibrary } = useBook();
  const file = useRef<HTMLInputElement>(null);
  const [prepared, setPrepared] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<ReturnType<typeof parseBackup> | null>(null);
  async function download(includeAudio = true, forSharing = false) {
    setBusy(true);
    setPrepared(null);
    setMessage("Preparing your books and recordings…");
    try {
      const text = await createBackup(state, pendingAudio, includeAudio);
      const filename = `Ghostwriter-${includeAudio ? "backup" : "text-only-backup"}-${new Date().toISOString().slice(0, 10)}.json`;
      if (forSharing) {
        setPrepared(new File([text], filename, { type: "application/json" }));
        setMessage(
          "Your backup is ready. Tap Save or share backup, then choose Save to Files. Keep this private file somewhere safe.",
        );
        return;
      }
      downloadBlob(
        `Ghostwriter-${includeAudio ? "backup" : "text-only-backup"}-${new Date().toISOString().slice(0, 10)}.json`,
        new Blob([text], { type: "application/json" }),
      );
      setMessage(
        includeAudio
          ? "Backup download started. Keep this file somewhere safe, such as a USB drive. It contains your private books and recordings."
          : "Text-only backup download started. It keeps every book, transcript, draft, and page history, but leaves out recordings.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Backup could not finish. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function inspect(input: File) {
    setBusy(true);
    setMessage("");
    try {
      if (input.size > 250 * 1024 * 1024)
        throw new Error("This backup is larger than 250 MB. Ask Addam to help restore it.");
      setPending(parseBackup(await input.text()));
    } catch {
      setPending(null);
      setMessage(
        "This file is not a complete Ghostwriter backup, or it is too large to open. Your current books are unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function restore() {
    if (!pending) return;
    setBusy(true);
    setPrepared(null);
    setMessage("Restoring a separate copy of your books…");
    try {
      if (state.draft && pending.state.draft)
        throw new Error(
          "Finish or discard your current draft before restoring a backup that also has an unfinished draft.",
        );
      const imported = prepareImport(pending);
      setPending(null);
      await importLibrary(imported);
      setMessage(
        "Restored books are in the book selector with “(restored)” in the title. Your existing books are still there.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Restore could not finish. Keep the backup file and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <p className="text-lg text-ink-soft">
        Your library lives in this browser on this device. A backup includes every book, original
        transcript, saved recording, unfinished draft, and previous page version.
      </p>
      <p className="text-base text-ink-soft">
        Download a backup after a writing session. Keep it in Files, on another device, or on a USB
        drive. Signing in does not create a cloud backup.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => void download()}>
          <Download className="size-5" />
          Download backup
        </Button>
        <Button disabled={busy} variant="secondary" onClick={() => file.current?.click()}>
          <FolderOpen className="size-5" />
          Restore a backup
        </Button>
      </div>
      <div className="space-y-3 border-t border-rule pt-4">
        <Button disabled={busy} variant="secondary" onClick={() => void download(true, true)}>
          <Share className="size-5" />
          Prepare backup for Files
        </Button>
        {prepared && (
          <Button
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void shareFile(prepared)
                .then((result) =>
                  setMessage(
                    result === "cancelled"
                      ? "Sharing cancelled. Your prepared backup is still here."
                      : result === "shared"
                        ? "Backup handed to the share sheet. Check Files for your saved copy."
                        : "Backup download started. Keep it somewhere safe.",
                  ),
                )
                .catch((error) => setMessage(error.message))
                .finally(() => setBusy(false));
            }}
          >
            Save or share backup
          </Button>
        )}
      </div>
      <details className="text-base text-ink-soft">
        <summary className="cursor-pointer">Back up words without recordings</summary>
        <p className="my-3">
          If a recording is missing or your full backup is too large, save every book, transcript,
          draft, and page history in a smaller backup. Audio is left out of this file.
        </p>
        <Button disabled={busy} variant="secondary" size="md" onClick={() => void download(false)}>
          Save text-only backup
        </Button>
      </details>
      <input
        ref={file}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="Choose a Ghostwriter backup"
        onChange={(e) => {
          const input = e.target.files?.[0];
          e.target.value = "";
          if (input) void inspect(input);
        }}
      />
      {pending && (
        <div className="space-y-3 rounded-lg border border-rule p-4">
          <p>
            Restore {pending.state.books.length} book(s), {pending.state.chapters.length}{" "}
            chapter(s), and {pending.audio.length} recording(s) as additional copies?
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => void restore()}>
              Restore these books
            </Button>
            <Button disabled={busy} variant="quiet" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {message && (
        <p role="status" className="rounded-lg border border-rule bg-paper-deep p-4">
          {message}
        </p>
      )}
    </div>
  );
}
