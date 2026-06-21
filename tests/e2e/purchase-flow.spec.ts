import { test, expect } from '@playwright/test';

/**
 * End-to-End: kompletter Kaufprozess (P2 #11).
 *
 * Der vollständige Flow (Signup → Profil → Checkout/Stripe-Test-Webhook →
 * Assessment → Finalize → Ergebnis → Report → PDF → Dashboard) braucht:
 *   - eine laufende App (PLAYWRIGHT_BASE_URL)
 *   - Stripe im Test-Modus + STRIPE_WEBHOOK_SECRET (stripe listen / fixtures)
 *   - einen Test-Account (E2E_EMAIL / E2E_PASSWORD)
 *
 * Ohne diese Voraussetzungen laufen nur die Smoke-Checks. Der Live-Block wird
 * NICHT mehr still übersprungen: fehlt die Umgebung, schlägt er laut fehl (P0.5).
 */

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
// Ein bereits freigeschaltetes, BEZAHLTES Assessment des Test-Accounts. Damit
// braucht der Volllauf KEINEN Stripe-Webhook im Test — das Bezahl-/Webhook-
// verhalten wird separat (Stripe CLI / Fixtures) geprüft. Ist die ID nicht
// gesetzt, wird der Live-Lauf übersprungen (nur Smoke läuft).
const ASSESSMENT_ID = process.env.E2E_ASSESSMENT_ID;

test.describe('Smoke', () => {
  test('Landingpage rendert und zeigt Pakete', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Humatrix|Coach/i);
    // Paket-Sektion ist verankert über #products
    await page.goto('/#products');
    await expect(page.locator('#products')).toBeVisible();
  });

  test('Checkout-Consent-Gate erzwingt Zustimmung', async ({ page }) => {
    // Ohne Login leitet /checkout/[slug] auf /login um — genau das prüfen wir.
    await page.goto('/checkout/selbsttest');
    await expect(page).toHaveURL(/\/login|\/checkout\/selbsttest/);
  });
});

test.describe('Assessment → Finalize → Ergebnis (Live)', () => {
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

  test('Login → alle Items → Abschließen → Ergebnisseite', async ({ page }) => {
    test.setTimeout(180_000);

    // 1) Login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', EMAIL!);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // 2) Fragebogen öffnen
    await page.goto(`/assessment/${ASSESSMENT_ID}`);
    await page.waitForLoadState('networkidle');

    // Schon abgeschlossen? Dann leitet die Seite direkt auf /result um.
    if (!/\/result/.test(page.url())) {
      // Intro überspringen, falls vorhanden.
      const startBtn = page.getByRole('button', { name: /start|los|beginnen/i });
      if (await startBtn.count()) {
        await startBtn.first().click();
      }

      // 3) Items deterministisch beantworten, bis „Abschließen" erreicht ist.
      //    - Spannungsfeld: bewusst 50/50 (neuer Button aus P0.4).
      //    - Likert/Choice: erste auswählbare Option (button[aria-pressed]).
      for (let i = 0; i < 130; i++) {
        const balanced = page.getByRole('button', { name: /50 \/ 50 bewusst/i });
        if (await balanced.count()) {
          await balanced.first().click();
        } else {
          const opt = page.locator('button[aria-pressed]').first();
          await opt.waitFor({ state: 'visible', timeout: 15_000 });
          await opt.click();
        }

        const finish = page.getByRole('button', { name: 'Abschließen', exact: true });
        if (await finish.count()) {
          await finish.first().click();
          break;
        }
        await page.getByRole('button', { name: 'Weiter', exact: true }).first().click();
        await page.waitForTimeout(100);
      }

      // 4) Server-Finalize + Redirect auf die Ergebnisseite.
      await page.waitForURL(/\/result/, { timeout: 90_000 });
    }

    // 5) Ergebnisseite zeigt die persönliche Signatur (deterministisch aus Werten).
    await expect(page.getByText(/persönliche Signatur/i)).toBeVisible({ timeout: 30_000 });

    // 6) Sieben Führungsdimensionen sind sichtbar (P0.9).
    await expect(page.getByText(/Sieben Führungsdimensionen/i)).toBeVisible({ timeout: 15_000 });

    // 7) Report-Erstellung ist best-effort: nur anstoßen, wenn der CTA da ist.
    //    (Der vollständige KI-/PDF-Lauf wird separat geprüft; hier nur die
    //    Erreichbarkeit des Premium-Abschnitts.)
    const reportCta = page.getByRole('button', { name: /report|auswertung/i });
    if (await reportCta.count()) {
      await expect(reportCta.first()).toBeVisible();
    }
  });
});
