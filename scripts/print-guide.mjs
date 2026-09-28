import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { checkedUrl } from "./browser-guard.mjs";
const base = checkedUrl(process.argv[2] || "http://127.0.0.1:8081");
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (existsSync(chromium.executablePath())
      ? undefined
      : process.platform === "win32"
        ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
        : "/usr/bin/google-chrome"),
});
try {
  const page = await browser.newPage();
  const response = await page.goto(new URL("/getting-started.html", base).href);
  if (
    response.status() !== 200 ||
    !(await page.getByText("Your story, in your words.", { exact: true }).count())
  )
    throw new Error("Guide not available");
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: "public/getting-started.pdf",
    format: "Letter",
    preferCSSPageSize: true,
    printBackground: true,
  });
  console.log("Printed current client guide to public/getting-started.pdf");
} finally {
  await browser.close();
}
