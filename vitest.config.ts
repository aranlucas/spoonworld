import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["test/browser.test.ts"],
    environment: "node",
  },
});
