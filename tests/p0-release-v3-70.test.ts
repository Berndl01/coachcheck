import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

// ---------------------------------------------------------------------------
// P0.1 — Migrations-Versionssplit + Readiness fail-closed
// ---------------------------------------------------------------------------
describe('P0.1 · Migrations-Version + Readiness fail-closed', () => {
  it('Migration 45 setzt schema_version = 45 (nicht 46)', () => {
    const m = read('supabase', 'migrations', '45_release_contract_integrity.sql');
    expect(m).toMatch(/values\s*\(true,\s*45,\s*1,\s*25\)/);
    expect(m).not.toMatch(/values\s*\(true,\s*46,/);
  });

  it('Migration 46 hebt schema_version erst am Ende auf 46', () => {
    const m = read('supabase', 'migrations', '46_score_snapshot_timezone_report_finalize.sql');
    expect(m).toMatch(/set\s+schema_version\s*=\s*46/);
    expect(m).toMatch(/schema_version\s*=\s*46/);
  });

  it('Readiness liest release_contract und ist fail-closed bei Integritätsfehler', () => {
    const r = read('lib', 'release', 'readiness.ts');
    expect(r).toMatch(/release_contract/);
    expect(r).toMatch(/release_contract_version/);
    // Integritätsfunktion-Fehler/-fehlen → NICHT mehr ok:true
    expect(r).toMatch(/add\('db_integrity_fn',\s*false/);
    expect(r).not.toMatch(/add\('db_integrity_fn',\s*true/);
  });
});

// ---------------------------------------------------------------------------
// P0.2 — Fragebogen prüft DB-Itemzahl zusätzlich gegen Code-Spec
// ---------------------------------------------------------------------------
describe('P0.2 · Fragebogen vs. Code-Spec', () => {
  it('Fragebogen-Seite vergleicht item_count mit expectedItemCountForSlug', () => {
    const p = read('app', 'assessment', '[id]', 'page.tsx');
    expect(p).toMatch(/expectedItemCountForSlug/);
    expect(p).toMatch(/spec_count_mismatch/);
  });
});

// ---------------------------------------------------------------------------
// P0.4 — Kein Platzhalter-Pol mehr, ehrlicher Unbeantwortet-Zustand
// ---------------------------------------------------------------------------
describe('P0.4 · Spannungsfeld ohne Platzhalter', () => {
  it('item-renderer enthält keinen „Pol A"/„Pol B"-Fallback mehr', () => {
    const r = read('components', 'assessment', 'item-renderer.tsx');
    expect(r).not.toMatch(/Pol A/);
    expect(r).not.toMatch(/Pol B/);
  });

  it('item-renderer trennt unbeantwortet von bewusster 50/50-Wahl', () => {
    const r = read('components', 'assessment', 'item-renderer.tsx');
    expect(r).toMatch(/Noch nicht beantwortet/);
    expect(r).toMatch(/50 \/ 50 bewusst auswählen/);
    expect(r).toMatch(/data-testid="pole-left"/);
    expect(r).toMatch(/data-testid="pole-right"/);
    expect(r).toMatch(/aria-valuetext/);
    expect(r).toMatch(/const answered = value !== undefined/);
  });
});

// ---------------------------------------------------------------------------
// P0.5 — Snapshot als Quelle (Web-Ergebnis + Report)
// ---------------------------------------------------------------------------
describe('P0.5 · Eingefrorener Snapshot als Lesequelle', () => {
  it('Ergebnisseite bevorzugt result_snapshot (Achsen/Indikatoren/Archetypen)', () => {
    const p = read('app', 'assessment', '[id]', 'result', 'page.tsx');
    expect(p).toMatch(/result_snapshot/);
    expect(p).toMatch(/snap\?\.axis_scores/);
    expect(p).toMatch(/snap\?\.development_indicators/);
  });

  it('Report bevorzugt eingefrorene Modul-Signale/-Gaps', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'report', 'route.ts');
    expect(r).toMatch(/moduleSnapshot/);
    expect(r).toMatch(/module_signals/);
    expect(r).toMatch(/module_gaps/);
  });

  it('Finalize friert module_gaps zusätzlich im Snapshot ein', () => {
    const f = read('app', 'api', 'assessment', '[id]', 'finalize', 'route.ts');
    expect(f).toMatch(/module_gaps:\s*moduleGaps/);
  });
});

// ---------------------------------------------------------------------------
// P0.6 — Finalize scort nur erwartete Items + prüft Choice-Schlüssel
// ---------------------------------------------------------------------------
describe('P0.6 · Finalize-Härtung', () => {
  it('nur erwartete Items fließen ins Scoring', () => {
    const f = read('app', 'api', 'assessment', '[id]', 'finalize', 'route.ts');
    expect(f).toMatch(/expectedIdSet/);
    expect(f).toMatch(/const validAnswers/);
    expect(f).toMatch(/validAnswers\.map/);
  });

  it('Choice-Wert wird gegen erlaubte Optionsschlüssel geprüft (zentrale Funktion)', () => {
    const helper = read('lib', 'assessment', 'answer-validity.ts');
    expect(helper).toMatch(/keys\.has\(row\.value_choice\)/);
    const f = read('app', 'api', 'assessment', '[id]', 'finalize', 'route.ts');
    expect(f).toMatch(/isValidAnswerValue/);
  });
});

// ---------------------------------------------------------------------------
// P0.7 — finalize_report_atomic mit Vorbedingungen
// ---------------------------------------------------------------------------
describe('P0.7 · Atomare Report-Finalisierung mit Guards', () => {
  it('RPC prüft Job-Zugehörigkeit, Status und Zeilenzahl', () => {
    const m = read('supabase', 'migrations', '46_score_snapshot_timezone_report_finalize.sql');
    expect(m).toMatch(/gehört nicht zu assessment/);
    expect(m).toMatch(/nicht abgeschlossen/);
    expect(m).toMatch(/nicht processing/);
    expect(m).toMatch(/get diagnostics/i);
    expect(m).toMatch(/for update/i);
  });
});

// ---------------------------------------------------------------------------
// P0.8 — Aktionshistorie nach Abschluss/Refund gesperrt
// ---------------------------------------------------------------------------
describe('P0.8 · Aktionshistorie-Schutz', () => {
  it('DELETE + PATCH sind an aktiven Status gebunden', () => {
    const a = read('app', 'api', 'action', '[planId]', 'route.ts');
    // Status-gebundenes Update beim Abschließen + 409 bei 0 Zeilen
    expect(a).toMatch(/\.eq\('status',\s*'active'\)/);
    expect(a).toMatch(/Fokus ist nicht aktiv/);
    // mindestens drei Stellen prüfen „aktiv" (POST + DELETE + PATCH)
    const count = (a.match(/Fokus ist nicht aktiv/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// P0.9 — Sieben Module im Web sichtbar (qualitativ)
// ---------------------------------------------------------------------------
describe('P0.9 · Sieben Führungsdimensionen im Web', () => {
  it('Ergebnisseite rendert die sieben Module qualitativ (nicht bipolar)', () => {
    const p = read('app', 'assessment', '[id]', 'result', 'page.tsx');
    expect(p).toMatch(/Sieben Führungsdimensionen/);
    expect(p).toMatch(/MODULES\.map/);
    // (v3.71 / P0.6) qualitativ statt bipolarer Pol-Position
    expect(p).toMatch(/Qualitativer Reflexionsbereich/);
    expect(p).not.toMatch(/moduleTendency/);
  });
});

// ---------------------------------------------------------------------------
// P0.10 — E2E-Tests sind nicht mehr dauerhaft deaktiviert
// ---------------------------------------------------------------------------
describe('P0.10 · E2E-Tests aktiviert', () => {
  it('purchase-flow nutzt keinen Dauer-fixme mehr', () => {
    const e = read('tests', 'e2e', 'purchase-flow.spec.ts');
    expect(e).not.toMatch(/test\.fixme\(true/);
    expect(e).toMatch(/E2E_ASSESSMENT_ID/);
    expect(e).toMatch(/waitForURL\(\/\\\/result\//);
  });

  it('questionnaire-Test ist ein echter (env-gated) Test', () => {
    const e = read('tests', 'e2e', 'questionnaire.spec.ts');
    expect(e).not.toMatch(/test\.fixme\(/);
    expect(e).toMatch(/data-testid="pole-left"/);
  });
});
