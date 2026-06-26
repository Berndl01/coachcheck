/**
 * CoachCheck — RELEASE-VERTRAG (Single Source of Truth)
 * =====================================================================
 * Eine zentrale, verbindliche Definition von:
 *   · den sieben Modulen (A–G)
 *   · den sechs Kernachsen (inkl. Pol-Beschriftungen)
 *   · den sechs Entwicklungsindikatoren (vormals „Führungsreife")
 *   · der erwarteten Itemzahl je Produkt-Tier
 *   · der erwarteten Archetypen-Anzahl
 *   · der Scoring-/Itempool-/Schema-Version
 *
 * Vorher waren diese Definitionen über mehrere Dateien dupliziert
 * (item-renderer.tsx, scoring.ts, result/page.tsx, report-document.tsx).
 * Divergenzen waren dadurch möglich. Ab jetzt importieren alle Consumer
 * diese Datei — geändert wird nur HIER.
 *
 * Diese Datei enthält KEINE Scoring-Gewichte und ist daher gefahrlos auch
 * client-importierbar (nur Anzeige-/Struktur-Metadaten).
 */

// ---------------------------------------------------------------------------
// VERSIONEN — Teil jedes eingefrorenen Ergebnis-Snapshots.
// Wird die Skala oder der Itempool geändert, MUSS die jeweilige Version
// erhöht werden, damit alte Snapshots erkennbar einer anderen Logik folgen.
// ---------------------------------------------------------------------------
export const SCHEMA_VERSION = 46; // höchste erwartete Migrationsnummer
export const SCORING_VERSION = '2.0.0'; // lib/scoring.ts Achsen-/Indikatorlogik
export const ITEMPOOL_VERSION = '2025-06-A'; // Pool-Stand nach Migration 25

// ---------------------------------------------------------------------------
// MODULE (A–G) — sieben
// ---------------------------------------------------------------------------
export const MODULE_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
export type ModuleCode = (typeof MODULE_CODES)[number];

export const MODULE_TITLES: Record<ModuleCode, string> = {
  A: 'Führungsidentität',
  B: 'Kommunikationsarchitektur',
  C: 'Entscheidung & Priorität',
  D: 'Fehler- & Lernkultur',
  E: 'Führung unter Druck',
  F: 'Motivation & Aktivierung',
  G: 'Beziehung & Vertrauen',
};

export const MODULE_COUNT = MODULE_CODES.length; // 7

// ---------------------------------------------------------------------------
// KERNACHSEN (6) — inkl. Pol-Beschriftungen (Anzeige).
// AxisKey ist identisch zu lib/scoring.ts; hier liegt die Anzeige-Schicht.
// ---------------------------------------------------------------------------
export const AXIS_KEYS = [
  'struktur_intuition',
  'autoritaet_beteiligung',
  'leistung_beziehung',
  'stabilisierung_aktivierung',
  'reflexion_direktheit',
  'standardisierung_anpassung',
] as const;
export type ContractAxisKey = (typeof AXIS_KEYS)[number];

export const AXIS_POLES: Record<ContractAxisKey, { low: string; high: string }> = {
  struktur_intuition: { low: 'Intuitiv', high: 'Strukturiert' },
  autoritaet_beteiligung: { low: 'Beteiligend', high: 'Autoritär' },
  leistung_beziehung: { low: 'Beziehungsorientiert', high: 'Leistungsorientiert' },
  stabilisierung_aktivierung: { low: 'Stabilisierend', high: 'Aktivierend' },
  reflexion_direktheit: { low: 'Direkt', high: 'Reflektiert' },
  standardisierung_anpassung: { low: 'Anpassend', high: 'Standardisierend' },
};

export const AXIS_COUNT = AXIS_KEYS.length; // 6

// ---------------------------------------------------------------------------
// ENTWICKLUNGSINDIKATOREN (vormals „Führungsreife") — sechs.
// WICHTIG (Seriositäts-Auflage): Diese Werte sind KEINE normierte, empirisch
// validierte Reife-Skala. Sie werden ausdrücklich als Reflexionshinweise
// gekennzeichnet; normierende Wertungen („souverän"/„gefestigt"/„unreif")
// sind im UI/PDF entfernt. Labels bleiben rein beschreibend.
// ---------------------------------------------------------------------------
export const DEVELOPMENT_INDICATOR_KEYS = [
  'selbstregulation',
  'perspektivflexibilitaet',
  'konfliktreife',
  'druckreife',
  'verantwortungsklarheit',
  'integrationsfaehigkeit',
] as const;
export type DevelopmentIndicatorKey = (typeof DEVELOPMENT_INDICATOR_KEYS)[number];

export const DEVELOPMENT_INDICATOR_LABELS: Record<DevelopmentIndicatorKey, string> = {
  selbstregulation: 'Selbstregulation',
  perspektivflexibilitaet: 'Perspektivflexibilität',
  konfliktreife: 'Konfliktreife',
  druckreife: 'Druckreife',
  verantwortungsklarheit: 'Verantwortungsklarheit',
  integrationsfaehigkeit: 'Integrationsfähigkeit',
};

/** Verbindlicher Rahmen-/Reflexionshinweis — überall identisch verwenden. */
export const DEVELOPMENT_INDICATOR_DISCLAIMER =
  'Diese Entwicklungsindikatoren sind Reflexionshinweise, keine normierte Reifemessung. ' +
  'Sie zeigen Tendenzen aus deinen Antworten und sind als Gesprächsanstoß gedacht — nicht als abschließende Bewertung.';

// ---------------------------------------------------------------------------
// ARCHETYPEN
// ---------------------------------------------------------------------------
export const EXPECTED_ARCHETYPE_COUNT = 12;

