import assert from "node:assert/strict";
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { checkedUrl } from "./browser-guard.mjs";

const base = checkedUrl(process.argv[2] || "http://127.0.0.1:4317");
const output = "screenshots/qa-recovery";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (existsSync(chromium.executablePath()) ? undefined : "/usr/bin/google-chrome"),
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const results = [];
const fixture = () => ({
  books: [{ id: "book", title: "Recovery fixture", author: "Test Author", kind: "other", polish: "faithful", voiceNotes: "", createdAt: 1, updatedAt: 1 }],
  chapters: [{ id: "chapter", bookId: "book", title: "Chapter 1", body: "Words already saved.", sort: 0, updatedAt: 1 }],
  sessions: [], revisions: [], draft: null,
  currentBookId: "book", currentChapterId: "chapter",
  settings: { typeSize: "large", helpDismissed: false },
});
const wav = Buffer.alloc(44 + 16000 * 2);
wav.write("RIFF"); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(16000, 24); wav.writeUInt32LE(32000, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36);
wav.writeUInt32LE(wav.length - 44, 40);
for (let i = 0; i < 16000; i++) wav.writeInt16LE(Math.round(Math.sin(i * 0.12) * 6000), 44 + i * 2);

async function seed(page, state) {
  await page.goto(base);
  await page.getByRole("button", { name: "Start my book", exact: true }).waitFor();
  await page.evaluate(async (state) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("ghostwriter", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(state, "state");
    tx.objectStore("kv").put(1, "revision");
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onabort = () => reject(tx.error); });
    db.close();
  }, state);
  await page.reload();
  await page.getByText("Saved on this computer", { exact: true }).waitFor();
}
async function stored(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve) => {
      const request = indexedDB.open("ghostwriter", 1);
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction(["kv", "audio"], "readonly");
    const state = tx.objectStore("kv").get("state");
    const audio = tx.objectStore("audio").getAllKeys();
    await new Promise((resolve) => { tx.oncomplete = resolve; });
    db.close();
    return { state: state.result, audio: audio.result };
  });
}
async function scenario(name, run) {
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  const uploads = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) uploads.push(request.url());
  });
  try {
    await run(page);
    assert.deepEqual(errors, []);
    assert.deepEqual(uploads, []);
    results.push({ name, ok: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
    console.error(`FAIL ${name}: ${error.message}`);
    await page.screenshot({ path: `${output}/failure-${results.length}.png`, fullPage: true });
  } finally { await context.close(); }
}

try {
  await scenario("cancelled audio import cannot overwrite words typed afterward", async (page) => {
    await page.addInitScript(() => {
      window.Worker = class {
        onmessage = null;
        postMessage(message) {
          setTimeout(() => this.onmessage?.({ data: message.type === "prepare"
            ? { type: "ready" } : { type: "result", text: "Late transcription must not replace my words." } }), 700);
        }
        terminate() { this.onmessage = null; }
      };
      const descriptor = Object.getOwnPropertyDescriptor(IDBTransaction.prototype, "oncomplete");
      Object.defineProperty(IDBTransaction.prototype, "oncomplete", {
        configurable: true, get: descriptor.get,
        set(callback) {
          descriptor.set.call(this, this.mode === "readwrite" && this.objectStoreNames.contains("audio")
            ? (event) => setTimeout(() => callback?.call(this, event), 1400) : callback);
        },
      });
    });
    await seed(page, fixture());
    await page.getByRole("button", { name: "Talk", exact: true }).click();
    await page.getByLabel("Open an audio recording", { exact: true }).setInputFiles({ name: "tone.wav", mimeType: "audio/wav", buffer: wav });
    await page.getByRole("button", { name: "Cancel processing", exact: true }).click();
    await page.getByLabel("Words to add to your book", { exact: true }).fill("Keep the words I typed after cancellation.");
    await page.waitForTimeout(3200);
    assert.equal(await page.getByLabel("Words to add to your book", { exact: true }).inputValue(), "Keep the words I typed after cancellation.");
  });

  await scenario("failed restore is atomic, remains exportable, and retries without duplicate books", async (page) => {
    await seed(page, fixture());
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put;
      window.__failRestore = true;
      IDBObjectStore.prototype.put = function (value, key) {
        if (window.__failRestore && key === "state") throw new DOMException("Disk full", "QuotaExceededError");
        return put.call(this, value, key);
      };
    });
    const incoming = fixture();
    incoming.books[0].title = "Imported book";
    incoming.sessions = [{ id: "session", bookId: "book", chapterId: "chapter", transcript: "Original recording words.", audioId: "recording", durationMs: 1000, createdAt: 1 }];
    const backup = { format: "ghostwriter-backup", version: 1, createdAt: new Date().toISOString(), state: incoming,
      audio: [{ id: "recording", type: "audio/wav", data: wav.toString("base64") }] };
    await page.getByRole("button", { name: "Backups", exact: true }).click();
    await page.getByLabel("Choose a Ghostwriter backup", { exact: true }).setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
    await page.getByRole("button", { name: "Restore these books", exact: true }).click();
    await page.getByRole("dialog").getByRole("status").filter({ hasText: /Disk full|could not save/ }).waitFor();
    const disk = await stored(page);
    assert.equal(disk.state.books.length, 1);
    assert.deepEqual(disk.audio, [], "No orphan audio may remain from a failed restore");
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download backup", exact: true }).click();
    const download = await downloadEvent;
    const recovered = JSON.parse(await readFile(await download.path(), "utf8"));
    assert.equal(recovered.state.books.length, 2);
    assert.equal(recovered.audio[0].data, wav.toString("base64"));
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.evaluate(() => { window.__failRestore = false; });
    await page.getByRole("button", { name: "Retry saving", exact: true }).click();
    await page.getByText("Saved on this computer", { exact: true }).waitFor();
    await page.reload();
    const saved = await stored(page);
    assert.equal(saved.state.books.length, 2);
    assert.equal(saved.audio.length, 1);
  });

  await scenario("missing audio still permits a complete text-only recovery backup", async (page) => {
    const state = fixture();
    state.draft = { bookId: "book", chapterId: "chapter", transcript: "Unfinished words.", originalTranscript: "Raw words.", audioId: "missing", durationMs: 10 };
    state.revisions = [{ id: "r", chapterId: "chapter", title: "Old title", body: "Older words.", createdAt: 1 }];
    await seed(page, state);
    await page.getByRole("button", { name: "Backups", exact: true }).click();
    await page.getByRole("button", { name: "Download backup", exact: true }).click();
    await page.getByRole("status").filter({ hasText: /recording is missing/ }).waitFor();
    await page.getByText("Back up words without recordings", { exact: true }).click();
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save text-only backup", exact: true }).click();
    const download = await event;
    const backup = JSON.parse(await readFile(await download.path(), "utf8"));
    assert.deepEqual(backup.state.chapters, state.chapters);
    assert.deepEqual(backup.state.revisions, state.revisions);
    assert.deepEqual(backup.state.draft, { ...state.draft, audioId: null });
    assert.deepEqual(backup.audio, []);
  });

  await scenario("history keeps title-only changes when restoring an earlier page", async (page) => {
    const state = fixture();
    state.chapters[0].title = "My corrected title";
    state.revisions = [{ id: "r", chapterId: "chapter", title: "Earlier title", body: state.chapters[0].body, createdAt: 1 }];
    await seed(page, state);
    await page.getByRole("button", { name: "Page history", exact: true }).click();
    await page.getByRole("dialog").locator("details").first().locator("summary").click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Restore this page", exact: true }).first().click();
    await page.getByText("Saved on this computer", { exact: true }).waitFor();
    assert.ok((await stored(page)).state.revisions.some((revision) => revision.title === "My corrected title"));
  });

  await scenario("a crashed speech worker can retry and long recordings finish automatically", async (page) => {
    await page.addInitScript(() => {
      window.__workerCount = 0;
      window.Worker = class {
        onmessage = null;
        onerror = null;
        constructor() { this.fail = ++window.__workerCount === 1; }
        postMessage(message) {
          setTimeout(() => {
            if (this.fail) this.onerror?.(new Error("Synthetic worker failure"));
            else this.onmessage?.({ data: message.type === "prepare"
              ? { type: "ready" } : { type: "result", text: "Recovered after restarting private dictation." } });
          }, 10);
        }
        terminate() { this.onmessage = this.onerror = null; }
      };
    });
    await seed(page, fixture());
    await page.getByRole("button", { name: "Talk", exact: true }).click();
    await page.getByRole("button", { name: "Start private dictation", exact: true }).click();
    await page.getByText(/Private dictation could not start/).waitFor();
    await page.getByRole("button", { name: "Start private dictation", exact: true }).click();
    await page.getByText("Recording your voice", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.__workerCount), 2);
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const now = Date.now;
      Date.now = () => now() + 55 * 60 * 1000;
    });
    await page.getByLabel("Words to add to your book", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("Words to add to your book", { exact: true }).inputValue(), "Recovered after restarting private dictation.");
    assert.ok((await stored(page)).state.draft.audioId);
  });

  await scenario("text export and printing include every chapter and preserve Unicode", async (page) => {
    const state = fixture();
    state.chapters[0].body = "Family stories — café, y’all, and tomorrow.\n\n".repeat(80).trim();
    state.chapters.push({ ...state.chapters[0], id: "second", title: "Another chapter", body: "The final chapter is included too.", sort: 1 });
    await seed(page, state);
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save a text copy", exact: true }).click();
    const download = await event;
    const text = await readFile(await download.path(), "utf8");
    for (const chapter of state.chapters) { assert.ok(text.includes(chapter.title)); assert.ok(text.includes(chapter.body)); }
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator(".print-only").isVisible(), true);
    const printed = await page.locator(".print-only").innerText();
    assert.ok(printed.includes("Another chapter"));
    assert.ok(printed.includes("The final chapter is included too."));
    const pdf = await page.pdf({ path: `${output}/synthetic-manuscript.pdf`, format: "Letter" });
    assert.ok(pdf.length > 10000);
  });

  await scenario("installed-voice reading covers the entire page at the selected speed", async (page) => {
    const state = fixture();
    state.chapters[0].body = "Every chapter deserves to be heard. ".repeat(60).trim();
    await seed(page, state);
    await page.evaluate(() => {
      window.__spokenChunks = [];
      window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
      speechSynthesis.getVoices = () => [{ localService: true, default: true, lang: "en-US", name: "Local test voice" }];
      speechSynthesis.speak = (utterance) => {
        window.__spokenChunks.push({ text: utterance.text, rate: utterance.rate });
        setTimeout(() => utterance.onend?.(), 10);
      };
    });
    await page.getByText("Reading speed & recordings", { exact: true }).click();
    await page.getByLabel("Reading speed", { exact: true }).selectOption("0.75");
    await page.getByRole("button", { name: "Listen to the page", exact: true }).click();
    await page.getByRole("button", { name: "Listen to the page", exact: true }).waitFor();
    const spoken = await page.evaluate(() => window.__spokenChunks);
    assert.ok(spoken.length > 3);
    assert.equal(spoken.map((chunk) => chunk.text).join(" "), state.chapters[0].body);
    assert.ok(spoken.every((chunk) => chunk.rate === 0.75));
  });
} finally {
  await browser.close();
  await writeFile(`${output}/results.json`, JSON.stringify({ base, results }, null, 2));
}
if (results.some((result) => !result.ok)) process.exitCode = 1;
