import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

// ============================================================
// LAUNCH.md ist das verbindliche, konsistente Startdokument.
// ============================================================
describe('LAUNCH.md · verbindliches Startdokument', () => {
  const L = read('LAUNCH.md');

  it('nennt den aktuellen Migrationsstand 01 → 48', () => {
    expect(L).toMatch(/01 → 48/);
  });

  it('nennt die drei neuen Tabellen, die live vorhanden sein müssen', () => {
    expect(L).toMatch(/result_feedback/);
    expect(L).toMatch(/action_plans/);
    expect(L).toMatch(/action_checkins/);
  });

  it('nennt die exakt behandelten Stripe-Webhook-Events', () => {
    expect(L).toMatch(/checkout\.session\.completed/);
    expect(L).toMatch(/charge\.refunded/);
    expect(L).toMatch(/charge\.dispute\.created/);
  });

  it('führt das Rechts-Gate ausdrücklich und ungelöst (Anwalt)', () => {
    expect(L).toMatch(/FAGG/);
    expect(L).toMatch(/Anwält|Anwalt/);
    expect(L).toMatch(/AVV/);
  });

  it('enthält die geordneten Schritte 1–7 und eine Live-Definition', () => {
    expect(L).toMatch(/Schritt 1 —/);
    expect(L).toMatch(/Schritt 7 —/);
    expect(L).toMatch(/Du bist live/);
  });

  it('Migrationsstand in LAUNCH.md deckt sich mit der höchsten Migrationsdatei', () => {
    const nums = readdirSync(join(ROOT, 'supabase', 'migrations'))
      .filter((f) => f.endsWith('.sql'))
      .map((f) => parseInt(f.slice(0, 2), 10))
      .filter((n) => !Number.isNaN(n));
    const highest = Math.max(...nums);
    expect(highest).toBe(48);
    expect(L).toMatch(new RegExp(`01 → ${highest}`));
  });
});

// ============================================================
// GO-LIVE.md verweist auf LAUNCH.md (kein Ambiguität).
// ============================================================
describe('GO-LIVE.md verweist auf LAUNCH.md', () => {
  it('zeigt LAUNCH.md als maßgebliches Startdokument', () => {
    expect(read('GO-LIVE.md')).toMatch(/LAUNCH\.md/);
  });
});
