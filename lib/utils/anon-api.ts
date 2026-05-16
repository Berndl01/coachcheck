/**
 * Geteilte Helper für anonyme Token-Endpoints.
 *
 * Diese Routes laufen mit Service Role und MÜSSEN deshalb
 * serverseitig alle Checks erzwingen, die früher (fälschlicherweise)
 * der Browser via RLS gemacht hat.
 */

// ------------------------------------------------------------
// In-Memory Rate Limit (pro Process, reicht für Vercel Edge Cases
// auf kleiner Last; bei Skalierung gegen Upstash/Redis tauschen).
// ------------------------------------------------------------
const HITS = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = HITS.get(key);
  if (!entry || entry.resetAt < now) {
    HITS.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

// ------------------------------------------------------------
// Token sanity check (verhindert dass jemand 50KB-Strings reinwirft)
// ------------------------------------------------------------
export function isValidTokenShape(token: unknown): token is string {
  return typeof token === 'string' && token.length >= 16 && token.length <= 128 && /^[A-Za-z0-9_-]+$/.test(token);
}

// ------------------------------------------------------------
// Standard JSON Responses
// ------------------------------------------------------------
export function bad(status: number, message: string, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: message, ...(extra ?? {}) }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function ok(data: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
