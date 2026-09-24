import { defineConfig } from '@playwright/test';

// End-to-end tests run against the static web export (npm run build:web first).
// Set PW_CHROMIUM_PATH to use a preinstalled Chromium.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 },
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  webServer: { command: 'node scripts/serve.mjs 4173', url: 'http://localhost:4173/workouts', reuseExistingServer: true },
});
