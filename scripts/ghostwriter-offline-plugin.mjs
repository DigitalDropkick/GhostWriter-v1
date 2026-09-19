import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

// Build-specific caches keep the document and its hashed scripts together.
export function ghostwriterOfflinePlugin() {
  return {
    name: "ghostwriter:offline",
    apply: "build",
    applyToEnvironment: (environment) => environment.name === "client",
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((name) => /\.(?:js|mjs|css|woff2)$/.test(name))
        .map((name) => `/${name}`);
      const publicAssets = [
        "/ghostwriter.webmanifest",
        "/ghostwriter-icons/icon-180.png",
        "/ghostwriter-icons/icon-192.png",
        "/ghostwriter-icons/icon-512.png",
        "/favicon.svg",
        ...readdirSync(new URL("../public/fonts/", import.meta.url))
          .filter((name) => name.endsWith(".woff2"))
          .sort()
          .map((name) => `/fonts/${name}`),
      ];
      assets.push(...publicAssets);
      const template = readFileSync(new URL("./ghostwriter-sw.js", import.meta.url), "utf8");
      const hash = createHash("sha256").update(template + JSON.stringify(assets));
      // Public filenames are stable; changing an icon or manifest must also update the cache.
      for (const path of publicAssets)
        hash.update(readFileSync(new URL(`../public${path}`, import.meta.url)));
      const version = hash.digest("hex").slice(0, 16);
      this.emitFile({
        type: "asset",
        fileName: "ghostwriter-sw.js",
        source: template
          .replace("__GHOSTWRITER_VERSION__", version)
          .replace("/* __GHOSTWRITER_ASSETS__ */ []", JSON.stringify(assets)),
      });
    },
  };
}
