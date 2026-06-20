/**
 * PDF-VOLLTEST: Rendert alle drei Report-Varianten mit realistischen Daten,
 * um zu beweisen, dass jede fehlerfrei generiert:
 *   1. Basis-Selbst-Check (nur Selbstbild)
 *   2. 360° mit Fremdbild-VERGLEICH (Selbstbild vs. Fremdbild + Diskrepanzen)
 *   3. TeamCheck (Spieler-Aggregat + Achtsamkeitshinweise)
 *
 * Schlägt fehl, wenn irgendeine Variante einen Render-Fehler wirft.
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const entry = `
export { ReportDocument } from '@/lib/pdf/report-document';
export {
  SAMPLE_REPORT, SAMPLE_AXIS_SCORES, SAMPLE_MATURITY_SCORES,
  SAMPLE_PRIMARY, SAMPLE_SECONDARY, SAMPLE_META,
} from '@/lib/pdf/sample-report-data';
`;

const tmp = join(ROOT, '.pdf-fulltest');
mkdirSync(tmp, { recursive: true });
const entryFile = join(tmp, 'entry.ts');
const outFile = join(tmp, 'bundle.mjs');
writeFileSync(entryFile, entry);

await build({
  entryPoints: [entryFile],
  outfile: outFile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  target: 'node20',
  packages: 'external',
  alias: { '@': ROOT },
  logLevel: 'warning',
});

const mod = await import(pathToFileURL(outFile).href);
const {
  ReportDocument, SAMPLE_REPORT, SAMPLE_AXIS_SCORES, SAMPLE_MATURITY_SCORES,
  SAMPLE_PRIMARY, SAMPLE_SECONDARY, SAMPLE_META,
} = mod;

const dateStr = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });

const base = {
  traineeName: SAMPLE_META.traineeName,
  sport: SAMPLE_META.sport,
  productName: SAMPLE_META.productName,
  date: dateStr,
  primaryArchetype: SAMPLE_PRIMARY,
  secondaryArchetype: SAMPLE_SECONDARY,
  axisScores: SAMPLE_AXIS_SCORES,
  texts: SAMPLE_REPORT,
  maturityScores: SAMPLE_MATURITY_SCORES,
  context: { seasonPhase: 'erfolgslauf', teamMaturity: 'gemischt' },
  dataQuality: null,
};

// Fremdbild-Scores (leicht abweichend vom Selbstbild → echte Diskrepanzen)
const fremdbildScores = {
  identitaet: 3.2, kommunikation: 4.1, entscheidung: 2.8,
  fehlerkultur: 3.9, druck: 3.0, motivation: 4.3,
};
const discrepancies = Object.keys(SAMPLE_AXIS_SCORES).map((axis) => ({
  axis,
  self: SAMPLE_AXIS_SCORES[axis],
  external: fremdbildScores[axis] ?? 3.5,
  delta: Math.round(((SAMPLE_AXIS_SCORES[axis] ?? 3.5) - (fremdbildScores[axis] ?? 3.5)) * 100) / 100,
}));

const variants = [
  {
    name: '1-basis-selbstcheck',
    props: { ...base, productTier: 2 },
  },
  {
    name: '2-360-vergleich',
    props: {
      ...base,
      productTier: 3,
      fremdbildScores,
      discrepancies,
      fremdbildResponseCount: 6,
    },
  },
  {
    name: '3-teamcheck',
    props: {
      ...base,
      productTier: 4,
      teamcheckScores: {
        coachImpact: 3.8, psySafety: 3.2, teamKlima: 3.5,
        leistungsdruck: 2.9, klarheit: 4.0,
      },
      teamcheckResponseCount: 7,
      teamcheckCareHints: [
        { topic: 'Offen sprechen können', text: 'Ein Teil der Antworten traut sich nicht, offen zu sprechen. Niedrigschwellige Gesprächsformate anbieten.' },
        { topic: 'Umgang mit Fehlern', text: 'Ein Teil der Antworten fühlt sich nach Fehlern herabgesetzt. Fehlerreaktionen bewusst reflektieren.' },
      ],
    },
  },
  {
    // Bestcase §9: Mischprofil-Renderpfad muss fehlerfrei rendern.
    name: '4-mischprofil',
    props: { ...base, productTier: 2, profileType: 'mixed' },
  },
];

const outDir = join(ROOT, '.pdf-fulltest');
let allOk = true;
for (const v of variants) {
  try {
    const element = React.createElement(ReportDocument, v.props);
    const buffer = await renderToBuffer(element);
    const sizeKb = Math.round(buffer.length / 1024);
    if (buffer.length < 5000) throw new Error(`PDF verdächtig klein (${buffer.length} bytes)`);
    writeFileSync(join(outDir, `report-${v.name}.pdf`), buffer);
    console.log(`✓ Variante ${v.name.padEnd(22)} → ${sizeKb} KB`);
  } catch (err) {
    allOk = false;
    console.error(`✗ Variante ${v.name} FEHLGESCHLAGEN:`, err.message);
  }
}

console.log(allOk ? '\nALLE PDF-VARIANTEN RENDERN FEHLERFREI ✓' : '\n*** MINDESTENS EINE VARIANTE FEHLGESCHLAGEN ***');
process.exit(allOk ? 0 : 1);
