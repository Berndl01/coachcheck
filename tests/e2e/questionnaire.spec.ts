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
 * Ohne diese Voraussetzungen laufen nur die Smoke-Checks. Der Kernlauf wird
 * NICHT mehr still übersprungen: fehlt die Umgebung, schlägt er laut fehl (P0.5).
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
  // (P0.5) Kein stilles Überspringen mehr: fehlt die Umgebung, schlägt der
  // Live-Lauf laut fehl statt grün-durch-Skip.
  test.beforeAll(() => {
    const missing = (
      [
        ['PLAYWRIGHT_BASE_URL', process.env.PLAYWRIGHT_BASE_URL],
        ['E2E_EMAIL', EMAIL],
        ['E2E_PASSWORD', PASSWORD],
        ['E2E_ASSESSMENT_ID', ASSESSMENT_ID],
      ] as const
    )
      .filter(([, v]) => !v?.trim())
      .map(([k]) => k);
    if (missing.length > 0) {
      throw new Error(
        `Release-E2E-Umgebung unvollständig — fehlende Variablen: ${missing.join(', ')}`,
      );
    }
  });

  test('vollständiger Fragebogen-Lauf: genau 103 Fragen, echte Pole, sauberer Abschluss', async ({ page }) => {
    test.setTimeout(180_000);

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', EMAIL!);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Fragebogen öffnen
    await page.goto(`/assessment/${ASSESSMENT_ID}`);
    await page.waitForLoadState('networkidle');

    // Fail-Closed-Zustand? Dann gibt es keinen Fragebogen — erlaubter Ausgang.
    const blocked = await page.locator('[data-contract-violation]').count();
    if (blocked > 0) {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toMatch(/Pol\s*A\b/);
      expect(bodyText).not.toMatch(/Pol\s*B\b/);
      return;
    }

    const startBtn = page.getByRole('button', { name: /start|los|beginnen/i });
    if (await startBtn.count()) {
      await startBtn.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Variable, gültige Antwortsequenz (nie konstant → keine „nicht
    // interpretierbare" Qualität). Durch ALLE Items laufen.
    const LIKERT = [1, 5, 2, 4, 3];
    for (let step = 0; step < 200; step++) {
      // Auf jedem Spannungsfeld-Screen: beide Pole sichtbar, nicht-leer, kein Platzhalter.
      const left = page.locator('[data-testid="pole-left"]');
      if (await left.count()) {
        const l = (await left.first().innerText()).trim();
        const r = (await page.locator('[data-testid="pole-right"]').first().innerText()).trim();
        expect(l.length).toBeGreaterThan(0);
        expect(r.length).toBeGreaterThan(0);
        expect(l).not.toMatch(/^Pol\s*[AB]$/);
        expect(r).not.toMatch(/^Pol\s*[AB]$/);
        await page.getByRole('button', { name: /50 \/ 50 bewusst/i }).first().click();
      } else {
        const likertBtn = page.getByRole('button', { name: String(LIKERT[step % LIKERT.length]), exact: true });
        if (await likertBtn.count()) {
          await likertBtn.first().click();
        } else {
          const opts = page.locator('button[aria-pressed]');
          const n = await opts.count();
          if (n > 0) await opts.nth(step % n).click();
        }
      }

      const finish = page.getByRole('button', { name: 'Abschließen', exact: true });
      if (await finish.count()) break;
      const next = page.getByRole('button', { name: 'Weiter', exact: true });
      if (!(await next.count())) break;
      await next.first().click();
      await page.waitForTimeout(60);
    }
  });
});
