import { describe, it, expect } from 'vitest';
import { computeResponseQuality, type QualityAnswer } from '@/lib/insight/response-quality';

function likertAll(value: number, n: number, reverseEvery = 0): QualityAnswer[] {
  return Array.from({ length: n }, (_, i) => ({
    likert: value,
    reverse: reverseEvery > 0 && i % reverseEvery === 0,
  }));
}

function variedLikert(n: number): QualityAnswer[] {
  const seq = [1, 2, 4, 5, 2, 3, 4, 1, 5, 2];
  return Array.from({ length: n }, (_, i) => ({ likert: seq[i % seq.length], reverse: i % 4 === 0 }));
}

describe('computeResponseQuality', () => {
  it('flags a fast, straight-lined run as not interpretable', () => {
    const answers = likertAll(5, 80, 5); // 80 identische Antworten, einige reverse
    const q = computeResponseQuality(answers, 90_000); // 90s für 80 Items → ~1.1s/Item
    expect(q.flags.too_fast).toBe(true);
    expect(q.flags.straightlining).toBe(true);
    expect(q.flags.inconsistent_reverse_items).toBe(true);
    expect(q.dataQuality).toBe('nicht_interpretierbar');
    expect(q.confidence).toBe('niedrig');
  });

  it('treats a varied, paced run as good quality', () => {
    const answers = variedLikert(60);
    const q = computeResponseQuality(answers, 60 * 12_000); // 12s/Item
    expect(q.flags.too_fast).toBe(false);
    expect(q.flags.straightlining).toBe(false);
    expect(q.dataQuality).toBe('gut');
    expect(q.confidence).toBe('hoch');
  });

  it('flags straightlining alone as eingeschraenkt', () => {
    const answers = likertAll(4, 40); // gleichförmig, aber kein reverse, langsam
    const q = computeResponseQuality(answers, 40 * 15_000);
    expect(q.flags.straightlining).toBe(true);
    expect(q.dataQuality).toBe('eingeschraenkt');
    expect(q.confidence).toBe('mittel');
  });

  it('flags excessive middle answers', () => {
    const answers = likertAll(3, 30);
    const q = computeResponseQuality(answers, 30 * 15_000);
    expect(q.flags.excessive_middle_answers).toBe(true);
    expect(q.dataQuality).not.toBe('gut');
  });

  it('does not over-flag tiny samples or missing duration', () => {
    const answers: QualityAnswer[] = [{ likert: 3, reverse: false }, { likert: 4, reverse: true }];
    const q = computeResponseQuality(answers, null);
    expect(q.flags.too_fast).toBe(false);
    expect(q.flags.straightlining).toBe(false);
    expect(q.dataQuality).toBe('gut');
    expect(q.secondsPerItem).toBeNull();
  });
});
