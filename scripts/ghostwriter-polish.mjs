import assert from "node:assert/strict";
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { checkedUrl } from "./browser-guard.mjs";
const base = checkedUrl(process.argv[2] || "http://127.0.0.1:8081");
const output = "screenshots/qa-polish";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (existsSync(chromium.executablePath())
      ? undefined
      : process.platform === "win32"
        ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
        : "/usr/bin/google-chrome"),
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [],
  violations = [],
  checks = [],
  submissions = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (msg) => {
  if (msg.type() === "error" && /Content Security Policy|violates.*directive/.test(msg.text()))
    violations.push(msg.text());
});
const pass = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const fit = async () => {
  const overflow = await page.evaluate(() =>
    Array.from(document.querySelectorAll("body *"))
      .map((el) => {
        const b = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          class: String(el.className).slice(0, 130),
          x: b.x,
          width: b.width,
        };
      })
      .filter((el) => el.width && (el.x < -1 || el.x + el.width > innerWidth + 1))
      .slice(0, 15),
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
    JSON.stringify(overflow),
  );
  const dialog = page.getByRole("dialog");
  if (await dialog.count()) {
    const box = await dialog.boundingBox();
    assert.ok(box.x >= 0 && box.width + box.x <= page.viewportSize().width + 1);
    assert.ok(box.y >= 0 && box.height + box.y <= page.viewportSize().height + 1);
    assert.equal(await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1), false);
  }
};
try {
  await page.goto(base);
  await page.getByRole("button", { name: "Start my book", exact: true }).waitFor();
  await page.screenshot({ path: `${output}/welcome-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
  await fit();
  await page.screenshot({ path: `${output}/welcome-large-text.png`, fullPage: true });
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Start my book", exact: true }).click();
  await page.getByLabel("Author name", { exact: true }).fill("A. Writer");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Book title", { exact: true }).fill("A life in stories");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Open the writing room", exact: true }).click();
  await page.getByText("Saved on this device", { exact: true }).waitFor();
  for (const [name, image] of [
    ["Backups", "backup"],
    ["Page history", "history"],
    ["Settings", "settings"],
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.setViewportSize({ width: 320, height: 844 });
    await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
    await fit();
    await page.screenshot({ path: `${output}/${image}-large-text.png` });
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  }
  pass(
    "welcome, backup, history and settings fit 320px with 200% base text and scrollable dialogs",
  );
  await page.evaluate(() => {
    const prompt = new Event("beforeinstallprompt", { cancelable: true });
    prompt.prompt = async () => {};
    prompt.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(prompt);
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Install Ghostwriter", exact: true }).click();
  await page.getByRole("button", { name: "Install on this device", exact: true }).click();
  await page.getByText(/Installation cancelled/).waitFor();
  await page.getByText(/Ready to reopen offline/).waitFor();
  await page.screenshot({ path: `${output}/install-desktop.png` });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
  await fit();
  await page.screenshot({ path: `${output}/install-large-text.png` });
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  pass(
    "install prompt cancellation is honest; separate offline readiness and phone instructions fit large text",
  );
  await context.route("**/api/features", (route) =>
    route.fulfill({ json: { onlineWritingHelp: true } }),
  );
  let fail = true;
  await context.route("**/api/writing-help", (route) => {
    submissions.push(route.request().postDataJSON());
    return route.fulfill({
      status: fail ? 502 : 200,
      json: fail
        ? { ok: false, error: "Writing help could not finish. Your original words are unchanged." }
        : { ok: true, body: "Suggested wording for review." },
    });
  });
  await page.reload();
  await page.getByRole("button", { name: "Type instead", exact: true }).click();
  const words = page.getByLabel("Words to add to your book", { exact: true });
  await words.fill("Original private passage.");
  await page.getByText("Draft tools", { exact: true }).click();
  await page.getByRole("button", { name: "Review online writing help", exact: true }).click();
  assert.equal(submissions.length, 0);
  await page.getByRole("button", { name: "Keep it private", exact: true }).click();
  assert.equal(submissions.length, 0);
  for (const failure of [true, false]) {
    fail = failure;
    if (
      !(await page
        .getByRole("button", { name: "Review online writing help", exact: true })
        .isVisible())
    )
      await page.getByText("Draft tools", { exact: true }).click();
    await page.getByRole("button", { name: "Review online writing help", exact: true }).click();
    await page.getByRole("button", { name: "Send this text to xAI", exact: true }).click();
    await words.waitFor();
    assert.equal(
      await words.inputValue(),
      failure ? "Original private passage." : "Suggested wording for review.",
    );
  }
  assert.equal(
    await page
      .getByText("Writing help could not finish. Your original words are unchanged.", {
        exact: true,
      })
      .count(),
    0,
  );
  assert.equal(submissions.length, 2);
  for (const submission of submissions) {
    assert.deepEqual(Object.keys(submission).sort(), [
      "kind",
      "onlineConsent",
      "polish",
      "transcript",
      "voiceNotes",
    ]);
    assert.equal(submission.onlineConsent, true);
    assert.equal(submission.transcript, "Original private passage.");
  }
  await page.getByText("Draft tools", { exact: true }).click();
  await page.getByRole("button", { name: "Restore my original wording", exact: true }).click();
  assert.equal(await words.inputValue(), "Original private passage.");
  pass(
    "mocked online editor needs per-passage consent, sends text only, preserves failed/original wording",
  );
  // A changed script URL creates a new worker even when the release bytes match.
  await page.evaluate(() =>
    navigator.serviceWorker.register("/ghostwriter-sw.js?update-test", {
      scope: "/",
      updateViaCache: "none",
    }),
  );
  await page.waitForFunction(
    async () => !!(await navigator.serviceWorker.getRegistration()).waiting,
  );
  assert.equal(await words.inputValue(), "Original private passage.");
  pass("service worker update waits while an active draft stays unchanged");
  assert.deepEqual(errors, []);
  assert.deepEqual(violations, []);
  pass("no application errors or content-security-policy violations");
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  throw error;
} finally {
  await writeFile(
    `${output}/results.json`,
    JSON.stringify({ checks, errors, violations }, null, 2),
  );
  await browser.close();
}
