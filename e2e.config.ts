import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";

export default {
  tests: "journeys/**/*.e2e.ts",
  targets: [
    {
      name: "chromium",
      engine: web({ viewport: { width: 1440, height: 1100 } }),
      app: {
        url: "http://127.0.0.1:4188",
        command: {
          executable: "pnpm",
          args: [
            "exec",
            "vite",
            "preview",
            "--host",
            "127.0.0.1",
            "--port",
            "4188",
            "--strictPort",
          ],
          reuseExisting: false,
          log: ".e2e/logs/app.log",
        },
      },
    },
  ],
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporters: ["list", "junit"],
  trace: "retain-on-failure",
} satisfies E2EConfig;
