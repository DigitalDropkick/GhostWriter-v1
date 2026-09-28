// The normal Start client entry can also open a static, identity-free shell.
export function offlineEntryPlugin() {
  return {
    name: "ghostwriter:offline-entry",
    apply: "build",
    applyToEnvironment: (environment) => environment.name === "client",
    generateBundle(_options, bundle) {
      const entry = Object.values(bundle).find((file) => file.type === "chunk" && file.isEntry);
      if (!entry) throw new Error("Offline entry was not built.");
      const styles = Object.keys(bundle)
        .filter((name) => name.endsWith(".css"))
        .map((name) => '<link rel="stylesheet" href="/' + name + '">')
        .join("");
      this.emitFile({
        type: "asset",
        fileName: "offline.html",
        source:
          '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
          '<meta name="ghostwriter-shell" content="v4"><meta name="ghostwriter-offline" content="true"><meta name="theme-color" content="#183e35">' +
          "<title>Ghostwriter</title>" +
          styles +
          '</head><body><main class="welcome-room"><h1 class="font-serif text-3xl">Opening your books…</h1>' +
          "<p>Your writing stays on this device.</p><noscript>Please enable JavaScript to open your writing room.</noscript></main>" +
          '<script type="module" src="/' +
          entry.fileName +
          '"></script></body></html>',
      });
    },
  };
}

// Vite shares its browser-worker asset cache across build environments. Keep
// these browser-only copies out of the Cloudflare server module upload.
export function clientSpeechAssetsPlugin() {
  return {
    name: "ghostwriter:client-speech-assets",
    apply: "build",
    applyToEnvironment: (environment) => environment.name === "ssr",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        for (const [name, file] of Object.entries(bundle)) {
          if (
            file.type !== "asset" ||
            !/^assets\/(?:transcribe\.worker-[\w-]+\.js|ort-wasm-simd-threaded\.jsep-[\w-]+\.(?:wasm|mjs))$/.test(
              name,
            )
          )
            continue;
          if (
            Object.values(bundle).some(
              (chunk) => chunk.type === "chunk" && chunk.code.includes(name),
            )
          ) {
            throw new Error(
              "A server module unexpectedly references browser speech asset: " + name,
            );
          }
          delete bundle[name];
        }
      },
    },
  };
}
