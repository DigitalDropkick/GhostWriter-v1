import assert from "node:assert/strict";
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { checkedUrl } from "./browser-guard.mjs";

const base = checkedUrl(process.argv[2] || "http://127.0.0.1:8081/");
const output = "screenshots/qa-v3";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: existsSync(chromium.executablePath()) ? undefined : "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
  acceptDownloads: true,
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
const results = [],
  errors = [],
  uploads = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) uploads.push(request.url());
});
function pass(name) {
  results.push(name);
  console.log("PASS " + name);
}
try {
  await page.addInitScript(() => {
    window.__shared = [];
    window.__cancelShare = false;
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async ({ files }) => {
        if (window.__cancelShare) throw new DOMException("Cancelled", "AbortError");
        window.__shared.push({ name: files[0].name, text: await files[0].text() });
      },
    });
  });
  await page.goto(base);
  await page.getByRole("button", { name: "Start my book", exact: true }).waitFor();
  await page.screenshot({ path: `${output}/welcome-phone.png`, fullPage: true });
  const manifestLinks = await page
    .locator('link[rel="manifest"]')
    .evaluateAll((links) => links.map((l) => l.getAttribute("href")));
  assert.deepEqual(manifestLinks, ["/ghostwriter.webmanifest"]);
  assert.deepEqual(
    await page
      .locator('link[rel="apple-touch-icon"]')
      .evaluateAll((links) => links.map((l) => l.getAttribute("href"))),
    ["/ghostwriter-icons/icon-180.png"],
  );
  const manifest = await (
    await context.request.get(new URL("/ghostwriter.webmanifest", base).href)
  ).json();
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.name, "Ghostwriter");
  for (const icon of manifest.icons)
    assert.equal((await context.request.get(new URL(icon.src, base).href)).status(), 200);
  pass("one branded Home Screen manifest, correct icons, and standalone launch");
  await page.getByRole("button", { name: "Start my book", exact: true }).click();
  await page.getByLabel("Author name", { exact: true }).fill("Test Author");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Book title", { exact: true }).fill("The stories I carry");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Open the writing room", exact: true }).click();
  await page.getByRole("button", { name: "Type instead", exact: true }).click();
  const words =
    "The creek behind our house was where the story began.\n\nThese are my own words — café and y’all.";
  await page.getByLabel("Words to add to your book", { exact: true }).fill(words);
  await page.getByRole("button", { name: "Write this into the book", exact: true }).click();
  await page.getByText("Saved on this device", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Books", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "New chapter", exact: true }).click();
  await page.getByRole("button", { name: "Chapter 1", exact: false }).click();
  assert.ok((await page.locator("article").innerText()).includes(words));
  pass("touch onboarding, exact manuscript insertion, and chapter navigation");
  await page.getByRole("button", { name: "Share book", exact: true }).click();
  await page.waitForFunction(() => window.__shared.length > 0);
  assert.ok((await page.evaluate(() => window.__shared.at(-1).text)).includes(words));
  await page.getByRole("button", { name: "Keep safe", exact: true }).click();
  await page.getByRole("button", { name: "Prepare backup for Files", exact: true }).click();
  await page.getByRole("button", { name: "Save or share backup", exact: true }).waitFor();
  let downloads = 0;
  page.on("download", () => downloads++);
  await page.evaluate(() => {
    window.__cancelShare = true;
  });
  await page.getByRole("button", { name: "Save or share backup", exact: true }).click();
  await page.getByText("Sharing cancelled. Your prepared backup is still here.").waitFor();
  assert.equal(downloads, 0);
  await page.evaluate(() => {
    window.__cancelShare = false;
  });
  await page.getByRole("button", { name: "Save or share backup", exact: true }).click();
  await page.getByText(/Backup handed to the share sheet/).waitFor();
  const backup = JSON.parse(await page.evaluate(() => window.__shared.at(-1).text));
  assert.ok(backup.state.chapters.some((c) => c.body === words));
  await page.getByLabel("Choose a Ghostwriter backup", { exact: true }).setInputFiles({ name: "phone-restore.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole("button", { name: "Restore these books", exact: true }).click();
  await page.getByText(/Restored books are in the book selector/).waitFor();
  assert.equal(await page.getByRole("button", { name: "Save or share backup", exact: true }).count(), 0);
  pass("manuscript/backup sharing preserves words, cancellation does not download, and restore clears stale prepared backups");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "More options", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Extra large", exact: true }).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(450);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    assert.equal(await page.getByRole("button", { name: "Talk", exact: true }).isVisible(), true);
    await page.getByRole("button", { name: "Write", exact: true }).click();
    await page.screenshot({ path: `${output}/writing-${width}.png`, fullPage: false });
    await page.getByRole("button", { name: "Books", exact: true }).click();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    await page.getByRole("button", { name: "Close", exact: true }).click();
  }
  pass("320, 390 and 430px phone screens and library sheets fit with extra-large reading text");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const cached = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((n) => n.startsWith("ghostwriter-app-"));
    return (
      await Promise.all(
        names.map(async (n) =>
          (await (await caches.open(n)).keys()).map((r) => new URL(r.url).pathname),
        ),
      )
    ).flat();
  });
  assert.ok(cached.includes("/"));
  assert.ok(cached.some((p) => p.endsWith(".js")));
  assert.ok(
    !cached.some((p) => p.startsWith("/api/") || p.startsWith("/auth/") || p.includes("_serverFn")),
  );
  await context.setOffline(true);
  await page.reload();
  await page.getByText("Saved on this device", { exact: true }).waitFor();
  assert.ok((await page.locator("article").innerText()).includes(words));
  await page.getByRole("button", { name: "Type instead", exact: true }).click();
  await page
    .getByLabel("Words to add to your book", { exact: true })
    .fill("Written without internet.");
  await page.getByRole("button", { name: "Keep draft for later", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Continue my draft", exact: true }).click();
  assert.equal(
    await page.getByLabel("Words to add to your book", { exact: true }).inputValue(),
    "Written without internet.",
  );
  await page.getByRole("button", { name: "Write this into the book", exact: true }).click();
  await context.setOffline(false);
  pass(
    "offline cold reload preserves library, editing and unfinished drafts; auth/API are uncached",
  );
  await page.addInitScript(() => {
    window.Worker = class {
      onmessage = null;
      postMessage(message) {
        setTimeout(
          () =>
            this.onmessage?.({
              data:
                message.type === "prepare"
                  ? { type: "ready" }
                  : { type: "result", text: "Recovered phone passage." },
            }),
          10,
        );
      }
      terminate() {
        this.onmessage = null;
      }
    };
  });
  await page.reload();
  await page.getByRole("button", { name: "Talk", exact: true }).click();
  await page.getByRole("button", { name: "Start private dictation", exact: true }).click();
  await page.getByText("Recording your voice", { exact: true }).waitFor();
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.getByLabel("Words to add to your book", { exact: true }).waitFor();
  await page.getByText("Saved on this device", { exact: true }).waitFor();
  const recovery = await page.evaluate(async () => {
    const db = await new Promise((resolve) => {
      const r = indexedDB.open("ghostwriter", 1);
      r.onsuccess = () => resolve(r.result);
    });
    const get = (store, key) =>
      new Promise((resolve) => {
        const r = db.transaction(store).objectStore(store).get(key);
        r.onsuccess = () => resolve(r.result);
      });
    const state = await get("kv", "state");
    const blob = await get("audio", state.draft.audioId);
    db.close();
    return { audio: !!blob, words: state.draft.transcript };
  });
  assert.equal(recovery.audio, true);
  assert.equal(recovery.words, "");
  await page.reload();
  await page.getByRole("button", { name: "Continue my draft", exact: true }).click();
  await page.getByRole("button", { name: "Transcribe again", exact: true }).click();
  await page.getByLabel("Words to add to your book", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Words to add to your book", { exact: true }).inputValue(),
    "Recovered phone passage.",
  );
  pass("synthetic phone interruption stops recording, saves audio and recovers after reload");
  assert.deepEqual(errors, []);
  assert.deepEqual(uploads, []);
  pass("no uncaught page errors or outbound uploads");
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  console.error((await page.locator("body").innerText()).slice(0, 4000));
  throw error;
} finally {
  await writeFile(
    `${output}/iphone-results.json`,
    JSON.stringify(
      {
        base,
        results,
        errors,
        uploads,
        device: "Chromium touch emulation; physical iPhone not tested",
      },
      null,
      2,
    ),
  );
  await browser.close();
}
