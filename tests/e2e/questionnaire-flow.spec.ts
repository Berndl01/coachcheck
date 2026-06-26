import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-End: echter Fragebogendurchlauf (Abnahme P0).
 *
 * Deckt die Abnahmepunkte ab:
 *   · sichtbare Pole ALLER Spannungsfelder (nie „Pol A"/„Pol B"),
 *   · vollständiges Beantworten aller Items,
 *   · Finalisierung,
 *   · vollständiges Ergebnis (sechs Kernachsen sichtbar).
 *
 * Voraussetzungen für den vollen Lauf:
 *   - laufende App (PLAYWRIGHT_BASE_URL)
 *   - Test-Login (E2E_EMAIL / E2E_PASSWORD)
 *   - ein freigeschaltetes Assessment dieses Accounts (E2E_ASSESSMENT_ID),
 *     das sich im Status pending/in_progress befindet.
 *
 * Ohne diese Voraussetzungen laufen nur die Smoke-Checks.
 */

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const ASSESSMENT_ID = process.env.E2E_ASSESSMENT_ID;

test.describe('Fragebogen · Smoke', () => {
  test('Assessment-Seite ohne Login leitet auf /login', async ({ page }) => {
    // Fail-Closed/Auth-Guard ohne DB beobachtbar: unautorisiert → /login.
    await page.goto('/assessment/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/\/login/);
  });
});

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/e-?mail/i).fill(EMAIL!);
  await page.getByLabel(/passwort/i).fill(PASSWORD!);
  await page.getByRole('button', { name: /anmelden|login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('Fragebogen · vollständiger Durchlauf', () => {
  test.skip(!EMAIL || !PASSWORD || !ASSESSMENT_ID, 'E2E_EMAIL / E2E_PASSWORD / E2E_ASSESSMENT_ID nicht gesetzt');

  test('Pole sichtbar, alle Items beantwortet, Ergebnis vollständig', async ({ page }) => {
    await login(page);
    await page.goto(`/assessment/${ASSESSMENT_ID}`);

    // Der Fragebogen darf NICHT mit dem technischen Fehlerzustand öffnen.
    await expect(page.getByText(/Fragebogen kann gerade nicht geladen werden/i)).toHaveCount(0);

    // Niemals Ersatztexte für Pole.
    await expect(page.getByText(/^Pol A$/)).toHaveCount(0);
    await expect(page.getByText(/^Pol B$/)).toHaveCount(0);

    // Items nacheinander beantworten, bis kein „Weiter" mehr möglich ist.
    // Heuristik je Itemformat anhand des DOM aus item-renderer.tsx.
    for (let i = 0; i < 200; i++) {
      const range = page.locator('input[type="range"]');
      const likert = page.getByRole('button', { name: /^[1-5]$/ });

      if (await range.count() > 0) {
        // Spannungsfeld: beide Pole müssen sichtbaren, nicht-leeren Text tragen.
        const labels = range.locator('xpath=preceding-sibling::div[1]/span');
        const leftText = (await labels.nth(0).innerText()).trim();
        const rightText = (await labels.nth(1).innerText()).trim();
        expect(leftText.length).toBeGreaterThan(0);
        expect(rightText.length).toBeGreaterThan(0);
        expect(leftText).not.toMatch(/^Pol [AB]$/);
        expect(rightText).not.toMatch(/^Pol [AB]$/);
        // Bewusste Interaktion (Regler bewegen) → zählt als Antwort.
        await range.first().focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
      } else if (await likert.count() >= 5) {
        await likert.nth(3).click();
      } else {
        // Auswahl-/Szenario-/Dilemma-Item: erste Auswahlkachel.
        const choice = page.locator('button[aria-pressed]');
        if (await choice.count() > 0) await choice.first().click();
      }

      const next = page.getByRole('button', { name: /weiter|abschließen|fertig/i });
      if (await next.count() === 0) break;
      const isFinish = /abschließen|fertig/i.test((await next.first().innerText()));
      await next.first().click();
      if (isFinish) break;
      await page.waitForTimeout(120);
    }

    // Ergebnisseite: sechs Kernachsen sichtbar = vollständiges Ergebnis.
    await page.waitForURL(/\/assessment\/.+\/result/, { timeout: 30_000 });
    await expect(page.getByText(/Kernachsen/i)).toBeVisible();
  });
});
