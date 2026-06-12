import { describe, it, expect } from 'vitest';
import {
  computeAxisScores,
  computeMaturityScores,
  AXIS_KEYS,
  MATURITY_KEYS,
  type AxisScores,
} from '@/lib/scoring';

describe('computeAxisScores', () => {
  it('returns neutral 0.5 for every axis when there are no answers', () => {
    const scores = computeAxisScores([]);
    for (const k of AXIS_KEYS) {
      expect(scores[k]).toBe(0.5);
    }
  });

  it('keeps every axis within the normalized 0..1 range', () => {
    const scores = computeAxisScores([]);
    for (const k of AXIS_KEYS) {
      expect(scores[k]).toBeGreaterThanOrEqual(0);
      expect(scores[k]).toBeLessThanOrEqual(1);
    }
  });
});

describe('computeMaturityScores — neutral coach must not be inflated', () => {
  const neutralAxes: AxisScores = {} as AxisScores;
  for (const k of AXIS_KEYS) neutralAxes[k] = 0.5;

  it('a fully neutral profile yields 0.5 across all maturity dimensions', () => {
    // Regression für den behobenen Bug: Modul-Mittel (−1..+1) und Achsen (0..1)
    // wurden gemischt → künstlich erhöhte Reife bei neutralen Coaches.
    const maturity = computeMaturityScores(neutralAxes, {}); // {} → m01 = 0.5
    for (const k of MATURITY_KEYS) {
      expect(maturity[k]).toBeCloseTo(0.5, 5);
    }
  });

  it('module averages of 0 (neutral) also map to 0.5, not to a high value', () => {
    const modulesNeutral = { A: 0, B: 0, C: 0, D: 0, E: 0, G: 0 };
    const maturity = computeMaturityScores(neutralAxes, modulesNeutral);
    for (const k of MATURITY_KEYS) {
      expect(maturity[k]).toBeCloseTo(0.5, 5);
    }
  });

  it('all maturity values stay within 0..1 for extreme inputs', () => {
    const high: AxisScores = {} as AxisScores;
    for (const k of AXIS_KEYS) high[k] = 1;
    const maturity = computeMaturityScores(high, { A: 1, B: 1, C: 1, D: 1, E: 1, G: 1 });
    for (const k of MATURITY_KEYS) {
      expect(maturity[k]).toBeGreaterThanOrEqual(0);
      expect(maturity[k]).toBeLessThanOrEqual(1);
    }
  });
});
