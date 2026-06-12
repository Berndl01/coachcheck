import { describe, it, expect } from 'vitest';
import { buildFallbackReport, type ReportInput, type ReportOutput } from '@/lib/ai/report-prompt';
import { AXIS_KEYS, type AxisScores } from '@/lib/scoring';
import { SAMPLE_REPORT } from '@/lib/pdf/sample-report-data';

/**
 * Inhaltliche Qualitäts-Gate (P0 #5 / P1 #7).
 *
 * Verhindert, dass interne Hinweise, Platzhalter oder generische Floskeln im
 * Käuferreport landen. Greift sowohl für den deterministischen Fallback-Report
 * als auch für den kuratierten Beispielreport (Sample-PDF-Quelle).
 *
 * CI schlägt fehl, sobald einer dieser Strings im Report-Text auftaucht.
 */

// Verbotene Wendungen (case-insensitive). Bewusst eng formuliert, damit
// legitime Sätze nicht fälschlich blockiert werden.
const FORBIDDEN: Array<{ re: RegExp; label: string }> = [
  { re: /erneut generieren/i, label: '„erneut generieren"' },
  { re: /neu generieren/i, label: '„neu generieren"' },
  { re: /vollständige auswertung folgt/i, label: '„vollständige Auswertung folgt"' },
  { re: /vollständige auswertung/i, label: '„vollständige Auswertung" (Verweis auf späteren Report)' },
  { re: /zwischenstand/i, label: '„Zwischenstand"' },
  { re: /\bnicht verfügbar\b/i, label: '„nicht verfügbar"' },
  { re: /reduzierte (erst)?fassung/i, label: '„reduzierte (Erst)fassung"' },
  // generisches „im persönlichen Gespräch" als Fallback-Floskel
  { re: /im persönlichen gespräch/i, label: '„im persönlichen Gespräch" (generische Floskel)' },
  // KI-Selbstbezug / Platzhalter
  { re: /\bals (eine?r? )?ki\b/i, label: 'KI-Selbstbezug' },
  { re: /platzhalter/i, label: '„Platzhalter"' },
  { re: /lorem ipsum/i, label: 'Lorem ipsum' },
  { re: /\{\{/i, label: 'Template-Platzhalter {{' },
];

/** Alle String-Werte (auch verschachtelt) flach einsammeln. */
function collectStrings(o: unknown, out: string[] = []): string[] {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) for (const x of o) collectStrings(x, out);
  else if (o && typeof o === 'object') for (const v of Object.values(o)) collectStrings(v, out);
  return out;
}

function scan(report: ReportOutput): string[] {
  const blob = collectStrings(report).join('\n');
  const hits: string[] = [];
  for (const { re, label } of FORBIDDEN) {
    if (re.test(blob)) hits.push(label);
  }
  return hits;
}

const baseInput: ReportInput = {
  productTier: 2,
  productName: 'Selbsttest',
  traineeName: 'Test',
  sport: 'Fußball',
  primaryArchetype: {
    name_de: 'Der Strukturgeber',
    short_trait: 'Struktur · Klarheit',
    kernmuster: 'führt über Ordnung und Berechenbarkeit',
    staerken: ['Klarheit', 'Verlässlichkeit'],
    risiken: ['Kontrolle unter Druck', 'Distanz'],
    entwicklungshebel: ['Beteiligung dosieren', 'Tempo zulassen'],
  },
  secondaryArchetype: { name_de: 'Der Leistungsarchitekt', short_trait: 'Anspruch · Fokus' },
  axisScores: Object.fromEntries(AXIS_KEYS.map((k) => [k, 0.5])) as AxisScores,
  moduleAverages: {},
};

describe('report content quality — verbotene Floskeln/Platzhalter', () => {
  it('Fallback-Report enthält keine internen Hinweise', () => {
    const hits = scan(buildFallbackReport(baseInput));
    expect(hits, `Verbotene Wendungen im Fallback-Report: ${hits.join(', ')}`).toHaveLength(0);
  });

  it('Beispielreport (Sample-PDF) enthält keine internen Hinweise', () => {
    const hits = scan(SAMPLE_REPORT);
    expect(hits, `Verbotene Wendungen im Beispielreport: ${hits.join(', ')}`).toHaveLength(0);
  });
});

describe('report content quality — Konsistenz Gesprächsleitfaden', () => {
  it('Beispielreport hat substanzielle Gesprächsfragen', () => {
    expect(SAMPLE_REPORT.gespraechsleitfaden.length).toBeGreaterThanOrEqual(3);
    for (const q of SAMPLE_REPORT.gespraechsleitfaden) {
      expect(q.trim().length).toBeGreaterThan(15);
    }
  });

  it('Fallback-Report hat substanzielle Gesprächsfragen', () => {
    const r = buildFallbackReport(baseInput);
    expect(r.gespraechsleitfaden.length).toBeGreaterThanOrEqual(3);
    for (const q of r.gespraechsleitfaden) {
      expect(q.trim().length).toBeGreaterThan(15);
    }
  });
});
