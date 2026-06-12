import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright-Konfiguration für den End-to-End-Kaufprozess (P2 #11).
 *
 * Lokal ausführen:
 *   npm i -D @playwright/test   # falls noch nicht installiert
 *   npx playwright install       # Browser-Binaries
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
 *
 * Gegen eine laufende Instanz (z. B. Vercel-Preview) einfach BASE_URL setzen.
 * Für den vollständigen Kauf-Flow werden Stripe-Test-Keys + ein Test-Login
 * benötigt (siehe tests/e2e/purchase-flow.spec.ts).
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
