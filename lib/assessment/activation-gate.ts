/**
 * Aktivierungssperre für Assessment-APIs.
 *
 * Ein gekauftes Assessment startet als 'awaiting_contract_confirmation' und wird
 * ERST nach erfolgreich zugestellter Vertragsbestätigung über
 * finalize_order_confirmation() auf 'pending' freigeschaltet (FAGG: keine
 * Leistung vor Bereitstellung der Vertragsbestätigung auf dauerhaftem
 * Datenträger).
 *
 * Diese Sperre muss serverseitig in JEDER schreibenden/lesenden Assessment-Route
 * gelten — nicht nur in der UI. Sonst kann ein eingeloggter Käufer die Sperre
 * umgehen, indem er die API direkt aufruft.
 *
 * Aktiv = der Fragebogen darf bearbeitet/abgeschlossen werden:
 *   - 'pending'      → freigeschaltet, noch nicht begonnen
 *   - 'in_progress'  → in Bearbeitung
 * Alles andere (awaiting_contract_confirmation, completed, report_ready,
 * archived, refunded …) ist NICHT aktiv.
 */
export const ACTIVE_ASSESSMENT_STATUSES = ['pending', 'in_progress'] as const;

export function isAssessmentActivated(status: string | null | undefined): boolean {
  return status === 'pending' || status === 'in_progress';
}
