import { defineConfig } from "@playwright/test";
const live = !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
    // Authenticated artifacts may contain private logs. Do not record them.
    trace: "off", screenshot: "off", video: "off",
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
      ...(live ? {} : { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" }),
    },
  },
});
