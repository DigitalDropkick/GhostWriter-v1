import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const url = process.argv[2] || "http://127.0.0.1:8080/getting-started.html";
const pdfPath = process.argv[3] || "/workspace/public/getting-started.pdf";
const pngPath = process.argv[4] || "/workspace/screenshots/getting-started.png";

await mkdir(dirname(pdfPath), { recursive: true });
await mkdir(dirname(pngPath), { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

await page.screenshot({ path: pngPath, fullPage: true });

const pdf = await page.pdf({
  path: pdfPath,
  format: "Letter",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});

const pages = countPdfPages(pdf);
console.log(JSON.stringify({ pdfPath, pngPath, bytes: pdf.length, pages }));
if (pages !== 1) {
  console.error(`Expected 1 page, got ${pages}`);
  process.exitCode = 1;
}
await browser.close();

function countPdfPages(buf) {
  const text = buf.toString("latin1");
  const m = text.match(/\/Count\s+(\d+)/);
  if (m) return Number(m[1]);
  return (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
}
