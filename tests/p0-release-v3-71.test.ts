import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isValidAnswerValue } from '@/lib/assessment/answer-validity';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

// ---------------------------------------------------------------------------
// P0.5 — Choice-Finalisierung fail-closed (zentrale, testbare Funktion)
// ---------------------------------------------------------------------------
describe('P0.5 · isValidAnswerValue (fail-closed)', () => {
  it('lehnt Choice-Antwort ab, wenn das Item keine Optionen hat', () => {
    expect(isValidAnswerValue('forced_choice', { value_choice: 'A', item: { options: [] } })).toBe(false);
    expect(isValidAnswerValue('forced_choice', { value_choice: 'A', item: { options: null } })).toBe(false);
    expect(isValidAnswerValue('forced_choice', { value_choice: 'A', item: null })).toBe(false);
  });

  it('akzeptiert Choice nur bei gültigem Optionsschlüssel', () => {
    const item = { options: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }] };
    expect(isValidAnswerValue('forced_choice', { value_choice: 'A', item })).toBe(true);
    expect(isValidAnswerValue('forced_choice', { value_choice: 'C', item })).toBe(false);
    expect(isValidAnswerValue('forced_choice', { value_choice: '', item })).toBe(false);
  });

  it('numerische Formate: nur ganze Zahlen 1..5', () => {
    expect(isValidAnswerValue('likert_5', { value_numeric: 3 })).toBe(true);
    expect(isValidAnswerValue('likert_5', { value_numeric: 0 })).toBe(false);
    expect(isValidAnswerValue('likert_5', { value_numeric: 6 })).toBe(false);
    expect(isValidAnswerValue('likert_5', { value_numeric: 2.5 })).toBe(false);
  });

  it('Spannungsfeld: Position 0..1', () => {
    expect(isValidAnswerValue('spannungsfeld', { value_position: 0.5 })).toBe(true);
    expect(isValidAnswerValue('spannungsfeld', { value_position: 0 })).toBe(true);
    expect(isValidAnswerValue('spannungsfeld', { value_position: 1 })).toBe(true);
    expect(isValidAnswerValue('spannungsfeld', { value_position: 1.2 })).toBe(false);
    expect(isValidAnswerValue('spannungsfeld', { value_position: undefined })).toBe(false);
  });

  it('Finalize-Route nutzt die zentrale Funktion (kein inline fail-open mehr)', () => {
    const f = read('app', 'api', 'assessment', '[id]', 'finalize', 'route.ts');
    expect(f).toMatch(/isValidAnswerValue/);
    expect(f).not.toMatch(/return true;\s*\n\s*}\s*\n\s*return false;\s*\n\s*};/);
  });
});

// ---------------------------------------------------------------------------
// P0.2 — Readiness prüft den vollständigen Item-Vertrag
// ---------------------------------------------------------------------------
describe('P0.2 · Readiness voller Item-Vertrag', () => {
  it('Readiness lädt code + text_de und prüft den vollen Vertrag', () => {
    const r = read('lib', 'release', 'readiness.ts');
    expect(r).toMatch(/select\('id, code, module_code, format, text_de, options'\)/);
    expect(r).toMatch(/full_item_contract/);
    expect(r).toMatch(/checkItemsAgainstContract/);
  });

  it('Migration 47 spiegelt den Vertrag DB-seitig + hebt schema_version auf 47', () => {
    const m = read('supabase', 'migrations', '47_full_item_contract_integrity.sql');
    expect(m).toMatch(/Doppelte Item-Codes/);
    expect(m).toMatch(/Items ohne Fragetext/);
    expect(m).toMatch(/Nicht unterstuetzte Formate/);
    expect(m).toMatch(/unvollstaendigen Optionen/);
    expect(m).toMatch(/doppelten Optionsschluesseln/);
    expect(m).toMatch(/set\s+schema_version\s*=\s*47/);
  });
});

