/**
 * Pure, testbare Gültigkeitsprüfung einer einzelnen Antwortzeile gegen das
 * Format ihres Items. Bewusst FAIL-CLOSED: fehlende Options-Daten bei
 * Auswahlformaten machen die Antwort UNGÜLTIG (nicht „alles erlaubt").
 *
 * Wird von der Finalize-Route benutzt; als eigenständige Funktion ausgelagert,
 * damit das Verhalten direkt unit-getestet werden kann.
 */

export const NUMERIC_FORMATS = new Set(['likert_5', 'state', 'gap_wichtig', 'gap_gelebt']);
export const POSITION_FORMATS = new Set(['spannungsfeld']);
export const CHOICE_FORMATS = new Set(['forced_choice', 'szenario', 'dilemma', 'ranking']);

export type AnswerRow = {
  value_numeric?: number | null;
  value_choice?: string | null;
  value_position?: number | null;
  item?: { options?: unknown } | null;
};

export function isValidAnswerValue(format: string, row: AnswerRow | null | undefined): boolean {
  if (!row) return false;

  if (NUMERIC_FORMATS.has(format)) {
    return Number.isInteger(row.value_numeric) && (row.value_numeric as number) >= 1 && (row.value_numeric as number) <= 5;
  }

  if (POSITION_FORMATS.has(format)) {
    return typeof row.value_position === 'number' && row.value_position >= 0 && row.value_position <= 1;
  }

  if (CHOICE_FORMATS.has(format)) {
    if (typeof row.value_choice !== 'string' || row.value_choice.length === 0) return false;
    const opts = Array.isArray(row.item?.options) ? (row.item!.options as Array<{ key?: unknown }>) : [];
    // (P0.5) FAIL-CLOSED: ohne gültige Optionen ist keine Choice-Antwort gültig.
    if (opts.length === 0) return false;
    const keys = new Set(
      opts
        .map((o) => o?.key)
        .filter((k): k is string => typeof k === 'string' && k.length > 0),
    );
    return keys.has(row.value_choice);
  }

  return false;
}
