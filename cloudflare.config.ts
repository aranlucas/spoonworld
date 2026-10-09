import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "spoonworld",
    compatibilityDate: "2026-09-30",
    observability: {
      enabled: true,
    },
    assets: {
      notFoundHandling: "404-page",
    },
  },
});