// ---------------------------------------------------------------------------
// ITEMZAHLEN je Tier (selbst-ausgefüllter Trainer-Fragebogen).
// Stand nach Migration 25 (Tier 2/3: 92 → 103) und Migration 23 (Tier 1: 27).
// Tier 4 zählt nur die Trainer-Items (Spieler-Items sind player_item=true und
// laufen über einen eigenen, anonymen Flow). Tier 5 hat keinen Fragebogen.
//
// Diese Zahlen sind der Vertrag. Liefert die Live-DB für einen Tier eine
// abweichende Itemzahl, ist der Release NICHT freigabefähig.
// ---------------------------------------------------------------------------
export const TIER_ITEM_COUNTS: Record<number, number | null> = {
  1: 27,
  2: 103,
  3: 103,
  4: 77,
  5: null,
};

export function expectedItemCountForTier(tier: number): number | null {
  return tier in TIER_ITEM_COUNTS ? TIER_ITEM_COUNTS[tier] : null;
}

// ---------------------------------------------------------------------------
// ITEM-VERTRAGSPRÜFUNG (Fail-Closed-Gate)
// =====================================================================
// Wird VOR Anzeige eines Fragebogens aufgerufen. Stellt sicher, dass der
// gelieferte Itemsatz dem Release-Vertrag entspricht. Schlägt eine Bedingung
// fehl, darf der Fragebogen NICHT geöffnet werden — die App zeigt einen
// neutralen technischen Fehlerzustand statt Ersatztexten („Pol A"/„Pol B").
// ---------------------------------------------------------------------------

/** Anzeige-Item, wie es nach sanitizeItemsForClient an die Prüfung geht. */
export type ContractItem = {
  id: number;
  code: string;
  module_code: string;
  format: string;
  text_de: string;
  options: Array<{ key?: string; text?: string; left?: string; right?: string }> | null;
};

export type ContractProblem = {
  kind:
    | 'empty'
    | 'count_mismatch'
    | 'unknown_format'
    | 'missing_text'
    | 'spannungsfeld_missing_pole'
    | 'module_missing'
    | 'choice_missing_options';
  detail: string;
  itemCode?: string;
};

export type ContractCheckResult = {
  ok: boolean;
  problems: ContractProblem[];
  expectedCount: number | null;
  actualCount: number;
};

const KNOWN_FORMATS = new Set([
  'likert_5',
  'likert_7',
  'forced_choice',
  'szenario',
  'dilemma',
  'spannungsfeld',
  'gap_wichtig',
  'gap_gelebt',
  'ranking',
  'state',
]);

const CHOICE_FORMATS = new Set(['forced_choice', 'szenario', 'dilemma', 'ranking']);

/**
 * Prüft einen geladenen Itemsatz gegen den Release-Vertrag.
 *
 * @param items   Anzeige-Items (bereits sanitized — left/right vorhanden).
 * @param tier    Produkt-Tier (1..5) zur Itemzahl-Prüfung. null = keine Zahlprüfung.
 * @param opts    requireAllModules: ob ALLE sieben Module vertreten sein müssen
 *                (true für den vollen Selbst-Fragebogen; bei Teilflows wie
 *                einzelnen Token-Bögen ggf. false).
 */
export function validateItemContract(
  items: ContractItem[],
  tier: number | null,
  opts: { requireAllModules?: boolean } = {},
): ContractCheckResult {
  const problems: ContractProblem[] = [];
  const expectedCount = tier != null ? expectedItemCountForTier(tier) : null;
  const actualCount = items.length;

  if (actualCount === 0) {
    problems.push({ kind: 'empty', detail: 'Es wurden keine Items geliefert.' });
    return { ok: false, problems, expectedCount, actualCount };
  }

  if (expectedCount != null && actualCount !== expectedCount) {
    problems.push({
      kind: 'count_mismatch',
      detail: `Erwartet ${expectedCount} Items für Tier ${tier}, geliefert ${actualCount}.`,
    });
  }

  const seenModules = new Set<string>();

  for (const it of items) {
    if (it.module_code) seenModules.add(it.module_code);

    if (!KNOWN_FORMATS.has(it.format)) {
      problems.push({ kind: 'unknown_format', detail: `Unbekanntes Format „${it.format}".`, itemCode: it.code });
      continue;
    }

    if (!it.text_de || it.text_de.trim().length === 0) {
      problems.push({ kind: 'missing_text', detail: 'Item ohne Fragetext.', itemCode: it.code });
    }

    if (it.format === 'spannungsfeld') {
      const pole = Array.isArray(it.options) ? it.options[0] : null;
      const left = pole?.left;
      const right = pole?.right;
      if (!left || !right || String(left).trim() === '' || String(right).trim() === '') {
        problems.push({
          kind: 'spannungsfeld_missing_pole',
          detail: 'Spannungsfeld ohne linken oder rechten Pol.',
          itemCode: it.code,
        });
      }
    }

    if (CHOICE_FORMATS.has(it.format)) {
      const opts2 = Array.isArray(it.options) ? it.options : [];
      const usable = opts2.filter((o) => o.key && o.text && String(o.text).trim() !== '');
      if (usable.length < 2) {
        problems.push({
          kind: 'choice_missing_options',
          detail: 'Auswahl-Item mit weniger als zwei gültigen Optionen.',
          itemCode: it.code,
        });
      }
    }
  }

  if (opts.requireAllModules) {
    for (const code of MODULE_CODES) {
      if (!seenModules.has(code)) {
        problems.push({ kind: 'module_missing', detail: `Modul ${code} (${MODULE_TITLES[code]}) fehlt im Itemsatz.` });
      }
    }
  }

  return { ok: problems.length === 0, problems, expectedCount, actualCount };
}
