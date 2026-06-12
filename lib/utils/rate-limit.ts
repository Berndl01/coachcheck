/**
 * Persistenter Rate-Limit (P0).
 *
 * Nutzt Upstash Redis über die REST-API, WENN die Env-Variablen gesetzt sind:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Andernfalls automatischer Fallback auf einen Process-lokalen In-Memory-Zähler
 * (wie zuvor) — d. h. die App funktioniert ohne Konfiguration weiter, wird aber
 * sofort serverless-tauglich, sobald Upstash hinterlegt ist. Kein Code-Deploy
 * nötig zum Umschalten, nur Env setzen.
 *
 * Fixed-Window-Zähler: INCR key; beim ersten Treffer EXPIRE setzen.
 */

const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_ = process.env.UPSTASH_REDIS_REST_TOKEN;
const upstashEnabled = !!(URL_ && TOKEN_);

/** true, wenn persistentes (Upstash-)Rate-Limit aktiv ist — sonst In-Memory-Fallback. */
export function isPersistentRateLimit(): boolean {
  return upstashEnabled;
}

export type RateResult = { ok: boolean; retryAfterMs: number };

// --- In-Memory-Fallback -------------------------------------------------
const HITS = new Map<string, { count: number; resetAt: number }>();
function memoryLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const entry = HITS.get(key);
  if (!entry || entry.resetAt < now) {
    HITS.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (entry.count >= limit) return { ok: false, retryAfterMs: entry.resetAt - now };
  entry.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

async function upstash(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(`${URL_}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN_}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    // Rate-Limit darf den Request nicht ewig blockieren.
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(json.error);
  return json.result;
}

/**
 * Prüft & inkrementiert das Limit für `key`. Async.
 * Bei Upstash-Fehler → Fail-open auf In-Memory (Verfügbarkeit > Härte).
 */
export async function checkRateLimit(key: string, limit = 60, windowMs = 60_000): Promise<RateResult> {
  if (!upstashEnabled) return memoryLimit(key, limit, windowMs);
  const k = `rl:${key}`;
  try {
    const count = Number(await upstash(['INCR', k]));
    if (count === 1) {
      await upstash(['PEXPIRE', k, windowMs]);
    }
    if (count > limit) {
      const pttl = Number(await upstash(['PTTL', k]));
      return { ok: false, retryAfterMs: pttl > 0 ? pttl : windowMs };
    }
    return { ok: true, retryAfterMs: 0 };
  } catch (err) {
    console.warn('[rate-limit] upstash failed, falling back to memory:', err instanceof Error ? err.message : err);
    return memoryLimit(key, limit, windowMs);
  }
}
