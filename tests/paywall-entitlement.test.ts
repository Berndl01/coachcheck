import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Quell-Ebenen-Invariante (v3_30 — Paywall/Entitlement P0):
 *
 * Bewiesen gegen echte DB: nach Migration 27 kann ein eingeloggter Nutzer
 * weder assessments anlegen noch ändern (RLS-Lockdown), und die Report-Route
 * erzeugt nur mit bezahlter Purchase einen Report. Diese Tests verhindern, dass
 * ein künftiger Refactor den Lockdown oder das Entitlement-Gate still entfernt.
 */

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

describe('Paywall-Lockdown auf DB-Ebene (Migration)', () => {
  const dir = join(ROOT, 'supabase', 'migrations');
  const all = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const lockdown = all.map((f) => read('supabase', 'migrations', f)).join('\n').toLowerCase();

  it('entfernt die Browser-INSERT-Policy auf assessments', () => {
    expect(lockdown).toMatch(/drop policy if exists assessments_insert_own on public\.assessments/);
  });
  it('entfernt die Browser-UPDATE-Policy auf assessments', () => {
    expect(lockdown).toMatch(/drop policy if exists assessments_update_own on public\.assessments/);
  });
  it('bindet assessments an purchases (purchase_id)', () => {
    expect(lockdown).toMatch(/add column if not exists purchase_id uuid references public\.purchases/);
  });
  it('verankert die Lockdown-Assertion (keine Schreib-Policy verbleibt)', () => {
    expect(lockdown).toMatch(/paywall-lockdown unvollst/);
  });
});

describe('Entitlement-Gate in der Report-Route', () => {
  const route = read('app', 'api', 'assessment', '[id]', 'report', 'route.ts');
  it('importiert checkPaidEntitlement', () => {
    expect(route).toMatch(/checkPaidEntitlement/);
  });
  it('ruft das Gate auf und verweigert ohne Bezahlung (402)', () => {
    const n = route.replace(/\s+/g, ' ');
    expect(n).toMatch(/checkPaidEntitlement\(\s*admin\s*,\s*assessmentId\s*,\s*user\.id\s*\)/);
    expect(n).toMatch(/status:\s*402/);
  });
});

describe('Entitlement-Helper akzeptiert nur bezahlte, eigene Purchase', () => {
  const helper = read('lib', 'auth', 'entitlement.ts');
  it('verlangt Status paid', () => {
    expect(helper).toMatch(/status\s*!==\s*'paid'/);
  });
  it('refunded gilt NICHT als berechtigt (kein paid)', () => {
    // Da nur 'paid' akzeptiert wird, ist 'refunded' automatisch ausgeschlossen.
    expect(helper).not.toMatch(/status\s*===\s*'refunded'.*ok:\s*true/s);
  });
});

describe('Webhook bindet Purchase und entzieht bei Refund', () => {
  const wh = read('app', 'api', 'stripe', 'webhook', 'route.ts');
  it('setzt purchase_id beim Anlegen des Assessments', () => {
    expect(wh.replace(/\s+/g, ' ')).toMatch(/purchase_id:\s*purchaseId/);
  });
  it('verarbeitet charge.refunded → purchases auf refunded', () => {
    expect(wh).toMatch(/charge\.refunded/);
    expect(wh.replace(/\s+/g, ' ')).toMatch(/update\(\{\s*status:\s*'refunded'\s*\}\)/);
  });
});

describe('Consent-Nachweis ist Pflicht vor Checkout', () => {
  const start = read('app', 'checkout', '[slug]', 'start', 'route.ts');
  it('bricht den Checkout ab, wenn die Consent-Speicherung scheitert', () => {
    const n = start.replace(/\s+/g, ' ');
    expect(n).toMatch(/consentResults\.some\(\(ok\)\s*=>\s*!ok\)/);
  });
});
