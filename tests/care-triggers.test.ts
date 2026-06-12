import { describe, expect, it } from 'vitest';
import {
  CARE_TRIGGER_RULES,
  CARE_FRAME_NOTE,
  MAX_HINTS,
  MIN_RESPONDENTS,
  evaluateCareSignals,
  type CareResponse,
} from '@/lib/safety/care-triggers';

function fill(code: string, values: number[]): CareResponse[] {
  return values.map((value, i) => ({ code, value, respondent: `r${i}` }));
}

describe('care-triggers (Know-how-Transfer Humatrix 2026-06)', () => {
  it('triggert protective_low nur bei Ablehnung (≤2), nicht bei Zustimmung', () => {
    // 6 Antwortende, 2 betroffene (Wert 2) → 33 % ≥ Schwelle
    const hints = evaluateCareSignals(fill('TC_ps_01', [2, 2, 4, 4, 5, 5]));
    expect(hints).toHaveLength(1);
    expect(hints[0].code).toBe('TC_ps_01');
    expect(hints[0].topic).toBe('Offen sprechen können');

    // Nur Zustimmung → kein Hinweis
    expect(evaluateCareSignals(fill('TC_ps_01', [4, 4, 5, 5, 5, 4]))).toHaveLength(0);
  });

  it('triggert concern_high (reverse Wortlaut) nur bei Zustimmung (≥4)', () => {
    const hints = evaluateCareSignals(fill('P_be_01', [4, 5, 1, 2, 1, 2]));
    expect(hints).toHaveLength(1);
    expect(hints[0].code).toBe('P_be_01');

    expect(evaluateCareSignals(fill('P_be_01', [1, 2, 2, 1, 3, 2]))).toHaveLength(0);
  });

  it('respektiert die Anonymitätsschwelle: < MIN_RESPONDENTS → nie ein Hinweis', () => {
    const few = fill('TC_ci_03', [1, 1, 1, 1]); // 4 < 5
    expect(few.length).toBeLessThan(MIN_RESPONDENTS);
    expect(evaluateCareSignals(few)).toHaveLength(0);
  });

  it('verhindert Einzel-Rückschluss: genau 1 betroffene Antwort → kein Hinweis', () => {
    // 8 Antwortende, nur 1 betroffen (12,5 %) → unter MIN_CONCERNED und Schwelle
    expect(evaluateCareSignals(fill('TC_ci_04', [1, 5, 5, 5, 5, 5, 5, 5]))).toHaveLength(0);
  });

  it('Alarm-Fatigue-Prävention: höchstens MAX_HINTS, stärkstes Signal zuerst', () => {
    const responses = [
      ...fill('TC_ps_01', [1, 1, 1, 1, 4, 5]), // 67 %
      ...fill('TC_ci_03', [1, 1, 4, 5, 5, 5]), // 33 %
      ...fill('TC_ci_04', [2, 2, 2, 4, 5, 5]), // 50 %
      ...fill('TC_tk_02', [5, 5, 5, 1, 1, 1]), // 50 % (reverse)
    ];
    const hints = evaluateCareSignals(responses);
    expect(hints).toHaveLength(MAX_HINTS);
    expect(hints[0].code).toBe('TC_ps_01');
    expect(hints.map((h) => h.share)).toEqual([...hints.map((h) => h.share)].sort((a, b) => b - a));
  });

  it('ignoriert unbekannte Codes, never-Items und ungültige Werte', () => {
    const responses: CareResponse[] = [
      ...fill('UNBEKANNT_99', [1, 1, 1, 1, 1, 1]),
      ...fill('TC_tk_01', [1, 1, 1, 1, 1, 1]), // bewusst 'never'
      // ungültige Werte zählen weder als betroffen noch als Antwortende
      ...fill('TC_ps_01', [0, 7, NaN as unknown as number, 1.5, 2, 2]),
    ];
    // UNBEKANNT/never erzeugen nichts; TC_ps_01 hat nur 2 GÜLTIGE Antwortende → n < 5 → kein Hinweis
    expect(evaluateCareSignals(responses)).toHaveLength(0);

    // mit genügend gültigen Antwortenden greift der Hinweis trotz Störwerten
    const mixed: CareResponse[] = [
      ...fill('TC_ps_01', [2, 2, 4, 5, 5, 4]),
      { code: 'TC_ps_01', value: NaN as unknown as number, respondent: 'x' },
    ];
    expect(evaluateCareSignals(mixed).map((h) => h.code)).toEqual(['TC_ps_01']);
  });

  it('zählt Antwortende distinct (Revisionen blähen n nicht auf)', () => {
    const revised: CareResponse[] = [
      { code: 'TC_ps_01', value: 1, respondent: 'a' },
      { code: 'TC_ps_01', value: 1, respondent: 'a' }, // Revision desselben Tokens
      { code: 'TC_ps_01', value: 5, respondent: 'b' },
      { code: 'TC_ps_01', value: 5, respondent: 'c' },
      { code: 'TC_ps_01', value: 5, respondent: 'd' },
    ];
    // distinct n = 4 < MIN_RESPONDENTS → kein Hinweis trotz 2 betroffener Zeilen
    expect(evaluateCareSignals(revised)).toHaveLength(0);
  });

  it('alle Texte sind claim-sicher (keine gesperrten Begriffe)', () => {
    const forbidden = /diagnos|garantier|isoliert\b|krankheit|unbeliebt|mental schwach/i;
    for (const entry of Object.values(CARE_TRIGGER_RULES)) {
      expect(entry.topic).not.toMatch(forbidden);
      expect(entry.impulse).not.toMatch(forbidden);
    }
    expect(CARE_FRAME_NOTE).not.toMatch(forbidden);
    expect(CARE_FRAME_NOTE).toMatch(/kein Befund/);
  });
});
