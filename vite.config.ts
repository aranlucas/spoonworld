import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    cloudflare(),
    // Installable, offline-first PWA: Workbox precaches every shipped asset.
    VitePWA({
      injectRegister: false,
      registerType: "autoUpdate",
      manifest: {
        name: "Spoonworld",
        short_name: "Spoonworld",
        description: "A tiny world, by the spoonful.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f7f3e9",
        theme_color: "#f7f3e9",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg}"],
        // Phaser alone is about 1.2 MB minified.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1600 },
});
