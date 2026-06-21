import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { RELEASE_SCHEMA_VERSION } from '@/lib/release/contract';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

// ---------------------------------------------------------------------------
// P0.1 — Migration 48 korrigiert die Release-Integrität (product_items → package_tiers)
//        Bewusst Variante B: Migration 47 bleibt UNVERÄNDERT, Migration 48 ersetzt
//        die Funktion additiv. So greift der Fix auf frischer DUND auf bereits
//        migrierten Umgebungen (Supabase wendet 47 dort nicht erneut an).
// ---------------------------------------------------------------------------
describe('P0.1 · Migration 48 repariert coachcheck_release_integrity()', () => {
  const M48 = '48_fix_release_integrity_product_items.sql';

  it('Migration 48 existiert', () => {
    expect(existsSync(join(ROOT, 'supabase', 'migrations', M48))).toBe(true);
  });

  it('nutzt die korrekte items.package_tiers-Abfrage (Coach-Items, kein product_items-FROM/JOIN)', () => {
    const m = read('supabase', 'migrations', M48);
    expect(m).toMatch(/rec\.tier\s*=\s*any\(i\.package_tiers\)/);
    expect(m).toMatch(/i\.player_item\s*=\s*false/);
    // Die kaputte, nicht existierende Tabelle darf NICHT in ausführbarem SQL stehen.
    expect(m).not.toMatch(/from\s+public\.product_items/i);
    expect(m).not.toMatch(/join\s+public\.items\s+i\s+on\s+i\.id\s*=\s*pi\.item_id/i);
  });

  it('behält ALLE übrigen Vertragsprüfungen aus Migration 47 (nur Block 3 gefixt)', () => {
    const m = read('supabase', 'migrations', M48);
    for (const marker of [
      'Fehlende Module im Itempool',
      'Spannungsfeld-Items ohne vollstaendige Pole',
      'Zu wenige Archetypen',
      'Doppelte Item-Codes',
      'Items ohne Fragetext',
      'Nicht unterstuetzte Formate',
      'unvollstaendigen Optionen',
      'doppelten Optionsschluesseln',
    ]) {
      expect(m).toContain(marker);
    }
  });

  it('hebt release_contract.schema_version auf 48 (where id = true, korrektes Schema)', () => {
    const m = read('supabase', 'migrations', M48);
    expect(m).toMatch(/update\s+public\.release_contract/);
    expect(m).toMatch(/set\s+schema_version\s*=\s*48/);
    expect(m).toMatch(/where\s+id\s*=\s*true/);
    // Es gibt KEINE Spalte release_name/singleton in dieser Tabelle. Die Gefahr ist
    // ausführbares SQL gegen nicht existierende Spalten/Tabellen — erläuternde
    // Kommentare dürfen die Begriffe nennen. Deshalb wird vor der Prüfung der
    // SQL-Kommentar (-- …) entfernt und nur der ausführbare Rest geprüft.
    const exec = m
      .split('\n')
      .map((l) => {
        const i = l.indexOf('--');
        return i === -1 ? l : l.slice(0, i);
      })
      .join('\n');
    expect(exec).not.toMatch(/release_name/i);
    expect(exec).not.toMatch(/singleton/i);
    expect(exec).not.toMatch(/coachcheck_release_contract/i);
  });

  it('(P0.2) führt die Integritätsfunktion WÄHREND der Migration aus und bricht bei ok!=true ab', () => {
    const m = read('supabase', 'migrations', M48);
    expect(m).toMatch(/select\s+public\.coachcheck_release_integrity\(\)/);
    expect(m).toMatch(/raise\s+exception/i);
    expect(m).toMatch(/integrity failed/i);
  });

  it('Code-Konstante RELEASE_SCHEMA_VERSION ist 48 (Readiness verlangt DB-Parität)', () => {
    expect(RELEASE_SCHEMA_VERSION).toBe(48);
  });

  it('Migration 47 bleibt unverändert (Variante B): trägt weiter product_items + schema_version=47', () => {
    const m47 = read('supabase', 'migrations', '47_full_item_contract_integrity.sql');
    expect(m47).toMatch(/from\s+public\.product_items\s+pi/i);
    expect(m47).toMatch(/set\s+schema_version\s*=\s*47/);
  });
});

// ---------------------------------------------------------------------------
// P0.3 / P0.4 — Release-E2E-Umgebung wird verpflichtend geprüft
// ---------------------------------------------------------------------------
describe('P0.3/P0.4 · Release-E2E-Env wird erzwungen', () => {
  it('assert-release-e2e-env.mjs existiert und prüft alle vier Variablen + exit(1)', () => {
    const s = read('scripts', 'assert-release-e2e-env.mjs');
    for (const v of ['PLAYWRIGHT_BASE_URL', 'E2E_EMAIL', 'E2E_PASSWORD', 'E2E_ASSESSMENT_ID']) {
      expect(s).toContain(v);
    }
    expect(s).toMatch(/process\.exit\(1\)/);
  });

  it('package.json: release:assert-env läuft VOR test:e2e:release in release:verify', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts['release:assert-env']).toBe('node scripts/assert-release-e2e-env.mjs');
    const verify = pkg.scripts['release:verify'] as string;
    expect(verify).toContain('release:assert-env');
    expect(verify).toContain('test:e2e:release');
    expect(verify.indexOf('release:assert-env')).toBeLessThan(verify.indexOf('test:e2e:release'));
  });
});

// ---------------------------------------------------------------------------
// P0.5 — Release-Tests können nicht mehr still übersprungen werden
// ---------------------------------------------------------------------------
describe('P0.5 · Release-E2E nicht mehr still übersprungen', () => {
  const specs = [
    'release-flow.spec.ts',
    'questionnaire.spec.ts',
    'purchase-flow.spec.ts',
  ];

  for (const spec of specs) {
    it(`${spec}: kein env-bedingtes test.skip mehr, dafür fail-loud beforeAll`, () => {
      const e = read('tests', 'e2e', spec);
      // Kein ausführbarer test.skip(...) mehr (Kommentare zählen nicht).
      const code = e
        .split('\n')
        .filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//'))
        .join('\n');
      expect(code).not.toMatch(/test\.skip\(/);
      expect(e).toContain('Release-E2E-Umgebung unvollständig');
    });
  }
});
