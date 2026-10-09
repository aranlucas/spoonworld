import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { offlineCache } from "./scripts/offline-cache.ts";

export default defineConfig({
  plugins: [react(), cloudflare(), offlineCache()],
  // Phaser alone is about 1.2 MB minified; the whole app is precached offline.
  build: { chunkSizeWarningLimit: 1600 },
});
