import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/utils/rate-limit';

// Ohne UPSTASH_*-Env läuft der In-Memory-Fallback — genau dieser wird getestet.
describe('checkRateLimit (in-memory fallback)', () => {
  it('allows up to the limit, then blocks', async () => {
    const key = `test:${Math.random()}`;
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      const r = await checkRateLimit(key, limit, 60_000);
      expect(r.ok).toBe(true);
    }
    const blocked = await checkRateLimit(key, limit, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('uses independent counters per key', async () => {
    const a = `test-a:${Math.random()}`;
    const b = `test-b:${Math.random()}`;
    await checkRateLimit(a, 1, 60_000);
    const aBlocked = await checkRateLimit(a, 1, 60_000);
    const bOk = await checkRateLimit(b, 1, 60_000);
    expect(aBlocked.ok).toBe(false);
    expect(bOk.ok).toBe(true);
  });

  it('resets after the window elapses', async () => {
    const key = `test-window:${Math.random()}`;
    const first = await checkRateLimit(key, 1, 20); // 20ms-Fenster
    expect(first.ok).toBe(true);
    expect((await checkRateLimit(key, 1, 20)).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 30));
    expect((await checkRateLimit(key, 1, 20)).ok).toBe(true);
  });
});
