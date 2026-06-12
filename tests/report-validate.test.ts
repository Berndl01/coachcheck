import { describe, it, expect } from 'vitest';
import { validateReportOutput, buildFallbackReport, type ReportInput } from '@/lib/ai/report-prompt';
import { AXIS_KEYS, type AxisScores } from '@/lib/scoring';

const baseInput: ReportInput = {
  productTier: 2,
  productName: 'Selbsttest',
  traineeName: 'Test',
  sport: 'Fußball',
  primaryArchetype: {
    name_de: 'Der Analytische Strukturgeber',
    short_trait: 'Analyse · Reflexion · Präzision',
    kernmuster: 'beobachtet präzise, strukturiert stark',
    staerken: ['Analyse', 'Klarheit'],
    risiken: ['Überanalyse', 'Distanz'],
    entwicklungshebel: ['Wirkung sichtbar machen', 'Tempo zulassen'],
  },
  secondaryArchetype: { name_de: 'Der Beziehungsstarke Integrator', short_trait: 'Nähe · Vertrauen' },
  axisScores: Object.fromEntries(AXIS_KEYS.map((k) => [k, 0.5])) as AxisScores,
  moduleAverages: {},
};

const has = (problems: string[], prefix: string) => problems.some((p) => p.startsWith(prefix));

describe('validateReportOutput (Premium-Tiefe)', () => {
  it('passes the enriched fallback report', () => {
    // Der Fallback ist bewusst als reduziert markiert, aber substanziell genug
    // für die Premium-Schwelle (keine Stummel-Sätze).
    expect(validateReportOutput(buildFallbackReport(baseInput))).toHaveLength(0);
  });

  it('reports missing required fields', () => {
    const broken = { executive_summary: 'x' }; // zu kurz + Rest fehlt
    const problems = validateReportOutput(broken);
    expect(has(problems, 'executive_summary')).toBe(true);
    expect(has(problems, 'archetyp_interpretation')).toBe(true);
    expect(has(problems, 'modul_interpretationen')).toBe(true);
    expect(has(problems, 'gespraechsleitfaden')).toBe(true);
  });

  it('rejects a thin but structurally complete report (premium bar)', () => {
    // Alle Felder vorhanden, aber inhaltlich zu dünn → darf NICHT als Premium durchgehen.
    const thin = {
      executive_summary: 'Kurz.',
      archetyp_interpretation: 'Kurz.',
      signature_narrative: 'Kurz.',
      druckprofil: 'Kurz.',
      hauptrisiken: 'Kurz.',
      entwicklungspfad: 'Kurz.',
      modul_interpretationen: Object.fromEntries('ABCDEFG'.split('').map((c) => [c, 'zu kurz'])),
      gespraechsleitfaden: ['a'],
      naechste_30_tage: ['b'],
    };
    expect(validateReportOutput(thin).length).toBeGreaterThan(0);
  });

  it('rejects placeholder / AI-disclaimer / filler text', () => {
    const junk = {
      ...buildFallbackReport(baseInput),
      signature_narrative:
        buildFallbackReport(baseInput).signature_narrative +
        ' Hinweis: als KI kann ich hier nicht weiter ins Detail gehen, dieser Abschnitt ist ein Platzhalter.',
    };
    const problems = validateReportOutput(junk);
    expect(problems.some((p) => p.includes('platzhalter'))).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(validateReportOutput(null).length).toBeGreaterThan(0);
    expect(validateReportOutput('text').length).toBeGreaterThan(0);
  });
});

describe('buildFallbackReport', () => {
  it('produces a substantive, claim-safe report without AI', () => {
    const r = buildFallbackReport(baseInput);
    expect(validateReportOutput(r)).toHaveLength(0);
    expect(r.gespraechsleitfaden.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(r.modul_interpretationen).length).toBe(7);
    // Claim-sicher: explizit als Hypothese/keine Diagnose markiert.
    expect(r.archetyp_interpretation.toLowerCase()).toContain('keine diagnose');
    expect(JSON.stringify(r).toLowerCase()).not.toContain('diagnose stellt');
  });
});
