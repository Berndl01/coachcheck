/**
 * RELEASE-E2E-UMGEBUNG ERZWINGEN (P0.3).
 *
 * Läuft VOR Playwright in `release:verify`. Fehlt auch nur eine der für den
 * echten, geldnahen Release-Lauf nötigen Variablen, bricht dieses Skript mit
 * Exit-Code 1 ab — damit kann `release:verify` NICHT fälschlich grün werden,
 * während der echte Fragebogen-/Kauf-Lauf in Wahrheit per `test.skip`
 * übersprungen wurde.
 *
 * Diese Prüfung ist die erste von zwei Sperren; die zweite ist eine
 * testinterne `beforeAll`-Sperre in den Release-Specs selbst.
 */

const requiredVariables = [
  'PLAYWRIGHT_BASE_URL',
  'E2E_EMAIL',
  'E2E_PASSWORD',
  'E2E_ASSESSMENT_ID',
];

const missingVariables = requiredVariables.filter(
  (name) => !process.env[name]?.trim(),
);

if (missingVariables.length > 0) {
  console.error(
    [
      'Release-E2E kann nicht gestartet werden.',
      `Fehlende Umgebungsvariablen: ${missingVariables.join(', ')}`,
      '',
      'Setze alle vier Variablen (laufende Staging-Instanz, Test-Login,',
      'vorab freigeschaltetes BEZAHLTES Assessment) und starte erneut.',
    ].join('\n'),
  );

  process.exit(1);
}

console.log('\u2713 Alle notwendigen Release-E2E-Variablen sind gesetzt.');
