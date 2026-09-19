import { downloadBlob } from "./utils";

// Invoke from a button click with an already-prepared File. iOS requires the
// share sheet to start within a user gesture, not after an IndexedDB read.
export async function shareFile(file: File): Promise<"shared" | "downloaded" | "cancelled"> {
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      throw new Error("The share sheet could not open. Use Download instead, or try again.");
    }
  }
  downloadBlob(file.name, file);
  return "downloaded";
}
