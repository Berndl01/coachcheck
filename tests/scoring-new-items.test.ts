import { describe, it, expect } from 'vitest';
import {
  computeAxisScores,
  computeMaturityScores,
  computeRawAxisSums,
  determineArchetypes,
  type RawAnswer,
  type Archetype,
  AXIS_KEYS,
} from '@/lib/scoring';

// Helpers -------------------------------------------------------------------

function likertItem(weights: Partial<Record<string, number>>, value: number, reverse = false, format = 'likert_5'): RawAnswer {
  return {
    item_id: Math.floor(Math.random() * 1e6),
    format,
    axis_weights: weights as any,
    reverse_scored: reverse,
    value_numeric: value,
  };
}

function szenarioItem(optKey: string, options: Array<{ key: string; weights: Partial<Record<string, number>> }>): RawAnswer {
  return {
    item_id: Math.floor(Math.random() * 1e6),
    format: 'szenario',
    axis_weights: {},
    reverse_scored: false,
    value_choice: optKey,
    options: options as any,
  };
}

// ---------------------------------------------------------------------------
// 1) Formate der neuen v3_27-Items werden korrekt gescort
// ---------------------------------------------------------------------------
describe('Scoring · neue Item-Formate (v3_27)', () => {
  it('state-Format wird wie Likert behandelt (E_be_01/02)', () => {
    // Achse +1 gewichtet, Antwort 5 → signed +1 → Achse = 1.0; Antwort 1 → 0.0; 3 → 0.5
    const hi = computeAxisScores([likertItem({ reflexion_direktheit: 1 }, 5, false, 'state')]);
    const lo = computeAxisScores([likertItem({ reflexion_direktheit: 1 }, 1, false, 'state')]);
    const mid = computeAxisScores([likertItem({ reflexion_direktheit: 1 }, 3, false, 'state')]);
    expect(hi.reflexion_direktheit).toBeCloseTo(1.0, 5);
    expect(lo.reflexion_direktheit).toBeCloseTo(0.0, 5);
    expect(mid.reflexion_direktheit).toBeCloseTo(0.5, 5);
  });

  it('gap_wichtig UND gap_gelebt tragen beide zur Achse bei (Konvention)', () => {
    const { counts } = computeRawAxisSums([
      likertItem({ stabilisierung_aktivierung: -0.3 }, 5, false, 'gap_wichtig'),
      likertItem({ stabilisierung_aktivierung: -0.3 }, 5, false, 'gap_gelebt'),
    ]);
    // beide Items zählen → count = 0.3 + 0.3
    expect(counts.stabilisierung_aktivierung).toBeCloseTo(0.6, 5);
  });

  it('Belastungs-Item mit negativem stabilisierung-Gewicht zieht Achse nach "stabilisierend" (<0.5)', () => {
    // E_be_03 "Ich plane Erholungsfenster" {stabilisierung_aktivierung:-0.4}, Antwort 5 (trifft voll zu)
    const s = computeAxisScores([likertItem({ stabilisierung_aktivierung: -0.4 }, 5)]);
    expect(s.stabilisierung_aktivierung).toBeLessThan(0.5);
  });

  it('Szenario wendet die Gewichte der GEWÄHLTEN Option an (E_dr_13/B_ko_15)', () => {
    const opts = [
      { key: 'A', weights: { reflexion_direktheit: 0.5, autoritaet_beteiligung: 0.3 } },
      { key: 'D', weights: { standardisierung_anpassung: -0.5, leistung_beziehung: -0.3 } },
    ];
    const pickA = computeAxisScores([szenarioItem('A', opts)]);
    const pickD = computeAxisScores([szenarioItem('D', opts)]);
    // A: positive Gewichte → > 0.5; D nutzt A nicht
    expect(pickA.reflexion_direktheit).toBeGreaterThan(0.5);
    expect(pickA.autoritaet_beteiligung).toBeGreaterThan(0.5);
    // D: negative Gewichte → < 0.5
    expect(pickD.standardisierung_anpassung).toBeLessThan(0.5);
    expect(pickD.leistung_beziehung).toBeLessThan(0.5);
  });

  it('unbekannter Options-Key trägt nichts bei (kein Crash, neutral)', () => {
    const opts = [{ key: 'A', weights: { leistung_beziehung: 0.5 } }];
    const s = computeAxisScores([szenarioItem('Z', opts)]);
    // kein Signal → alle Achsen neutral 0.5
    for (const k of AXIS_KEYS) expect(s[k]).toBeCloseTo(0.5, 5);
  });
});

