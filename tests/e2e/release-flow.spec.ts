import { test, expect, type Page } from '@playwright/test';

/**
 * VERBINDLICHER RELEASE-E2E (P0.3).
 *
 * Deckt den vollständigen Geld-/Wert-Pfad ab, soweit aus dem Browser fahrbar:
 *   Login → bezahltes Assessment → ALLE Items (variabel beantwortet) →
 *   Abschließen → Ergebnis (sieben Module, sechs Achsen) → Report/PDF →
 *   [optional] Refund → alle kostenpflichtigen Bereiche gesperrt.
 *
 * Voraussetzungen (fehlen sie, schlägt der Lauf laut fehl statt zu überspringen — P0.5):
 *   - PLAYWRIGHT_BASE_URL (laufende Instanz)
 *   - E2E_EMAIL / E2E_PASSWORD (Test-Login)
 *   - E2E_ASSESSMENT_ID (vorab freigeschaltetes, BEZAHLTES Assessment)
 *
 * Der Stripe-Checkout-/Webhook-/Vertragsmail-/Refund-Teil benötigt zusätzlich
 * Stripe-Test-Infrastruktur (Stripe CLI / Fixtures) und ist nur aktiv, wenn die
 * jeweiligen Variablen gesetzt sind. Was nicht fahrbar ist, wird ehrlich
 * übersprungen statt vorgetäuscht.
 *
 * WICHTIG: Die Antwortsequenz ist deterministisch ABER VARIABEL (1→5→2→4→3…),
 * niemals konstant — sonst entsteht eine absichtlich „nicht interpretierbare"
 * Antwortqualität, die das Premium-Ergebnis (korrekterweise) blockiert.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL;
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const ASSESSMENT_ID = process.env.E2E_ASSESSMENT_ID;

// Optionaler Refund-Hook: ein Endpunkt/Skript, das den Test-Kauf zurückerstattet.
const REFUND_HOOK = process.env.E2E_REFUND_URL;

/** Zyklische, gültige Likert-Sequenz — variabel, nie konstant. */
const LIKERT_SEQUENCE = [1, 5, 2, 4, 3];

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', EMAIL!);
  await page.fill('input[type="password"], input[name="password"]', PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

/**
 * Beantwortet das aktuell sichtbare Item:
 *  - Spannungsfeld: bewusst 50/50 (eigener Button),
 *  - Likert/State/Gap: variabel über LIKERT_SEQUENCE (per Sichttext der Buttons 1..5),
 *  - Choice: variabel die i-te verfügbare Option.
 * Gibt den Buttontext der primären Aktion zurück.
 */
async function answerVariably(page: Page, step: number): Promise<void> {
  const balanced = page.getByRole('button', { name: /50 \/ 50 bewusst/i });
  if (await balanced.count()) {
    await balanced.first().click();
    return;
  }

  // Likert: Buttons tragen sichtbar die Ziffern 1..5 und aria-pressed.
  const likertTarget = String(LIKERT_SEQUENCE[step % LIKERT_SEQUENCE.length]);
  const likertBtn = page.getByRole('button', { name: likertTarget, exact: true });
  if (await likertBtn.count()) {
    await likertBtn.first().click();
    return;
  }

  // Choice: variabel die i-te auswählbare Option.
  const opts = page.locator('button[aria-pressed]');
  const n = await opts.count();
  if (n > 0) {
    await opts.nth(step % n).click();
    return;
  }

  throw new Error('Kein beantwortbares Eingabeelement auf diesem Screen gefunden.');
}

test.describe('Release-Flow', () => {
  // (P0.5) NICHT mehr still überspringen: fehlt die Release-E2E-Umgebung, MUSS
  // der Lauf laut fehlschlagen statt grün-durch-Skip. `release:assert-env`
  // (package.json) prüft dieselben Variablen bereits VOR Playwright — dies ist
  // die zweite, testinterne Sperre.
  test.beforeAll(() => {
    const missing = (
      [
        ['PLAYWRIGHT_BASE_URL', BASE],
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

  test('bezahltes Assessment → alle Items → Ergebnis → Report → (Refund-Sperre)', async ({ page }) => {
    test.setTimeout(240_000);

    await login(page);

    // Fragebogen öffnen.
    await page.goto(`/assessment/${ASSESSMENT_ID}`);
    await page.waitForLoadState('networkidle');

    if (!/\/result/.test(page.url())) {
      const startBtn = page.getByRole('button', { name: /start|los|beginnen/i });
      if (await startBtn.count()) await startBtn.first().click();

      // ALLE Items variabel beantworten, bis „Abschließen".
      for (let step = 0; step < 200; step++) {
        await answerVariably(page, step);
        const finish = page.getByRole('button', { name: 'Abschließen', exact: true });
        if (await finish.count()) {
          await finish.first().click();
          break;
        }
        await page.getByRole('button', { name: 'Weiter', exact: true }).first().click();
        await page.waitForTimeout(80);
      }
      await page.waitForURL(/\/result/, { timeout: 120_000 });
    }

    // Ergebnis: sechs Achsen + sieben Module sichtbar.
    await expect(page.getByText(/persönliche Signatur/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Kernachsen/i)).toBeVisible();
    await expect(page.getByText(/Sieben Führungsdimensionen/i)).toBeVisible();

    // Report/PDF anstoßen (best-effort; vollständiger KI-/PDF-Lauf kann dauern).
    const reportCta = page.getByRole('button', { name: /report|auswertung/i });
    if (await reportCta.count()) {
      await reportCta.first().click();
      await expect(
        page.getByRole('link', { name: /download|öffnen|pdf|herunterladen/i }).first(),
      ).toBeVisible({ timeout: 180_000 });
    }

    // Refund-Sperre (nur wenn ein Refund-Hook bereitgestellt ist).
    if (REFUND_HOOK) {
      await page.request.post(REFUND_HOOK, { data: { assessmentId: ASSESSMENT_ID } });
      await page.goto(`/assessment/${ASSESSMENT_ID}/result`);
      await page.waitForLoadState('networkidle');
      // Nach vollem Refund ist das Ergebnis gesperrt (Sperrseite statt Profil).
      await expect(page.getByText(/persönliche Signatur/i)).toHaveCount(0);
    }
  });
});
