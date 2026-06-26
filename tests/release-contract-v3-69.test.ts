import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  validateItemContract,
  type ContractItem,
  MODULE_CODES,
  MODULE_COUNT,
  AXIS_KEYS,
  AXIS_COUNT,
  DEVELOPMENT_INDICATOR_KEYS,
  EXPECTED_ARCHETYPE_COUNT,
  TIER_ITEM_COUNTS,
  expectedItemCountForTier,
} from '@/lib/release-contract';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

// Hilfsbau: erzeugt einen Itemsatz, der den Vertrag erfüllt (alle 7 Module,
// ein gültiges Spannungsfeld, gültige Auswahlfrage).
function buildValidSet(): ContractItem[] {
  const items: ContractItem[] = [];
  // 1 Likert je Modul A–G (deckt „alle Module vorhanden" ab)
  MODULE_CODES.forEach((code, i) => {
    items.push({
      id: i + 1,
      code: `${code}_x_0${i}`,
      module_code: code,
      format: 'likert_5',
      text_de: 'Frage',
      options: null,
    });
  });
  // gültiges Spannungsfeld
  items.push({
    id: 100,
    code: 'A_sf_01',
    module_code: 'A',
    format: 'spannungsfeld',
    text_de: 'Wo verortest du dich?',
    options: [{ left: 'Struktur', right: 'Flexibilität' }],
  });
  // gültige Auswahlfrage
  items.push({
    id: 101,
    code: 'B_fc_01',
    module_code: 'B',
    format: 'forced_choice',
    text_de: 'Was passt eher?',
    options: [{ key: 'a', text: 'A' }, { key: 'b', text: 'B' }],
  });
  return items;
}

describe('release-contract · Konstanten', () => {
  it('hat genau 7 Module, 6 Achsen, 6 Indikatoren, 12 Archetypen', () => {
    expect(MODULE_COUNT).toBe(7);
    expect(MODULE_CODES).toHaveLength(7);
    expect(AXIS_COUNT).toBe(6);
    expect(AXIS_KEYS).toHaveLength(6);
    expect(DEVELOPMENT_INDICATOR_KEYS).toHaveLength(6);
    expect(EXPECTED_ARCHETYPE_COUNT).toBe(12);
  });

  it('Itemzahlen je Tier entsprechen dem Pool-Stand (27/103/103/77, Tier 5 = null)', () => {
    expect(TIER_ITEM_COUNTS[1]).toBe(27);
    expect(TIER_ITEM_COUNTS[2]).toBe(103);
    expect(TIER_ITEM_COUNTS[3]).toBe(103);
    expect(TIER_ITEM_COUNTS[4]).toBe(77);
    expect(TIER_ITEM_COUNTS[5]).toBeNull();
    expect(expectedItemCountForTier(2)).toBe(103);
    expect(expectedItemCountForTier(99)).toBeNull();
  });
});

describe('validateItemContract · Fail-Closed-Logik', () => {
  it('leerer Itemsatz ist nicht ok', () => {
    const r = validateItemContract([], 2, { requireAllModules: true });
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.kind === 'empty')).toBe(true);
  });

  it('gültiger Itemsatz ohne Zahlprüfung ist ok', () => {
    const r = validateItemContract(buildValidSet(), null, { requireAllModules: true });
    expect(r.ok).toBe(true);
    expect(r.problems).toHaveLength(0);
  });

  it('falsche Itemzahl je Tier wird erkannt', () => {
    const r = validateItemContract(buildValidSet(), 2, { requireAllModules: true });
    // buildValidSet liefert 9 Items, Tier 2 erwartet 103 → count_mismatch
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.kind === 'count_mismatch')).toBe(true);
  });

  it('Spannungsfeld ohne rechten Pol wird erkannt (kein Ersatztext)', () => {
    const set = buildValidSet();
    const sf = set.find((i) => i.format === 'spannungsfeld')!;
    sf.options = [{ left: 'Struktur' }]; // rechter Pol fehlt
    const r = validateItemContract(set, null, { requireAllModules: true });
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.kind === 'spannungsfeld_missing_pole')).toBe(true);
  });

  it('unbekanntes Format wird erkannt', () => {
    const set = buildValidSet();
    set[0] = { ...set[0], format: 'mega_slider' };
    const r = validateItemContract(set, null, { requireAllModules: true });
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.kind === 'unknown_format')).toBe(true);
  });

  it('fehlendes Modul wird bei requireAllModules erkannt', () => {
    const set = buildValidSet().filter((i) => i.module_code !== 'G');
    const r = validateItemContract(set, null, { requireAllModules: true });
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.kind === 'module_missing')).toBe(true);
  });

  it('Auswahlfrage mit nur einer Option wird erkannt', () => {
    const set = buildValidSet();
    const fc = set.find((i) => i.format === 'forced_choice')!;
    fc.options = [{ key: 'a', text: 'A' }];
    const r = validateItemContract(set, null, { requireAllModules: true });
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.kind === 'choice_missing_options')).toBe(true);
  });
});

