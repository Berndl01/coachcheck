/**
 * LIVE-READINESS-PRÜFUNG gegen den Release-Vertrag.
 *
 * Liest mit einem service_role-Client die reale DB und prüft, ob das Modell so
 * deployed ist, wie der Vertrag (lib/release/contract.ts) es verlangt:
 *
 *   - alle sieben Module sind im Itempool vorhanden,
 *   - alle sechs Achsen sind im Archetypen-Modell referenziert,
 *   - jedes Spannungsfeld-Item trägt beide Pole (links/rechts), keiner leer,
 *   - je Produkt: DB-`item_count` == Vertrags-Itemzahl (Advertised = Spec),
 *   - mindestens zwölf vollständige Archetypen.
 *
 * Zusätzlich wird — sofern vorhanden — die DB-Funktion
 * `coachcheck_release_integrity()` (Migration 45) aufgerufen, die serverseitig
 * u. a. die TATSÄCHLICH ausgelieferte Itemzahl je Produkt gegen `item_count`
 * prüft (das kann SQL präziser als TS, weil die Tier-/Spieler-Ausschluss-Logik
 * in der RPC steckt).
 *
 * `ready === true` nur, wenn ALLE Checks ok sind. Die Readiness-API liefert dann
 * 200, sonst 503 mit den fehlgeschlagenen Gründen.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  MODULE_CODES,
  AXES,
  PRODUCT_ITEM_COUNTS,
  MIN_ARCHETYPES,
  RELEASE_SCHEMA_VERSION,
  SCORING_VERSION,
  ITEMPOOL_VERSION,
  contractSelfConsistent,
  checkItemsAgainstContract,
} from '@/lib/release/contract';

export type ReadinessCheck = {
  id: string;
  ok: boolean;
  detail: string;
};

export type ReadinessReport = {
  ready: boolean;
  generatedAt: string;
  checks: ReadinessCheck[];
};

export async function evaluateReadiness(admin: SupabaseClient): Promise<ReadinessReport> {
  const checks: ReadinessCheck[] = [];
  const add = (id: string, ok: boolean, detail: string) => checks.push({ id, ok, detail });

  // (0) Vertrag selbst konsistent (7 Module, 6 Achsen).
  add(
    'contract_self_consistent',
    contractSelfConsistent(),
    'Release-Vertrag: 7 Module + 6 Achsen strukturell konsistent.',
  );

  // (1) Items laden (service_role).
  let items: Array<{ id: number; code: string | null; module_code: string | null; format: string; text_de: string | null; options: unknown }> = [];
  try {
    const { data, error } = await admin
      .from('items')
      .select('id, code, module_code, format, text_de, options')
      .eq('active', true);
    if (error) {
      // active existiert evtl. nicht in allen Ständen → ohne Filter erneut.
      const retry = await admin.from('items').select('id, code, module_code, format, text_de, options');
      if (retry.error) {
        add('items_load', false, `Items konnten nicht geladen werden: ${retry.error.message}`);
      } else {
        items = (retry.data ?? []) as typeof items;
      }
    } else {
      items = (data ?? []) as typeof items;
    }
  } catch (e) {
    add('items_load', false, `Items konnten nicht geladen werden: ${String(e)}`);
  }

  if (items.length > 0) {
    // (2) Alle 7 Module vorhanden.
    const presentModules = new Set(items.map((i) => (i.module_code ?? '').toUpperCase()).filter(Boolean));
    const missingModules = MODULE_CODES.filter((c) => !presentModules.has(c));
    add(
      'modules_present',
      missingModules.length === 0,
      missingModules.length === 0
        ? 'Alle sieben Module (A–G) im Itempool vorhanden.'
        : `Fehlende Module im Itempool: ${missingModules.join(', ')}.`,
    );

    // (3) Spannungsfeld-Pole vollständig (keiner leer).
    const polelessIds: number[] = [];
    for (const it of items) {
      if (it.format !== 'spannungsfeld') continue;
      const opt = Array.isArray(it.options) ? (it.options[0] as Record<string, unknown> | undefined) : undefined;
      const left = opt?.left;
      const right = opt?.right;
      const blank = (v: unknown) => typeof v !== 'string' || v.trim().length === 0;
      if (blank(left) || blank(right)) polelessIds.push(it.id);
    }
    add(
      'spannungsfeld_poles',
      polelessIds.length === 0,
      polelessIds.length === 0
        ? 'Alle Spannungsfeld-Items tragen linken und rechten Pol.'
        : `Spannungsfeld-Items ohne vollständige Pole: ${polelessIds.join(', ')}.`,
    );

    // (3b) VOLLSTÄNDIGER Item-Präsentationsvertrag (P0.2): exakt dieselbe Prüfung,
    // die auch die Fragebogen-Seite anwendet — eindeutige IDs/Codes, Fragetext,
    // Modul A–G, unterstütztes Format, vollständige Choice-Optionen + eindeutige
    // Schlüssel, Pole. Ohne diesen Check könnte die Readiness 200 melden, während
    // der bezahlte Kunde danach einen fail-closed gesperrten Fragebogen bekommt.
    const itemContract = checkItemsAgainstContract(
      items.map((it) => ({
        id: Number(it.id),
        code: it.code,
        module_code: it.module_code,
        format: it.format,
        text_de: it.text_de,
        options: Array.isArray(it.options) ? (it.options as Array<{ key?: string; text?: string; left?: string; right?: string }>) : null,
      })),
      null,
    );
    add(
      'full_item_contract',
      itemContract.ok,
      itemContract.ok
        ? 'Vollständiger Item-Präsentationsvertrag erfüllt (IDs, Codes, Texte, Formate, Optionen, Pole).'
        : `Item-Vertragsverletzungen: ${JSON.stringify(itemContract.violations).slice(0, 800)}`,
    );
  }

  // (4) Achsen im Archetypen-Modell + Mindest-Archetypenzahl.
  try {
    const { data: archetypes, error } = await admin
      .from('archetypes')
      .select('code, axis_profile');
    if (error) {
      add('archetypes', false, `Archetypen konnten nicht geladen werden: ${error.message}`);
    } else {
      const list = archetypes ?? [];
      add(
        'archetypes_count',
        list.length >= MIN_ARCHETYPES,
        `${list.length} Archetypen vorhanden (erwartet ≥ ${MIN_ARCHETYPES}).`,
      );
      const axisKeys = AXES.map((a) => a.key);
      const incomplete = list.filter((a) => {
        const prof = (a.axis_profile ?? {}) as Record<string, unknown>;
        return axisKeys.some((k) => typeof prof[k] !== 'number');
      });
      add(
        'axes_in_archetypes',
        incomplete.length === 0,
        incomplete.length === 0
          ? 'Alle sechs Achsen sind in jedem Archetyp-Profil gesetzt.'
          : `Archetypen mit unvollständigem Achsenprofil: ${incomplete.map((a) => a.code).join(', ')}.`,
      );
    }
  } catch (e) {
    add('archetypes', false, `Archetypen-Prüfung fehlgeschlagen: ${String(e)}`);
  }

  // (5) Je Produkt: DB-item_count == Vertrags-Itemzahl.
  try {
    const { data: products, error } = await admin
      .from('products')
      .select('slug, item_count');
    if (error) {
      add('product_item_count', false, `Produkte konnten nicht geladen werden: ${error.message}`);
    } else {
      const mismatches: string[] = [];
      for (const p of products ?? []) {
        const expected = PRODUCT_ITEM_COUNTS[p.slug as string];
        if (expected == null) continue; // nicht gegatete Produkte überspringen
        if (p.item_count !== expected) {
          mismatches.push(`${p.slug}: DB ${p.item_count ?? 'null'} ≠ Vertrag ${expected}`);
        }
      }
      add(
        'product_item_count',
        mismatches.length === 0,
        mismatches.length === 0
          ? 'DB-Itemzahlen stimmen mit dem Vertrag überein.'
          : `Itemzahl-Drift: ${mismatches.join('; ')}.`,
      );
    }
  } catch (e) {
    add('product_item_count', false, `Produkt-Itemzahl-Prüfung fehlgeschlagen: ${String(e)}`);
  }

  // (5b) RELEASE-VERTRAG DER DB (Migration 45/46) live lesen und exakt gegen die
  //      Code-Konstanten prüfen. Damit ist die Readiness fail-CLOSED gegen eine
  //      unvollständig migrierte DB: fehlt die Tabelle/Zeile (vor Migration 45)
  //      oder steht schema_version noch auf 45 (Migration 46 nicht gelaufen),
  //      schlägt der Check fehl — KEIN fälschliches „200 bereit".
  try {
    const { data, error } = await admin
      .from('release_contract')
      .select('schema_version, scoring_version, itempool_version');
    if (error) {
      add('release_contract_version', false, `release_contract nicht lesbar (Migration 45 ausstehend?): ${error.message}`);
    } else {
      const row = Array.isArray(data) ? (data[0] as Record<string, number> | undefined) : undefined;
      if (!row) {
        add('release_contract_version', false, 'release_contract enthält keine Zeile — DB nicht vollständig migriert.');
      } else {
        const mism: string[] = [];
        if (row.schema_version !== RELEASE_SCHEMA_VERSION) mism.push(`schema_version DB ${row.schema_version} ≠ Code ${RELEASE_SCHEMA_VERSION}`);
        if (row.scoring_version !== SCORING_VERSION) mism.push(`scoring_version DB ${row.scoring_version} ≠ Code ${SCORING_VERSION}`);
        if (row.itempool_version !== ITEMPOOL_VERSION) mism.push(`itempool_version DB ${row.itempool_version} ≠ Code ${ITEMPOOL_VERSION}`);
        add(
          'release_contract_version',
          mism.length === 0,
          mism.length === 0
            ? `Release-Vertrag der DB stimmt mit dem Code überein (schema ${RELEASE_SCHEMA_VERSION}, scoring ${SCORING_VERSION}, itempool ${ITEMPOOL_VERSION}).`
            : `Release-Vertrag-Drift: ${mism.join('; ')}. (Sind ALLE Migrationen bis 46 gelaufen?)`,
        );
      }
    }
  } catch (e) {
    add('release_contract_version', false, `release_contract-Prüfung fehlgeschlagen: ${String(e)}`);
  }

  // (6) DB-Integritätsfunktion (Migration 45) — prüft serverseitig u. a. die
  //     ausgelieferte Itemzahl je Produkt. Fail-CLOSED (P0.1): fehlt die Funktion
  //     (Migration 45 nicht aktiv) oder wirft sie, ist die DB NICHT bereit. Ein
  //     RPC-/DB-Fehler darf NIE als ok behandelt werden.
  try {
    const { data, error } = await admin.rpc('coachcheck_release_integrity');
    if (error) {
      add('db_integrity_fn', false, `DB-Integritätsfunktion nicht verfügbar/fehlerhaft (Migration 45 ausstehend?): ${error.message}`);
    } else {
      const result = (data ?? {}) as { ok?: boolean; problems?: string[] };
      add(
        'db_integrity_fn',
        result.ok === true,
        result.ok === true
          ? 'DB-Integritätsfunktion meldet OK (Itemzahl/Module/Pole serverseitig geprüft).'
          : `DB-Integrität: ${(result.problems ?? ['unerwartete Antwort']).join('; ')}`,
      );
    }
  } catch (e) {
    add('db_integrity_fn', false, `DB-Integritätsfunktion nicht aufrufbar: ${String(e)}`);
  }

  const ready = checks.every((c) => c.ok);
  return { ready, generatedAt: new Date().toISOString(), checks };
}