// ---------------------------------------------------------------------------
// P0.4 — Snapshot ist die alleinige Ergebnisquelle
// ---------------------------------------------------------------------------
describe('P0.4 · Snapshot als alleinige Quelle', () => {
  it('Finalize friert die vollständige Archetyp-Darstellung ein', () => {
    const f = read('app', 'api', 'assessment', '[id]', 'finalize', 'route.ts');
    expect(f).toMatch(/archetypes:\s*{/);
    expect(f).toMatch(/short_trait/);
    expect(f).toMatch(/entwicklungshebel/);
    // Archetyp-Query lädt jetzt die Anzeigefelder mit
    expect(f).toMatch(/select\('id, code, name_de, short_trait, kernmuster, staerken, risiken, entwicklungshebel, axis_profile'\)/);
  });

  it('Ergebnisseite überlagert Archetyp-Texte aus dem Snapshot + Indikatoren snapshot-first', () => {
    const p = read('app', 'assessment', '[id]', 'result', 'page.tsx');
    expect(p).toMatch(/snap\?\.archetypes\?\.primary/);
    expect(p).toMatch(/snap\?\.development_indicators \?\? null/);
  });

  it('Re-Check filtert auf Produkt + Scoring-/Itempool-Version + Snapshot', () => {
    const p = read('app', 'assessment', '[id]', 'result', 'page.tsx');
    expect(p).toMatch(/\.eq\('product_id'/);
    expect(p).toMatch(/\.eq\('scoring_version'/);
    expect(p).toMatch(/\.eq\('itempool_version'/);
    expect(p).toMatch(/\.not\('result_snapshot', 'is', null\)/);
  });

  it('Report nutzt eingefrorene Achsen + überlagerte Archetyp-Texte', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'report', 'route.ts');
    expect(r).toMatch(/axisScoresFrozen/);
    expect(r).toMatch(/frozenSnap\?\.archetypes\?\.primary/);
    expect(r).not.toMatch(/assessment\.axis_scores as AxisScores/);
  });
});

// ---------------------------------------------------------------------------
// P0.6 — Modulanzeige im Web: qualitativ, nicht bipolar/prozentual
// ---------------------------------------------------------------------------
describe('P0.6 · Modul-Darstellung sicher (qualitativ)', () => {
  it('Web-Modulbereich zeigt keine bipolare Pol-Position/Prozente mehr', () => {
    const p = read('app', 'assessment', '[id]', 'result', 'page.tsx');
    expect(p).toMatch(/Qualitativer Reflexionsbereich/);
    expect(p).toMatch(/keine bipolare Positionierung/);
    // entfernt: gerichtete Tendenz-Helper + Modul-Positionspunkt
    expect(p).not.toMatch(/moduleTendency/);
    expect(p).not.toMatch(/Tendenz zu/);
  });
});

// ---------------------------------------------------------------------------
// P0.7 — Versionierte PDF-Pfade
// ---------------------------------------------------------------------------
describe('P0.7 · Versionierte PDF-Speicherpfade', () => {
  it('uploadReportPDF schreibt versioniert mit upsert:false', () => {
    const s = read('lib', 'pdf', 'storage.ts');
    expect(s).toMatch(/randomUUID/);
    expect(s).toMatch(/\$\{userId\}\/\$\{assessmentId\}\/\$\{versionId\}\.pdf/);
    expect(s).toMatch(/upsert:\s*false/);
    expect(s).not.toMatch(/upsert:\s*true/);
  });

  it('Report räumt alte Datei erst NACH erfolgreicher Transaktion auf', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'report', 'route.ts');
    expect(r).toMatch(/previousStoragePath/);
    // Aufräumen steht nach dem Erfolgs-Guard (finalizeErr)
    const idxFinalize = r.indexOf('Report-Finalisierung fehlgeschlagen');
    const idxCleanup = r.indexOf('previousStoragePath && previousStoragePath !== storagePath');
    expect(idxCleanup).toBeGreaterThan(idxFinalize);
  });
});

// ---------------------------------------------------------------------------
// P0.3 — Release-E2E + variable Antwortsequenz
// ---------------------------------------------------------------------------
describe('P0.3 · Release-E2E', () => {
  it('release-flow Spec existiert und nutzt eine variable, gültige Antwortsequenz', () => {
    const e = read('tests', 'e2e', 'release-flow.spec.ts');
    expect(e).toMatch(/answerVariably|answerSequence|nextLikert/);
    // nicht immer dieselbe erste Antwort (sonst nicht interpretierbare Qualität)
    expect(e).toMatch(/aria-pressed/);
  });

  it('package.json hat release:verify + test:e2e:release', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts['test:e2e:release']).toBeTruthy();
    expect(pkg.scripts['release:verify']).toBeTruthy();
  });

  it('questionnaire-E2E läuft durch ALLE Items (nicht nur den ersten Screen)', () => {
    const q = read('tests', 'e2e', 'questionnaire.spec.ts');
    expect(q).toMatch(/for \(/);
    expect(q).toMatch(/data-testid="pole-left"/);
  });
});