// ============================================================
// Quell-Invarianten: sichern die Release-Welle gegen Regression.
// ============================================================
describe('Release-Welle · Quell-Invarianten', () => {
  it('Item-Renderer enthält keinen „Pol A"/„Pol B"-Ersatztext mehr', () => {
    const src = read('components/assessment/item-renderer.tsx');
    expect(src).not.toMatch(/Pol A/);
    expect(src).not.toMatch(/Pol B/);
    // Fail-Closed: fehlende Pole führen zu „Frage nicht verfügbar".
    expect(src).toMatch(/Frage nicht verfügbar/);
  });

  it('Fragebogen-Seite prüft den Item-Vertrag vor dem Öffnen', () => {
    const src = read('app/assessment/[id]/page.tsx');
    expect(src).toMatch(/validateItemContract/);
    expect(src).toMatch(/requireAllModules:\s*true/);
  });

  it('Finalize schreibt den unveränderbaren Ergebnis-Snapshot', () => {
    const src = read('app/api/assessment/[id]/finalize/route.ts');
    expect(src).toMatch(/result_snapshot/);
    expect(src).toMatch(/scoring_version/);
    expect(src).toMatch(/expected_item_ids/);
    expect(src).toMatch(/development_indicators/);
  });

  it('Result-Seite rechnet Indikatoren NICHT mehr neu, sondern liest den Snapshot', () => {
    const src = read('app/assessment/[id]/result/page.tsx');
    expect(src).not.toMatch(/computeMaturityScores/);
    expect(src).toMatch(/result_snapshot/);
    // normierende Wertungen entfernt
    expect(src).not.toMatch(/souverän/);
    expect(src).not.toMatch(/gefestigt/);
    expect(src).toMatch(/Entwicklungsindikatoren/);
  });

  it('Result-Seite blockiert bei nicht interpretierbarer Antwortqualität + Wiederholung', () => {
    const src = read('app/assessment/[id]/result/page.tsx');
    expect(src).toMatch(/nicht_interpretierbar/);
    expect(src).toMatch(/ResultRetake/);
  });

  it('Report-Route blockiert nicht_interpretierbar und finalisiert transaktional', () => {
    const src = read('app/api/assessment/[id]/report/route.ts');
    expect(src).toMatch(/response_quality_blocked/);
    expect(src).toMatch(/finalize_report_atomic/);
    // PDF-Aufräumen bei DB-Fehler
    expect(src).toMatch(/deleteReportFiles/);
    // Fallback ehrlich als Basis-Auswertung
    expect(src).toMatch(/reportKind/);
    expect(src).toMatch(/Basis-Auswertung/);
  });

  it('Refund-Cascade archiviert aktive Aktionspläne', () => {
    const src = read('app/api/stripe/webhook/route.ts');
    expect(src).toMatch(/action_plans/);
    expect(src).toMatch(/archive action plans on refund/);
  });

  it('Action- und Check-in-Routen prüfen Entitlement (nach Refund gesperrt)', () => {
    expect(read('app/api/assessment/[id]/action/route.ts')).toMatch(/checkPaidEntitlement/);
    expect(read('app/api/action/[planId]/route.ts')).toMatch(/checkPaidEntitlement/);
  });

  it('Migration 45 + 46 liefern die erwarteten DB-Objekte', () => {
    const m45 = read('supabase/migrations/45_release_contract_integrity.sql');
    expect(m45).toMatch(/check_release_contract/);
    expect(m45).toMatch(/schema_meta/);
    const m46 = read('supabase/migrations/46_score_snapshot_timezone_report_finalize.sql');
    expect(m46).toMatch(/result_snapshot/);
    expect(m46).toMatch(/finalize_report_atomic/);
    expect(m46).toMatch(/report_kind/);
    expect(m46).toMatch(/timezone/);
  });

  it('Readiness-API ist geschützt und nutzt die Vertragsprüfung', () => {
    const src = read('app/api/admin/readiness/route.ts');
    expect(src).toMatch(/CRON_SECRET/);
    expect(src).toMatch(/check_release_contract/);
  });
});
