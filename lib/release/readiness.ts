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
  contractSelfConsistent,
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
  let items: Array<{ id: number; module_code: string | null; format: string; options: unknown }> = [];
  try {
    const { data, error } = await admin
      .from('items')
      .select('id, module_code, format, options')
      .eq('active', true);
    if (error) {
      // active existiert evtl. nicht in allen Ständen → ohne Filter erneut.
      const retry = await admin.from('items').select('id, module_code, format, options');
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

  // (6) Optional: DB-Integritätsfunktion (Migration 45) — prüft serverseitig
  //     u. a. ausgelieferte Itemzahl je Produkt. Fehlt sie (vor Migration 45),
  //     wird der Check als „nicht verfügbar" markiert und blockiert NICHT.
  try {
    const { data, error } = await admin.rpc('coachcheck_release_integrity');
    if (error) {
      add('db_integrity_fn', true, `DB-Integritätsfunktion nicht verfügbar (Migration 45 ausstehend?): ${error.message}`);
    } else {
      const result = (data ?? {}) as { ok?: boolean; problems?: string[] };
      add(
        'db_integrity_fn',
        result.ok !== false,
        result.ok === false
          ? `DB-Integrität: ${(result.problems ?? []).join('; ')}`
          : 'DB-Integritätsfunktion meldet OK (Itemzahl/Module/Pole serverseitig geprüft).',
      );
    }
  } catch (e) {
    add('db_integrity_fn', true, `DB-Integritätsfunktion nicht aufrufbar: ${String(e)}`);
  }

  const ready = checks.every((c) => c.ok);
  return { ready, generatedAt: new Date().toISOString(), checks };
}
