import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');
const MIG39 = read('supabase', 'migrations', '39_season_hardening.sql');

describe('Regression 1 · Saison-Schreibrouten nutzen wieder service_role', () => {
  const routes: [string, string[]][] = [
    ['cycles/start', ['app', 'api', 'seasons', '[id]', 'cycles', 'start', 'route.ts']],
    ['invitations/bulk', ['app', 'api', 'seasons', '[id]', 'invitations', 'bulk', 'route.ts']],
    ['cycles/close', ['app', 'api', 'seasons', '[id]', 'cycles', '[cycleId]', 'close', 'route.ts']],
  ];
  for (const [name, p] of routes) {
    it(`${name}: schreibt via admin + prüft Entitlement`, () => {
      const r = read(...p);
      expect(r).toMatch(/createAdminClient/);
      expect(r).toMatch(/requireSeasonEntitlement/);
    });
  }
  it('cycles/start + bulk schreiben NICHT mehr mit dem User-Client (supabase.from(...).insert)', () => {
    const a = read('app', 'api', 'seasons', '[id]', 'cycles', 'start', 'route.ts');
    const b = read('app', 'api', 'seasons', '[id]', 'invitations', 'bulk', 'route.ts');
    expect(a).toMatch(/admin\s*\n?\s*\.from\('pulse_cycles'\)\s*\n?\s*\.insert/);
    expect(b).toMatch(/admin\s*\n?\s*\.from\('pulse_invitations'\)\s*\n?\s*\.insert/);
  });
});

describe('Regression 2 · Pulse-RPCs nicht mehr für authenticated', () => {
  it('Migration 39 entzieht und vergibt nur an service_role', () => {
    expect(MIG39).toMatch(/revoke execute on function public\.compute_pulse_snapshot\(uuid\) from authenticated/);
    expect(MIG39).toMatch(/revoke execute on function public\.detect_pulse_trends\(uuid, uuid\) from authenticated/);
    expect(MIG39).toMatch(/grant\s+execute on function public\.compute_pulse_snapshot\(uuid\) to service_role/);
  });
  it('Submit-Route gibt die interne cycle_id NICHT mehr zurück', () => {
    const r = read('app', 'api', 'pulse', '[token]', 'submit', 'route.ts');
    // v3.43: Rückgabe enthält jetzt zusätzlich responseCount (Live-Zähler),
    // aber weiterhin NICHT die interne cycle_id.
    expect(r).toMatch(/return ok\(\{ saved: records\.length, responseCount \}\)/);
    expect(r).not.toMatch(/ok\(\{ cycle_id/);
  });
});

describe('Blocker 3 · Entitlement bei jeder Aktion + Bestandsbereinigung', () => {
  it('Entitlement-Helper prüft Kauf, Status, Tier 5', () => {
    const e = read('lib', 'season', 'entitlement.ts');
    expect(e).toMatch(/status !== 'paid'/);
    expect(e).toMatch(/tier < 5/);
    expect(e).toMatch(/purchase_id/);
  });
  it('Submit prüft Entitlement (refund-aware)', () => {
    const r = read('app', 'api', 'pulse', '[token]', 'submit', 'route.ts');
    expect(r).toMatch(/requireSeasonEntitlement\(admin, inv\.season_id\)/);
  });
  it('Migration 39 archiviert Alt-Saisons ohne Kauf + erzwingt purchase_id bei Insert', () => {
    expect(MIG39).toMatch(/set status = 'archived'[\s\S]*where purchase_id is null/);
    expect(MIG39).toMatch(/trg_enforce_season_purchase/);
    expect(MIG39).toMatch(/purchase_id darf nicht null sein/);
  });
  it('Migration 39: höchstens ein offener Cycle pro Saison', () => {
    expect(MIG39).toMatch(/pulse_cycles_one_open_per_season/);
    expect(MIG39).toMatch(/where status = 'open'/);
  });
});

describe('Stripe-Refund · transaktional + fail-loud', () => {
  it('Refund gibt bei DB-Fehler 500 zurück und zieht die Saison mit', () => {
    const w = read('app', 'api', 'stripe', 'webhook', 'route.ts');
    expect(w).toMatch(/Refund entitlement update failed/);
    expect(w).toMatch(/status: 'archived'[\s\S]*purchase_id/);
    expect(w).toMatch(/status: 'revoked'/);
  });
});

describe('PDF · Spielertyp-Karten 2-spaltig (keine Leerseite)', () => {
  it('Karten rendern im 2-spaltigen Raster (width 48%)', () => {
    const pdf = read('lib', 'pdf', 'report-document.tsx');
    expect(pdf).toMatch(/flexWrap: 'wrap'/);
    expect(pdf).toMatch(/width: '48%'/);
  });
});

describe('Doku · gefährlicher Rollback entfernt', () => {
  it('Keine anonymen using(true)-Policies mehr in der Checkliste', () => {
    const c = read('LAUNCH_CHECKLIST.md');
    expect(c).not.toMatch(/pulse_responses_anon_insert.*with check \(true\)/s);
    expect(c).not.toMatch(/Migration 12 rückgängig machen/);
  });
});
