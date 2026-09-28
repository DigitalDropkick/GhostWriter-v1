import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error Local JavaScript build plugin.
import { offlineEntryPlugin, clientSpeechAssetsPlugin } from "./scripts/offline-entry-plugin.mjs";

export default defineConfig({
  server: { host: "127.0.0.1", port: 8080, strictPort: true },
  preview: { host: "127.0.0.1", port: 8081, strictPort: true },
  resolve: { tsconfigPaths: true },
  optimizeDeps: { include: ["@huggingface/transformers"] },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    offlineEntryPlugin(),
    clientSpeechAssetsPlugin(),
    tanstackStart(),
    viteReact(),
  ],
});
