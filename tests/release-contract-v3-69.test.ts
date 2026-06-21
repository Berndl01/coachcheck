import { describe, it, expect } from 'vitest';
import {
  MODULES,
  MODULE_CODES,
  AXES,
  PRODUCT_ITEM_COUNTS,
  MIN_ARCHETYPES,
  SCORING_VERSION,
  ITEMPOOL_VERSION,
  RELEASE_SCHEMA_VERSION,
  expectedItemCountForSlug,
  checkItemsAgainstContract,
  contractSelfConsistent,
  type ContractItem,
} from '@/lib/release/contract';
import { evaluateReadiness } from '@/lib/release/readiness';
import { AXIS_KEYS } from '@/lib/scoring';

// ---------------------------------------------------------------------------
// Vertrag selbst
// ---------------------------------------------------------------------------
describe('Release-Vertrag — Struktur', () => {
  it('genau sieben Module, sechs Achsen', () => {
    expect(MODULES).toHaveLength(7);
    expect(MODULE_CODES).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(AXES).toHaveLength(6);
    expect(contractSelfConsistent()).toBe(true);
  });

  it('Achsen-Schlüssel decken sich exakt mit scoring.AXIS_KEYS', () => {
    const contractKeys = AXES.map((a) => a.key).sort();
    expect(contractKeys).toEqual([...AXIS_KEYS].sort());
  });

  it('jedes Modul + jede Achse trägt nicht-leere Pole', () => {
    for (const m of MODULES) {
      expect(m.poleLeft.trim().length).toBeGreaterThan(0);
      expect(m.poleRight.trim().length).toBeGreaterThan(0);
    }
    for (const a of AXES) {
      expect(a.poleLow.trim().length).toBeGreaterThan(0);
      expect(a.poleHigh.trim().length).toBeGreaterThan(0);
    }
  });

  it('Produkt-Itemzahlen + Versionen wie beworben', () => {
    expect(PRODUCT_ITEM_COUNTS.schnelltest).toBe(27);
    expect(PRODUCT_ITEM_COUNTS.selbsttest).toBe(103);
    expect(PRODUCT_ITEM_COUNTS.spiegel_360).toBe(103);
    expect(PRODUCT_ITEM_COUNTS.teamcheck).toBe(77);
    expect(PRODUCT_ITEM_COUNTS.saison_beratung).toBeNull();
    expect(expectedItemCountForSlug('selbsttest')).toBe(103);
    expect(expectedItemCountForSlug('unbekannt')).toBeNull();
    expect(expectedItemCountForSlug(null)).toBeNull();
    expect(MIN_ARCHETYPES).toBe(12);
    expect(SCORING_VERSION).toBeGreaterThanOrEqual(1);
    expect(ITEMPOOL_VERSION).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Item-Vertragsprüfung (Fail-Closed-Gate)
// ---------------------------------------------------------------------------
function spannungsfeld(id: number, left: string, right: string): ContractItem {
  return { id, format: 'spannungsfeld', module_code: 'A', options: [{ left, right }] };
}
function likert(id: number): ContractItem {
  return { id, format: 'likert_5', module_code: 'B', options: null };
}

describe('checkItemsAgainstContract', () => {
  it('akzeptiert vollständige Items mit korrekter Zahl + Polen', () => {
    const items = [spannungsfeld(1, 'Struktur', 'Flexibilität'), likert(2), likert(3)];
    const res = checkItemsAgainstContract(items, 3);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.itemCount).toBe(3);
  });

  it('leerer Pool → empty_pool', () => {
    const res = checkItemsAgainstContract([], 3);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations[0].kind).toBe('empty_pool');
  });

  it('falsche Itemzahl → item_count', () => {
    const items = [likert(1), likert(2)];
    const res = checkItemsAgainstContract(items, 3);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const v = res.violations.find((x) => x.kind === 'item_count');
      expect(v).toBeTruthy();
      if (v && v.kind === 'item_count') {
        expect(v.expected).toBe(3);
        expect(v.actual).toBe(2);
      }
    }
  });

  it('Spannungsfeld ohne Pol → missing_pole', () => {
    const items = [spannungsfeld(1, 'Struktur', ''), likert(2)];
    const res = checkItemsAgainstContract(items, 2);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations.some((v) => v.kind === 'missing_pole' && v.itemId === 1)).toBe(true);
  });

  it('Platzhalter-Pol „Pol A"/„Pol B" → placeholder_pole', () => {
    const items = [spannungsfeld(7, 'Pol A', 'Pol B')];
    const res = checkItemsAgainstContract(items, 1);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations.some((v) => v.kind === 'placeholder_pole')).toBe(true);
  });

  it('Nicht-Spannungsfeld-Items werden bei der Pol-Prüfung ignoriert', () => {
    const items = [likert(1), likert(2)];
    const res = checkItemsAgainstContract(items, 2);
    expect(res.ok).toBe(true);
  });

  it('ohne erwartete Zahl (null) wird die Itemzahl nicht erzwungen', () => {
    const items = [likert(1), likert(2), likert(3)];
    const res = checkItemsAgainstContract(items, null);
    expect(res.ok).toBe(true);
  });

  // --- P0.3: erweiterte Itemprüfung ---------------------------------------
  it('doppelte ID → duplicate_id', () => {
    const res = checkItemsAgainstContract([likert(1), likert(1)], 2);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations.some((v) => v.kind === 'duplicate_id')).toBe(true);
  });

  it('doppelter Code → duplicate_code', () => {
    const items: ContractItem[] = [
      { id: 1, code: 'A01', module_code: 'A', format: 'likert_5', text_de: 'Frage 1', options: null },
      { id: 2, code: 'A01', module_code: 'A', format: 'likert_5', text_de: 'Frage 2', options: null },
    ];
    const res = checkItemsAgainstContract(items, 2);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations.some((v) => v.kind === 'duplicate_code')).toBe(true);
  });

  it('leerer Fragetext → missing_text', () => {
    const items: ContractItem[] = [{ id: 1, code: 'A01', module_code: 'A', format: 'likert_5', text_de: '   ', options: null }];
    const res = checkItemsAgainstContract(items, 1);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations.some((v) => v.kind === 'missing_text')).toBe(true);
  });

  it('unbekanntes Modul → bad_module', () => {
    const items: ContractItem[] = [{ id: 1, code: 'Z01', module_code: 'Z', format: 'likert_5', text_de: 'Frage', options: null }];
    const res = checkItemsAgainstContract(items, 1);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations.some((v) => v.kind === 'bad_module')).toBe(true);
  });

  it('nicht unterstütztes Format → unsupported_format', () => {
    const items: ContractItem[] = [{ id: 1, code: 'A01', module_code: 'A', format: 'freitext', text_de: 'Frage', options: null }];
    const res = checkItemsAgainstContract(items, 1);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations.some((v) => v.kind === 'unsupported_format')).toBe(true);
  });

  it('Auswahlitem ohne vollständige Optionen → incomplete_options', () => {
    const items: ContractItem[] = [{ id: 1, code: 'A01', module_code: 'A', format: 'forced_choice', text_de: 'Frage', options: [{ key: 'a', text: '' }, { key: 'b', text: 'B' }] }];
    const res = checkItemsAgainstContract(items, 1);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations.some((v) => v.kind === 'incomplete_options')).toBe(true);
  });

  it('Auswahlitem mit doppeltem Optionsschlüssel → duplicate_option_key', () => {
    const items: ContractItem[] = [{ id: 1, code: 'A01', module_code: 'A', format: 'forced_choice', text_de: 'Frage', options: [{ key: 'a', text: 'A' }, { key: 'a', text: 'B' }] }];
    const res = checkItemsAgainstContract(items, 1);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations.some((v) => v.kind === 'duplicate_option_key')).toBe(true);
  });

  it('vollständiges Auswahlitem ist gültig', () => {
    const items: ContractItem[] = [{ id: 1, code: 'A01', module_code: 'A', format: 'forced_choice', text_de: 'Frage', options: [{ key: 'a', text: 'A' }, { key: 'b', text: 'B' }] }];
    const res = checkItemsAgainstContract(items, 1);
    expect(res.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Readiness gegen eine Fake-DB
// ---------------------------------------------------------------------------
function tableResult(rows: unknown, error: unknown = null) {
  const result = { data: rows, error };
  const builder: any = {
    select: () => builder,
    eq: () => Promise.resolve(result),
    then: (res: (v: typeof result) => unknown) => Promise.resolve(result).then(res),
  };
  return builder;
}

function fakeAdmin(opts: {
  items?: unknown;
  archetypes?: unknown;
  products?: unknown;
  releaseContract?: unknown;
  integrity?: { ok: boolean; problems: string[] };
  integrityError?: boolean;
}) {
  const defaultContract = [
    {
      schema_version: RELEASE_SCHEMA_VERSION,
      scoring_version: SCORING_VERSION,
      itempool_version: ITEMPOOL_VERSION,
    },
  ];
  return {
    from(tbl: string) {
      if (tbl === 'items') return tableResult(opts.items ?? []);
      if (tbl === 'archetypes') return tableResult(opts.archetypes ?? []);
      if (tbl === 'products') return tableResult(opts.products ?? []);
      if (tbl === 'release_contract') return tableResult(opts.releaseContract ?? defaultContract);
      return tableResult([]);
    },
    rpc(name: string) {
      if (name === 'coachcheck_release_integrity') {
        if (opts.integrityError) {
          return Promise.resolve({ data: null, error: { message: 'function does not exist' } });
        }
        return Promise.resolve({ data: opts.integrity ?? { ok: true, problems: [] }, error: null });
      }
      return Promise.resolve({ data: null, error: { message: 'no fn' } });
    },
  } as any;
}

function fullArchetypes(n = 12) {
  const profile: Record<string, number> = {};
  for (const k of AXIS_KEYS) profile[k] = 0.5;
  return Array.from({ length: n }, (_, i) => ({ code: `AT_${i + 1}`, axis_profile: { ...profile } }));
}

function allModuleItems() {
  // ein Item je Modul + ein vollständiges Spannungsfeld
  const base = MODULE_CODES.map((c, i) => ({ id: i + 1, module_code: c, format: 'likert_5', options: null }));
  base.push({ id: 100, module_code: 'A', format: 'spannungsfeld', options: [{ left: 'Struktur', right: 'Flexibilität' }] } as any);
  return base;
}

const goodProducts = [
  { slug: 'schnelltest', item_count: 27 },
  { slug: 'selbsttest', item_count: 103 },
  { slug: 'spiegel_360', item_count: 103 },
  { slug: 'teamcheck', item_count: 77 },
  { slug: 'saison_beratung', item_count: null },
];

describe('evaluateReadiness', () => {
  it('alles korrekt → ready true', async () => {
    const admin = fakeAdmin({ items: allModuleItems(), archetypes: fullArchetypes(), products: goodProducts });
    const r = await evaluateReadiness(admin);
    expect(r.ready, JSON.stringify(r.checks.filter((c) => !c.ok))).toBe(true);
  });

  it('fehlendes Modul → ready false (modules_present)', async () => {
    const items = allModuleItems().filter((it) => it.module_code !== 'G');
    const admin = fakeAdmin({ items, archetypes: fullArchetypes(), products: goodProducts });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'modules_present')?.ok).toBe(false);
  });

  it('Spannungsfeld ohne Pol → ready false (spannungsfeld_poles)', async () => {
    const items = allModuleItems();
    (items[items.length - 1] as any).options = [{ left: 'Struktur', right: '' }];
    const admin = fakeAdmin({ items, archetypes: fullArchetypes(), products: goodProducts });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'spannungsfeld_poles')?.ok).toBe(false);
  });

  it('nicht unterstütztes Format → ready false (full_item_contract)', async () => {
    const items = allModuleItems();
    (items as any[]).push({ id: 500, code: 'X1', module_code: 'A', format: 'freitext', text_de: 'Frage?', options: null });
    const admin = fakeAdmin({ items, archetypes: fullArchetypes(), products: goodProducts });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'full_item_contract')?.ok).toBe(false);
  });

  it('doppelte Item-Codes → ready false (full_item_contract)', async () => {
    const items = allModuleItems().map((it, i) => ({ ...it, code: 'DUP', text_de: `F${i}?` }));
    const admin = fakeAdmin({ items, archetypes: fullArchetypes(), products: goodProducts });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'full_item_contract')?.ok).toBe(false);
  });

  it('Itemzahl-Drift → ready false (product_item_count)', async () => {
    const products = goodProducts.map((p) => (p.slug === 'selbsttest' ? { ...p, item_count: 99 } : p));
    const admin = fakeAdmin({ items: allModuleItems(), archetypes: fullArchetypes(), products });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'product_item_count')?.ok).toBe(false);
  });

  it('unvollständiges Archetyp-Profil → ready false (axes_in_archetypes)', async () => {
    const archetypes = fullArchetypes();
    delete (archetypes[0].axis_profile as Record<string, number>).reflexion_direktheit;
    const admin = fakeAdmin({ items: allModuleItems(), archetypes, products: goodProducts });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'axes_in_archetypes')?.ok).toBe(false);
  });

  it('zu wenige Archetypen → ready false (archetypes_count)', async () => {
    const admin = fakeAdmin({ items: allModuleItems(), archetypes: fullArchetypes(5), products: goodProducts });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'archetypes_count')?.ok).toBe(false);
  });

  it('DB-Integritätsfunktion meldet Problem → ready false (db_integrity_fn)', async () => {
    const admin = fakeAdmin({
      items: allModuleItems(),
      archetypes: fullArchetypes(),
      products: goodProducts,
      integrity: { ok: false, problems: ['Itemzahl-Drift Produkt selbsttest'] },
    });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'db_integrity_fn')?.ok).toBe(false);
  });

  // --- P0.1: Fail-CLOSED gegen unvollständig migrierte DB ------------------
  it('fehlende DB-Integritätsfunktion (Migration 45 fehlt) → ready false (fail-closed)', async () => {
    const admin = fakeAdmin({
      items: allModuleItems(),
      archetypes: fullArchetypes(),
      products: goodProducts,
      integrityError: true,
    });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'db_integrity_fn')?.ok).toBe(false);
  });

  it('release_contract fehlt in der DB → ready false (release_contract_version)', async () => {
    const admin = fakeAdmin({
      items: allModuleItems(),
      archetypes: fullArchetypes(),
      products: goodProducts,
      releaseContract: [],
    });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'release_contract_version')?.ok).toBe(false);
  });

  it('nur bis Migration 45 migriert (schema_version 45 ≠ Code 46) → ready false', async () => {
    const admin = fakeAdmin({
      items: allModuleItems(),
      archetypes: fullArchetypes(),
      products: goodProducts,
      releaseContract: [{ schema_version: 45, scoring_version: SCORING_VERSION, itempool_version: ITEMPOOL_VERSION }],
    });
    const r = await evaluateReadiness(admin);
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.id === 'release_contract_version')?.ok).toBe(false);
  });
});
