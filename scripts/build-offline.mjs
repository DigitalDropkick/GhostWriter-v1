import { createHash } from "node:crypto";
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");
export function workerSource(template, files) {
  return template
    .replace("__GHOSTWRITER_VERSION__", sha256(template + JSON.stringify(files)).slice(0, 16))
    .replace("/* __GHOSTWRITER_FILES__ */ {}", JSON.stringify(files));
}

export async function buildOffline(directory = "dist/client") {
  const root = resolve(directory);
  const shell = await readFile(resolve(root, "offline.html"), "utf8");
  if (
    !shell.includes('name="ghostwriter-shell"') ||
    !shell.includes("v4") ||
    /cf-access-jwt-assertion|CF_Authorization|PREVIEW_CLIENT_SECRET/.test(shell)
  ) {
    throw new Error("The generated shell is not a safe Ghostwriter document.");
  }
  const files = {};
  async function visit(dir) {
    for (const name of (await readdir(dir)).sort()) {
      const file = resolve(dir, name);
      if ((await stat(file)).isDirectory()) {
        await visit(file);
        continue;
      }
      const path = "/" + relative(root, file).split(sep).join("/");
      const ext = name.split(".").at(-1);
      const types = {
        js: "(?:java|ecma)script",
        mjs: "(?:java|ecma)script",
        css: "text/css",
        woff2: "(?:font/woff2|application/(?:font-woff|octet-stream))",
        wasm: "application/wasm",
        png: "image/png",
        svg: "image/svg\\+xml",
        pdf: "application/pdf",
        webmanifest: "(?:application/manifest\\+json|application/json)",
        html: "text/html",
      };
      if (
        !types[ext] ||
        path === "/ghostwriter-sw.js" ||
        (ext === "html" && !["/offline.html", "/getting-started.html"].includes(path))
      )
        continue;
      const bytes = await readFile(file);
      if (bytes.length > 25 * 1024 * 1024) throw new Error("Asset exceeds Worker limit: " + path);
      files[path] = { hash: sha256(bytes), type: types[ext], precache: ext !== "wasm" };
    }
  }
  await visit(root);
  const template = await readFile(new URL("./ghostwriter-sw.js", import.meta.url), "utf8");
  await writeFile(resolve(root, "ghostwriter-sw.js"), workerSource(template, files));
  console.log(
    `Offline shell verified; ${Object.keys(files).length} static files in the integrity manifest.`,
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await buildOffline();
