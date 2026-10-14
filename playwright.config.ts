import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  fullyParallel: false,
  timeout: 30000,
  reporter: [["list"], ["json", { outputFile: "test-results/browser-results.json" }]],
  use: {
    baseURL: "http://127.0.0.1:4188",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL ?? undefined,
    headless: true,
    viewport: { width: 1440, height: 1100 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1100 } },
    },
  ],
  // Serves the production build from workerd, as Cloudflare would.
  webServer: {
    command: "pnpm exec vite preview --host 127.0.0.1 --port 4188 --strictPort",
    url: "http://127.0.0.1:4188",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
