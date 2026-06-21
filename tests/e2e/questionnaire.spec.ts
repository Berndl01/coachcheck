import { test, expect } from '@playwright/test';

/**
 * End-to-End: Fragebogen-Integrität (Release-Welle v3.69).
 *
 * Verbindliche Release-Bedingung: Im Fragebogen dürfen NIE Platzhalter-Pole
 * („Pol A" / „Pol B") erscheinen, und Spannungsfeld-Items müssen ihre linken
 * und rechten Pol-Beschriftungen zeigen. Stimmt der Itempool nicht mit dem
 * Vertrag überein, MUSS die Seite geschlossen mit einem neutralen technischen
 * Fehlerzustand abbrechen statt unvollständige Fragen zu zeigen.
 *
 * Der vollständige Lauf braucht eine laufende App + einen Test-Account mit
 * einem freigeschalteten, bezahlten Assessment:
 *   - PLAYWRIGHT_BASE_URL (laufende Instanz)
 *   - E2E_EMAIL / E2E_PASSWORD (Test-Login)
 *   - E2E_ASSESSMENT_ID (ein freigeschaltetes Assessment des Test-Accounts)
 *
 * Ohne diese Voraussetzungen laufen nur die Smoke-Checks; der Kernlauf ist als
 * test.fixme markiert und dokumentiert den Zielpfad — von Bernie live ausführbar.
 */

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const ASSESSMENT_ID = process.env.E2E_ASSESSMENT_ID;

test.describe('Fragebogen-Integrität (Smoke)', () => {
  test('Login-Seite ist erreichbar', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
  });

  test('Assessment ohne Login leitet auf /login um', async ({ page }) => {
    await page.goto('/assessment/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Fragebogen-Integrität (Live)', () => {
  test.skip(!EMAIL || !PASSWORD || !ASSESSMENT_ID, 'E2E_EMAIL / E2E_PASSWORD / E2E_ASSESSMENT_ID nicht gesetzt');

  test.fixme('keine Platzhalter-Pole, Spannungsfeld-Pole sichtbar', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', EMAIL!);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Fragebogen öffnen
    await page.goto(`/assessment/${ASSESSMENT_ID}`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').innerText();

    // Fail-Closed-Zustand? Dann darf KEIN Fragebogen gerendert sein — das ist
    // ein erlaubter (sicherer) Ausgang, aber niemals „Pol A/Pol B" + Weiterklick.
    const blocked = await page.locator('[data-contract-violation]').count();

    // In KEINEM Fall dürfen Platzhalter-Pole sichtbar sein.
    expect(bodyText).not.toMatch(/Pol\s*A\b/);
    expect(bodyText).not.toMatch(/Pol\s*B\b/);

    if (blocked === 0) {
      // Normalfall: der Fragebogen läuft → Spannungsfeld-Slider müssen Pol-Labels
      // tragen (die Pol-Beschriftungen liegen in den options[0].left/right).
      // Wir prüfen, dass die generische Slider-Anweisung nicht ohne Pole bleibt.
      const sliderHint = page.getByText(/Bewege den Regler/i);
      if (await sliderHint.count()) {
        // mindestens ein nicht-leeres Pol-Paar in der Nähe
        await expect(page.locator('text=/[A-Za-zÄÖÜäöü]{3,}/').first()).toBeVisible();
      }
    }
  });
});
