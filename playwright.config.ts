import { defineConfig, devices } from "@playwright/test";

/**
 * DocuGob — Playwright config (Sprint E).
 *
 * Single-purpose: the auth smoke test that validates the full chain
 * we refactored in Sprints A-D (register → cookies → RSC dashboard →
 * logout). A regression here would mean the proxy / refresh / RSC
 * integration broke, which `tsc` and `eslint` can't catch.
 *
 * Assumes you have BOTH servers running locally before invoking
 * `pnpm test:e2e`:
 *   1. FastAPI backend on the host configured in `BACKEND_API_URL`
 *      (defaults to http://127.0.0.1:8000).
 *   2. Next.js dev server on http://localhost:3000 — Playwright will
 *      start it automatically if it isn't already, but reuses an
 *      existing one when present (faster local iteration).
 *
 * First-time setup on a fresh checkout:
 *   pnpm install
 *   pnpm exec playwright install chromium    # ~150 MB binary, once
 *   pnpm test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  // The smoke test mutates auth cookies — running multiple at once
  // would step on each other's session state.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    // Capture a trace on retries to make CI failures debuggable.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Chromium-only — the goal is integration confidence, not
  // cross-browser coverage. Add WebKit / Firefox projects later if
  // we hit a browser-specific cookie quirk.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    // Reuse a dev server you already have running — much faster than
    // booting Next every time during local iteration.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
