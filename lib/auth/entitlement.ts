import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Ergebnis der Entitlement-Prüfung.
 */
export type EntitlementResult =
  | { ok: true; purchaseId: string }
  | { ok: false; reason: 'no_purchase' | 'not_paid' | 'mismatch' };

/**
 * Serverseitige Berechtigungsprüfung (P0): Ist ein Assessment durch eine
 * gültige, BEZAHLTE Purchase DESSELBEN Nutzers gedeckt?
 *
 * MUSS mit einem Admin-(service_role)-Client aufgerufen werden — purchases sind
 * vom Browser nicht fälschbar (nur SELECT-Policy), und ab Migration 27 kann der
 * Browser auch keine assessments mehr anlegen/ändern. Diese Prüfung ist die
 * dritte Verteidigungsschicht direkt vor jedem kostenpflichtigen Schritt
 * (KI-/PDF-Generierung).
 *
 * Status 'refunded' gilt NICHT als berechtigt → nach Rückerstattung wird kein
 * neuer Premium-Report mehr erzeugt.
 */
export async function checkPaidEntitlement(
  admin: SupabaseClient,
  assessmentId: string,
  userId: string,
): Promise<EntitlementResult> {
  const { data: a } = await admin
    .from('assessments')
    .select('id, user_id, product_id, purchase_id')
    .eq('id', assessmentId)
    .maybeSingle();

  if (!a || a.user_id !== userId) return { ok: false, reason: 'mismatch' };
  if (!a.purchase_id) return { ok: false, reason: 'no_purchase' };

  const { data: p } = await admin
    .from('purchases')
    .select('id, user_id, product_id, status')
    .eq('id', a.purchase_id)
    .maybeSingle();

  if (!p || p.user_id !== userId || p.product_id !== a.product_id) {
    return { ok: false, reason: 'mismatch' };
  }
  if (p.status !== 'paid') return { ok: false, reason: 'not_paid' };

  return { ok: true, purchaseId: p.id };
}