// ---------------------------------------------------------------------------
// 2) Reife-Richtung: Belastungs-/Drucksignal hebt druckreife & selbstregulation
// ---------------------------------------------------------------------------
describe('Scoring · Führungsreife-Richtung', () => {
  const neutralAxes = Object.fromEntries(AXIS_KEYS.map((k) => [k, 0.5])) as Record<string, number>;

  it('hoher Modul-E-Schnitt → hohe druckreife & selbstregulation', () => {
    const low = computeMaturityScores(neutralAxes as any, { E: -0.8 });
    const high = computeMaturityScores(neutralAxes as any, { E: 0.8 });
    expect(high.druckreife).toBeGreaterThan(low.druckreife);
    expect(high.selbstregulation).toBeGreaterThan(low.selbstregulation);
  });

  it('niedrige stabilisierung_aktivierung (mehr stabilisierend) hebt druckreife zusätzlich', () => {
    const stabilizing = computeMaturityScores({ ...neutralAxes, stabilisierung_aktivierung: 0.1 } as any, { E: 0.0 });
    const activating = computeMaturityScores({ ...neutralAxes, stabilisierung_aktivierung: 0.9 } as any, { E: 0.0 });
    expect(stabilizing.druckreife).toBeGreaterThan(activating.druckreife);
  });

  it('neutraler Trainer → ~0.5 in jeder Reife-Achse', () => {
    const m = computeMaturityScores(neutralAxes as any, {});
    for (const v of Object.values(m)) expect(v).toBeCloseTo(0.5, 5);
  });
});

// ---------------------------------------------------------------------------
// 3) Mini-Pipeline mit gemischten neuen Formaten bleibt im gültigen Bereich
// ---------------------------------------------------------------------------
describe('Scoring · Pipeline-Robustheit mit neuen Formaten', () => {
  it('gemischte Antworten (state+likert+gap+szenario) ergeben gültige 0..1-Achsen + Archetyp', () => {
    const answers: RawAnswer[] = [
      likertItem({ reflexion_direktheit: 0.6 }, 4, false, 'state'),         // E_be_02
      likertItem({ stabilisierung_aktivierung: -0.4 }, 5),                  // E_be_03
      likertItem({ leistung_beziehung: -0.3 }, 2),                          // E_be_04
      likertItem({ stabilisierung_aktivierung: -0.3 }, 5, false, 'gap_wichtig'),
      likertItem({ stabilisierung_aktivierung: -0.3 }, 2, false, 'gap_gelebt'),
      szenarioItem('C', [
        { key: 'C', weights: { autoritaet_beteiligung: 0.6, leistung_beziehung: 0.5 } },
      ]),                                                                   // B_ko_15
      likertItem({ reflexion_direktheit: 0.4, leistung_beziehung: -0.2 }, 3), // B_ko_17
    ];
    const axes = computeAxisScores(answers);
    for (const k of AXIS_KEYS) {
      expect(axes[k]).toBeGreaterThanOrEqual(0);
      expect(axes[k]).toBeLessThanOrEqual(1);
      expect(Number.isFinite(axes[k])).toBe(true);
    }

    const archetypes: Archetype[] = [
      { id: 1, code: 'X', name_de: 'A', axis_profile: Object.fromEntries(AXIS_KEYS.map((k) => [k, 0.2])) },
      { id: 2, code: 'Y', name_de: 'B', axis_profile: Object.fromEntries(AXIS_KEYS.map((k) => [k, 0.8])) },
    ];
    const { primary, secondary } = determineArchetypes(axes, archetypes);
    expect(primary.id).not.toBe(secondary.id);
  });
});
