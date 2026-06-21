/**
 * RELEASE-VERTRAG — die EINE zentrale Wahrheit über das Modell.
 *
 * Bisher lagen Modul-/Achsen-Definitionen verstreut (scoring.ts, result-Seite,
 * PDF, Wörterbuch, Landing) und die Itemzahlen nur in der DB. Diese Datei macht
 * den „Release-Vertrag" explizit und maschinenlesbar:
 *
 *   - die sieben analytischen Module (A–G) inkl. Pol-Paaren,
 *   - die sechs Kernachsen inkl. Pol-Paaren,
 *   - die exakte beworbene Itemzahl je Produkt,
 *   - Scoring- und Itempool-Version (für unveränderbare Snapshots),
 *   - die Mindest-Archetypenzahl.
 *
 * Zweck (verbindliche Release-Bedingung): die App darf KEINEN Fragebogen öffnen
 * und KEIN Ergebnis ausliefern, wenn der real ausgelieferte Itempool diesem
 * Vertrag widerspricht (fehlende Frage, falsche Itemzahl, fehlender Pol,
 * fehlendes Modul, unvollständige Archetypen). Statt „Pol A/Pol B" + Weiterklick
 * MUSS sie dann geschlossen mit einem neutralen technischen Fehlerzustand
 * abbrechen.
 *
 * Die Achsen-Schlüssel und Pol-Labels spiegeln bewusst exakt scoring.ts /
 * result-Seite — Abweichungen werden durch Tests festgenagelt.
 */

import { AXIS_KEYS, type AxisKey } from '@/lib/scoring';

// ---------------------------------------------------------------------------
// Versionen — werden in den unveränderbaren Ergebnis-Snapshot gestempelt.
// Beim ÄNDERN von Item-Gewichten / Scoring-Algorithmus HOCHZÄHLEN, damit alte
// Assessments identifizierbar bleiben und nie mit neuen Gewichten neu gerechnet
// werden (siehe Migration 46 + finalize).
// ---------------------------------------------------------------------------
export const SCORING_VERSION = 1;
/** Korrespondiert mit der jüngsten Item-Pool-Migration (25 → 103 Items). */
export const ITEMPOOL_VERSION = 25;

export const RELEASE_SCHEMA_VERSION = 46;

// ---------------------------------------------------------------------------
// Die sieben analytischen Module (A–G).
// Pol-Paare aus den vom Eigentümer in v3.66 festgelegten Modul-Beschreibungen.
// ---------------------------------------------------------------------------
export type ModuleCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export type ModuleDef = {
  code: ModuleCode;
  name_de: string;
  poleLeft: string;
  poleRight: string;
};

export const MODULES: ModuleDef[] = [
  { code: 'A', name_de: 'Führungsidentität',        poleLeft: 'Diffus',      poleRight: 'Konturiert' },
  { code: 'B', name_de: 'Kommunikationsarchitektur', poleLeft: 'Sendend',     poleRight: 'Dialogisch' },
  { code: 'C', name_de: 'Entscheidung & Priorität',  poleLeft: 'Abwägend',    poleRight: 'Entschlossen' },
  { code: 'D', name_de: 'Fehler- & Lernkultur',      poleLeft: 'Bedrohung',   poleRight: 'Lernchance' },
  { code: 'E', name_de: 'Führung unter Druck',       poleLeft: 'Kontrolle',   poleRight: 'Gelassenheit' },
  { code: 'F', name_de: 'Motivation & Aktivierung',  poleLeft: 'Fordernd',    poleRight: 'Ermutigend' },
  { code: 'G', name_de: 'Beziehung & Vertrauen',     poleLeft: 'Distanziert', poleRight: 'Verbunden' },
];

export const MODULE_CODES: ModuleCode[] = MODULES.map((m) => m.code);

// ---------------------------------------------------------------------------
// Die sechs Kernachsen inkl. Pol-Paaren (spiegelt scoring.ts buildSignature).
// ---------------------------------------------------------------------------
export type AxisDef = {
  key: AxisKey;
  poleLow: string;
  poleHigh: string;
};

export const AXES: AxisDef[] = [
  { key: 'struktur_intuition',          poleLow: 'Intuitiv',             poleHigh: 'Strukturiert' },
  { key: 'autoritaet_beteiligung',      poleLow: 'Beteiligend',          poleHigh: 'Autoritär' },
  { key: 'leistung_beziehung',          poleLow: 'Beziehungsorientiert', poleHigh: 'Leistungsorientiert' },
  { key: 'stabilisierung_aktivierung',  poleLow: 'Stabilisierend',       poleHigh: 'Aktivierend' },
  { key: 'reflexion_direktheit',        poleLow: 'Direkt',               poleHigh: 'Reflektiert' },
  { key: 'standardisierung_anpassung',  poleLow: 'Anpassend',            poleHigh: 'Standardisierend' },
];

