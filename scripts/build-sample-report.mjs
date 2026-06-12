#!/usr/bin/env node
/**
 * Rendert das verkaufsfertige Beispiel-PDF (Tier 2) aus den kuratierten
 * Sample-Texten in lib/pdf/sample-report-data.ts → docs/beispiel-report-fussball.pdf
 *
 * Nutzt esbuild, um die TS/TSX-Quellen inkl. `@/`-Alias zu bündeln; alle
 * node_modules bleiben extern (werden zur Laufzeit aufgelöst).
 *
 *   node scripts/build-sample-report.mjs
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const entry = `
export { ReportDocument } from '@/lib/pdf/report-document';
export {
  SAMPLE_REPORT, SAMPLE_AXIS_SCORES, SAMPLE_MATURITY_SCORES,
  SAMPLE_PRIMARY, SAMPLE_SECONDARY, SAMPLE_META,
} from '@/lib/pdf/sample-report-data';
`;

// Bundle INNERHALB des Projekts ablegen, damit Node die node_modules
// (z. B. @react-pdf/renderer) korrekt auflöst.
const tmp = join(ROOT, '.sample-build');
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
  // node_modules nicht mitbündeln — nur unsere TS-Quellen.
  packages: 'external',
  alias: { '@': ROOT },
  logLevel: 'warning',
});

const mod = await import(pathToFileURL(outFile).href);
const {
  ReportDocument, SAMPLE_REPORT, SAMPLE_AXIS_SCORES, SAMPLE_MATURITY_SCORES,
  SAMPLE_PRIMARY, SAMPLE_SECONDARY, SAMPLE_META,
} = mod;

const element = React.createElement(ReportDocument, {
  traineeName: SAMPLE_META.traineeName,
  sport: SAMPLE_META.sport,
  productName: SAMPLE_META.productName,
  productTier: SAMPLE_META.productTier,
  date: new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }),
  primaryArchetype: SAMPLE_PRIMARY,
  secondaryArchetype: SAMPLE_SECONDARY,
  axisScores: SAMPLE_AXIS_SCORES,
  texts: SAMPLE_REPORT,
  maturityScores: SAMPLE_MATURITY_SCORES,
  context: { seasonPhase: 'erfolgslauf', teamMaturity: 'gemischt' },
  dataQuality: null,
});

const buffer = await renderToBuffer(element);

const docsDir = join(ROOT, 'docs');
mkdirSync(docsDir, { recursive: true });
const outPdf = join(docsDir, 'beispiel-report-fussball.pdf');
writeFileSync(outPdf, buffer);

// Zusätzlich nach public/ — von dort lädt die Landingpage den Beispiel-Report
// als statischen Download (damit Interessenten sehen, was sie bekommen).
const publicPdf = join(ROOT, 'public', 'beispiel-coachcheck-report.pdf');
writeFileSync(publicPdf, buffer);

// Temp-Bundle aufräumen.
rmSync(tmp, { recursive: true, force: true });

console.log(`✓ Beispiel-PDF gerendert: docs/beispiel-report-fussball.pdf + public/beispiel-coachcheck-report.pdf (${(buffer.length / 1024).toFixed(0)} KB)`);
