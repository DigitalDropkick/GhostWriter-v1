import assert from "node:assert/strict";
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { checkedUrl } from "./browser-guard.mjs";

const base = checkedUrl(process.argv[2] || "http://127.0.0.1:4317");
const speechTest = process.argv.includes("--speech");
const output = resolve("screenshots/qa-review");
await mkdir(output, { recursive: true });
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync(chromium.executablePath()) ? undefined : "/usr/bin/google-chrome");
const browser = await chromium.launch({
  executablePath,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
const checks = [];
const errors = [];
let lastPage;
const mutations = [];
const note = (name) => {
  checks.push(name);
  console.log(`PASS ${name}`);
};
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  context.on("page", (page) => {
    page.on("pageerror", (error) => errors.push(error.message));
  });
  context.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method()))
      mutations.push({ method: request.method(), url: request.url() });
  });
  const page = await context.newPage();
  lastPage = page;
  page.setDefaultTimeout(15000);
  await page.goto(base);
  await page.getByRole("button", { name: "Start my book", exact: true }).click();
  await page.getByLabel("Author name", { exact: true }).fill("Test Author");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Book title", { exact: true }).fill("Lessons from the Classroom");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Something else", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: /^Keep my words/ }).click();
  await page.getByRole("button", { name: "Open the writing room", exact: true }).click();
  await page.getByText("Saved on this computer", { exact: true }).waitFor();
  const bookId = await page.getByLabel("Your books", { exact: true }).inputValue();
  note("onboarding creates an author's book");

  const first =
    "Every student brought a different story to our classroom.\n\nI learned to listen before I began to teach.";
  await page.getByRole("button", { name: "Type instead", exact: true }).click();
  await page.getByLabel("Words to add to your book", { exact: true }).fill(first);
  await page.getByRole("button", { name: "Keep draft for later", exact: true }).click();
  await page.getByText("Saved on this computer", { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Continue my draft", exact: true }).click();
  assert.equal(
    await page.getByLabel("Words to add to your book", { exact: true }).inputValue(),
    first,
  );
  await page.getByRole("button", { name: "Write this into the book", exact: true }).click();
  await page.getByText("Saved on this computer", { exact: true }).waitFor();
  assert.ok((await page.locator("article").innerText()).includes("I learned to listen"));
  note("unfinished draft survives reload and is inserted exactly once");

  await page.getByRole("button", { name: "Type instead", exact: true }).click();
  await page.getByLabel("Words to add to your book", { exact: true }).fill("Yes.");
  await page.getByRole("button", { name: "Write this into the book", exact: true }).click();
  await page.getByRole("button", { name: "Edit the page myself", exact: true }).click();
  assert.equal(
    await page.getByLabel("Chapter text", { exact: true }).inputValue(),
    `${first}\n\nYes.`,
  );
  await page.getByRole("button", { name: "Done editing the page", exact: true }).click();
  note("short passages append without rewriting any earlier words");

  await page.getByRole("button", { name: "Page history", exact: true }).click();
  const history = page.getByRole("dialog");
  await history.locator("details").first().locator("summary").click();
  page.once("dialog", (dialog) => dialog.accept());
  await history.getByRole("button", { name: "Restore this page", exact: true }).first().click();
  await page.getByRole("button", { name: "Edit the page myself", exact: true }).click();
  assert.equal(await page.getByLabel("Chapter text", { exact: true }).inputValue(), first);
  await page.getByRole("button", { name: "Done editing the page", exact: true }).click();
  note("page history restores an earlier version");

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Start another book", exact: true }).click();
  await page.getByLabel("Your books", { exact: true }).selectOption(bookId);
  assert.ok((await page.locator("article").innerText()).includes("I learned to listen"));
  note("book selector returns to earlier books");

  await page.getByRole("button", { name: "Backups", exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup", exact: true }).click();
  const backup = await downloadEvent;
  const backupPath = resolve(output, "test-library.json");
  await backup.saveAs(backupPath);
  const backupData = JSON.parse(await readFile(backupPath, "utf8"));
  assert.equal(backupData.format, "ghostwriter-backup");
  assert.ok(backupData.state.chapters.some((c) => c.body === first));
  await page.getByLabel("Choose a Ghostwriter backup", { exact: true }).setInputFiles(backupPath);
  await page.getByRole("button", { name: "Restore these books", exact: true }).click();
  await page.getByText(/Restored books are in the book selector/).waitFor();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  assert.ok((await page.getByLabel("Your books", { exact: true }).locator("option").count()) >= 6);
  note("backup downloads and restores as additional books");

  await page.getByLabel("Your books", { exact: true }).selectOption(bookId);
  await page.getByRole("button", { name: "Type instead", exact: true }).click();
  await page
    .getByLabel("Words to add to your book", { exact: true })
    .fill("Another classroom memory.");
  await page.getByText("Optional writing help & draft tools", { exact: true }).click();
  const beforeConsent = mutations.length;
  await page.getByRole("button", { name: "Review online writing help", exact: true }).click();
  await page.getByRole("button", { name: "Keep it private", exact: true }).click();
  assert.equal(mutations.length, beforeConsent);
  await page.getByLabel("Start a new chapter", { exact: true }).check();
  await page.getByRole("button", { name: "Write this into the book", exact: true }).click();
  assert.equal(await page.locator("article h1").innerText(), "Chapter 2");
  note("online help requires a separate explicit send; new chapter destination works");

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Extra large", exact: true }).click();
  for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  note("settings trap keyboard focus, close with Escape, and offer larger text");

  await page.screenshot({ path: `${output}/desk-desktop.png`, fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    // Let the toaster's responsive transform finish before capturing it.
    await page.waitForTimeout(450);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    await page.screenshot({ path: `${output}/desk-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Type instead", exact: true }).click();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    await page.screenshot({ path: `${output}/draft-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Keep draft for later", exact: true }).click();
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator(".print-only").isVisible(), true);
  assert.equal(await page.getByRole("button", { name: "Talk", exact: true }).isVisible(), false);
  await page.emulateMedia({ media: "screen" });
  note("desktop, 390px and 320px layouts fit; print shows the book only");

  // A second tab must fail safely rather than overwrite changes it never loaded.
  await page.getByText("Saved on this computer", { exact: true }).waitFor();
  const secondTab = await context.newPage();
  await secondTab.goto(base);
  await secondTab.getByRole("button", { name: "Edit the page myself", exact: true }).click();
  await secondTab.getByLabel("Chapter text", { exact: true }).fill("Saved from the second tab.");
  await secondTab.getByText("Saved on this computer", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Edit the page myself", exact: true }).click();
  await page.getByLabel("Chapter text", { exact: true }).fill("Unsaved words from the older tab.");
  await page.getByText(/Another Ghostwriter tab saved changes/).waitFor();
  assert.equal(
    await secondTab.getByLabel("Chapter text", { exact: true }).inputValue(),
    "Saved from the second tab.",
  );
  note("concurrent tabs report conflict and preserve the newer save");
  await page.close({ runBeforeUnload: false });
  await secondTab.close();

  // Make the initial read slower than the former 1.2 second fallback.
  const slow = await context.newPage();
  await slow.addInitScript(() => {
    const descriptor = Object.getOwnPropertyDescriptor(IDBTransaction.prototype, "oncomplete");
    Object.defineProperty(IDBTransaction.prototype, "oncomplete", {
      configurable: true,
      get: descriptor.get,
      set(callback) {
        descriptor.set.call(
          this,
          this.mode === "readonly"
            ? (event) => setTimeout(() => callback?.call(this, event), 1900)
            : callback,
        );
      },
    });
  });
  await slow.goto(base);
  await slow.getByText("Opening your books…", { exact: true }).waitFor();
  await slow.getByRole("button", { name: "Edit the page myself", exact: true }).click();
  assert.equal(
    await slow.getByLabel("Chapter text", { exact: true }).inputValue(),
    "Saved from the second tab.",
  );
  note("slow storage loads the real library without overwriting it");
  await slow.close();

  const unavailable = await context.newPage();
  await unavailable.addInitScript(() => {
    indexedDB.open = () => {
      throw new DOMException("Storage unavailable", "SecurityError");
    };
  });
  await unavailable.goto(base);
  await unavailable.getByText("Your books need attention", { exact: true }).waitFor();
  assert.equal(
    await unavailable.getByRole("button", { name: "Start my book", exact: true }).count(),
    0,
  );
  note("unavailable storage blocks editing instead of replacing saved work");
  await unavailable.close();

  const quota = await context.newPage();
  await quota.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (key === "state") throw new DOMException("Disk full", "QuotaExceededError");
      return put.call(this, value, key);
    };
  });
  await quota.goto(base);
  await quota.getByRole("button", { name: "Edit the page myself", exact: true }).click();
  await quota
    .getByLabel("Chapter text", { exact: true })
    .fill("Keep these words even when storage is full.");
  await quota.getByText(/could not save your latest changes/).waitFor();
  assert.equal(
    await quota.getByLabel("Chapter text", { exact: true }).inputValue(),
    "Keep these words even when storage is full.",
  );
  note("full storage shows a persistent warning and retains unsaved text");
  await quota.close({ runBeforeUnload: false });

  for (const path of ["/api/transcribe", "/api/tts"]) {
    const result = await context.request.post(new URL(path, base).href, { data: "synthetic test" });
    assert.equal(result.status(), 410);
  }
  note("legacy audio and online-reading routes reject uploads");

  if (speechTest) {
    const voicePage = await context.newPage();
    lastPage = voicePage;
    voicePage.on("console", (msg) => {
      if (msg.type() === "error") console.log("SPEECH CONSOLE", msg.text().slice(0, 300));
    });
    voicePage.on("requestfailed", (req) =>
      console.log("SPEECH REQUEST FAILED", new URL(req.url()).hostname, req.failure()?.errorText),
    );
    voicePage.setDefaultTimeout(180000);
    await voicePage.goto(base);
    await voicePage.getByRole("button", { name: "Talk", exact: true }).click();
    const fixtureResponse = await context.request.get(
      "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav",
    );
    assert.equal(fixtureResponse.status(), 200);
    const sample = await fixtureResponse.body();
    await voicePage
      .getByLabel("Open an audio recording", { exact: true })
      .setInputFiles({ name: "public-jfk-sample.wav", mimeType: "audio/wav", buffer: sample });
    await voicePage.getByLabel("Words to add to your book", { exact: true }).waitFor();
    const transcript = await voicePage
      .getByLabel("Words to add to your book", { exact: true })
      .inputValue();
    assert.match(transcript, /fellow Americans/i);
    assert.match(transcript, /country can do for you/i);
    await voicePage.screenshot({ path: `${output}/private-transcription.png`, fullPage: true });
    note("real local Whisper worker transcribes public speech audio");
    // Inference must still work with every network connection disabled after loading.
    await context.setOffline(true);
    voicePage.once("dialog", (dialog) => dialog.accept());
    await voicePage.getByRole("button", { name: "Transcribe again", exact: true }).click();
    await voicePage.getByLabel("Words to add to your book", { exact: true }).waitFor();
    assert.match(
      await voicePage.getByLabel("Words to add to your book", { exact: true }).inputValue(),
      /fellow Americans/i,
    );
    await context.setOffline(false);
    await voicePage.getByRole("button", { name: "Write this into the book", exact: true }).click();
    await voicePage.getByLabel("Words to add to your book", { exact: true }).waitFor({ state: "hidden" });
    await voicePage.getByText("Saved on this computer", { exact: true }).waitFor();
    note("loaded speech engine transcribes with network disabled");
    await voicePage.close();
  }

  // Exercise the real MediaRecorder lifecycle using Chrome's synthetic microphone.
  // Inference is stubbed here; the optional speech test above uses the real model.
  const microphone = await context.newPage();
  lastPage = microphone;
  await microphone.addInitScript(() => {
    window.Worker = class {
      onmessage = null;
      postMessage(message) {
        setTimeout(() => this.onmessage?.({ data: message.type === "prepare"
          ? { type: "ready" } : { type: "result", text: "A passage from the test microphone." } }), 10);
      }
      terminate() {}
    };
  });
  await microphone.goto(base);
  await microphone.getByRole("button", { name: "Talk", exact: true }).click();
  await microphone.getByRole("button", { name: "Start private dictation", exact: true }).click();
  await microphone.getByText("Recording your voice", { exact: true }).waitFor();
  await microphone.waitForTimeout(1600);
  await microphone.getByRole("button", { name: "I’m finished", exact: true }).click();
  await microphone.getByLabel("Words to add to your book", { exact: true }).waitFor();
  assert.equal(await microphone.getByLabel("Words to add to your book", { exact: true }).inputValue(), "A passage from the test microphone.");
  const audioDownloadEvent = microphone.waitForEvent("download");
  await microphone.getByRole("button", { name: "Save recording", exact: true }).click();
  const audioDownload = await audioDownloadEvent;
  const recordingPath = resolve(output, "synthetic-recording.webm");
  await audioDownload.saveAs(recordingPath);
  assert.ok((await readFile(recordingPath)).length > 200);
  await microphone.getByRole("button", { name: "Write this into the book", exact: true }).click();
  await microphone.getByLabel("Words to add to your book", { exact: true }).waitFor({ state: "hidden" });
  note("real MediaRecorder finishes and saves a playable-format synthetic recording");

  await microphone.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Denied", "NotAllowedError"); };
  });
  await microphone.getByRole("button", { name: "Talk", exact: true }).click();
  await microphone.getByRole("button", { name: "Start private dictation", exact: true }).click();
  await microphone.getByText(/Microphone access was blocked/).waitFor();
  assert.equal(await microphone.getByText("Recording your voice", { exact: true }).count(), 0);
  await microphone.getByRole("button", { name: "Not now", exact: true }).click();
  note("denied microphone permission gives recovery steps without pretending to record");

  await microphone.evaluate(() => {
    window.__spoken = 0;
    speechSynthesis.getVoices = () => [{ localService: false, lang: "en-US", name: "Remote test voice" }];
    speechSynthesis.speak = () => { window.__spoken += 1; };
  });
  await microphone.getByRole("button", { name: "Listen to the page", exact: true }).click();
  await microphone.getByText(/No English voice installed for private reading/).waitFor();
  assert.equal(await microphone.evaluate(() => window.__spoken), 0);
  note("read-aloud refuses a remote voice when no local voice is available");
  await microphone.close();

  assert.deepEqual(mutations, [], "Private writing must not send any POST/upload request");
  assert.deepEqual(errors, [], "No browser runtime errors");
  note("private writing makes no upload requests and has no runtime errors");
  await writeFile(
    `${output}/browser-results.json`,
    JSON.stringify({ base, speechTest, checks, errors, mutations }, null, 2),
  );
} catch (error) {
  if (lastPage && !lastPage.isClosed()) {
    await lastPage.screenshot({ path: `${output}/failure.png`, fullPage: true });
    console.log((await lastPage.locator("body").innerText()).slice(-3500));
  }
  await writeFile(
    `${output}/browser-results.json`,
    JSON.stringify(
      { base, speechTest, checks, errors, mutations, failure: String(error) },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