/** Mindestanzahl vollständiger Archetypen (12er-Modell). */
export const MIN_ARCHETYPES = 12;

// ---------------------------------------------------------------------------
// Exakte beworbene Itemzahl je Produkt (Stand der jüngsten Item-Migrationen).
// `null` = Produkt hat keinen Self-Service-Fragebogen dieser Art (Saison/Beratung).
// Diese Zahlen sind der Soll-Wert, gegen den Readiness die DB-`item_count`
// und die real ausgelieferte Itemzahl prüft (Advertised = Delivered).
// ---------------------------------------------------------------------------
export const PRODUCT_ITEM_COUNTS: Record<string, number | null> = {
  schnelltest: 27,
  selbsttest: 103,
  spiegel_360: 103,
  teamcheck: 77, // 77 Coach-Items (Spieler-Items zählen separat)
  saison_beratung: null,
  saison: null,
};

/** Itemzahl laut Vertrag für einen Produkt-Slug (oder null wenn nicht gegated). */
export function expectedItemCountForSlug(slug: string | null | undefined): number | null {
  if (!slug) return null;
  return PRODUCT_ITEM_COUNTS[slug] ?? null;
}

// ---------------------------------------------------------------------------
// Item-Vertragsprüfung VOR Anzeige des Fragebogens.
// ---------------------------------------------------------------------------

/** Minimal-Form einer (bereits client-sanitisierten) Frage für die Prüfung. */
export type ContractItem = {
  id: number;
  format: string;
  module_code?: string | null;
  options?: Array<{ key?: string; text?: string; left?: string; right?: string }> | null;
};

export type ContractViolation =
  | { kind: 'empty_pool' }
  | { kind: 'item_count'; expected: number; actual: number }
  | { kind: 'missing_pole'; itemId: number }
  | { kind: 'placeholder_pole'; itemId: number; value: string };

export type ContractCheck =
  | { ok: true; itemCount: number }
  | { ok: false; violations: ContractViolation[] };

/** Ein Platzhalter-Pol wie „Pol A"/„Pol B"/„Pol links" darf NIE live gehen. */
const PLACEHOLDER_POLE = /^\s*(pol\s*[ab]|pol\s*(links|rechts|left|right)|left|right|tbd|todo|n\/?a|—|-)\s*$/i;

function isBlank(v: unknown): boolean {
  return typeof v !== 'string' || v.trim().length === 0;
}

/**
 * Prüft die real geladenen Items gegen den Release-Vertrag des Produkts.
 *
 *  1. Pool nicht leer.
 *  2. Itemzahl == erwartete Itemzahl (sofern der Slug gegated ist). `expectedCount`
 *     wird vom Aufrufer übergeben — bevorzugt die DB-`product.item_count`
 *     (Laufzeit-Wahrheit „Advertised"); Drift gegen den Vertragskonstanten-Wert
 *     fängt zusätzlich die Readiness-Prüfung ab.
 *  3. Jedes Spannungsfeld-Item hat einen NICHT-leeren linken UND rechten Pol.
 *  4. Kein Pol ist ein Platzhalter („Pol A"/„Pol B"/…).
 *
 * Schlägt irgendetwas an → ok:false. Der Aufrufer MUSS dann geschlossen
 * fehlschlagen (neutraler technischer Fehlerzustand), nicht weiterklicken lassen.
 */
export function checkItemsAgainstContract(
  items: ContractItem[],
  expectedCount: number | null,
): ContractCheck {
  const violations: ContractViolation[] = [];

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, violations: [{ kind: 'empty_pool' }] };
  }

  if (expectedCount != null && items.length !== expectedCount) {
    violations.push({ kind: 'item_count', expected: expectedCount, actual: items.length });
  }

  for (const it of items) {
    if (it.format !== 'spannungsfeld') continue;
    const opt = Array.isArray(it.options) ? it.options[0] : null;
    const left = opt?.left;
    const right = opt?.right;
    if (isBlank(left) || isBlank(right)) {
      violations.push({ kind: 'missing_pole', itemId: it.id });
      continue;
    }
    if (PLACEHOLDER_POLE.test(left as string)) {
      violations.push({ kind: 'placeholder_pole', itemId: it.id, value: left as string });
    }
    if (PLACEHOLDER_POLE.test(right as string)) {
      violations.push({ kind: 'placeholder_pole', itemId: it.id, value: right as string });
    }
  }

  if (violations.length > 0) return { ok: false, violations };
  return { ok: true, itemCount: items.length };
}

/** Sanity-Selbsttest des Vertrags selbst (in Tests + Readiness genutzt). */
export function contractSelfConsistent(): boolean {
  return (
    MODULES.length === 7 &&
    MODULE_CODES.length === 7 &&
    AXES.length === 6 &&
    AXES.every((a) => AXIS_KEYS.includes(a.key)) &&
    AXIS_KEYS.every((k) => AXES.some((a) => a.key === k))
  );
}
