import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * ZENTRALE Berechtigungsprüfung für ALLE Einladungswege (Fremdbild + TeamCheck).
 *
 * Hintergrund (v3.42 P0-Blocker 1): Die Einladungs-Routen prüften bisher nur
 * Ownership + Tier. Damit konnte
 *   - ein Käufer im Status 'awaiting_contract_confirmation' (noch nicht
 *     freigeschaltet) bereits Spieler-/Fremdbild-Tokens erzeugen,
 *   - ein erstatteter Kunde weiterhin neue Einladungen anlegen und bestehende
 *     Token-Links (open/answer/complete) nutzen.
 *
 * Diese Funktion ist die EINE Stelle, die ein Assessment vollständig absichert,
 * bevor irgendein Einladungsschritt passiert. Sie MUSS mit dem ADMIN-Client
 * (service_role) aufgerufen werden, damit purchases/products RLS-unabhängig und
 * fälschungssicher gelesen werden.
 *
 * Geprüft wird (alle Bedingungen müssen erfüllt sein):
 *   - Assessment existiert
 *   - Assessment gehört zum erwarteten Nutzer (nur falls ownerUserId gesetzt;
 *     bei anonymen Token-Routen entfällt das)
 *   - Assessment ist AKTIVIERT (nicht 'awaiting_contract_confirmation', nicht
 *     'archived')
 *   - purchase_id existiert
 *   - Purchase gehört zum Assessment-Nutzer
 *   - Purchase-Produkt entspricht Assessment-Produkt
 *   - Purchase.status = 'paid'  (Rückerstattung/Dispute → 'refunded' → gesperrt)
 *   - confirmation_sent_at ist gesetzt (FAGG: Vertragsbestätigung zugestellt)
 */

// Aktiviert = Vertragsbestätigung erfolgt, Assessment nutzbar / fertig.
// Bewusst NICHT enthalten: 'awaiting_contract_confirmation' (gesperrt) und
// 'archived' (z. B. nach Rückerstattung). 'refunded' wird ohnehin über den
// Kaufstatus abgefangen.
const ACTIVATED_ASSESSMENT_STATUSES = ['pending', 'in_progress', 'completed', 'report_ready'];

export type AssessmentEntitlement =
  | {
      ok: true;
      assessment: { id: string; user_id: string; product_id: number; status: string };
      purchaseId: string;
      tier: number;
    }
  | { ok: false; status: number; error: string };

export async function requireActiveAssessmentEntitlement(
  admin: SupabaseClient,
  assessmentId: string,
  opts?: { ownerUserId?: string; minTier?: number },
): Promise<AssessmentEntitlement> {
  if (!assessmentId) {
    return { ok: false, status: 400, error: 'assessment_id erforderlich' };
  }

  const { data: a } = await admin
    .from('assessments')
    .select('id, user_id, product_id, status, purchase_id')
    .eq('id', assessmentId)
    .maybeSingle();

  // 404 (nicht 403), damit fremde Assessment-IDs nicht durch unterschiedliche
  // Fehlercodes erkennbar werden.
  if (!a) return { ok: false, status: 404, error: 'Assessment nicht gefunden' };
  if (opts?.ownerUserId && (a as any).user_id !== opts.ownerUserId) {
    return { ok: false, status: 404, error: 'Assessment nicht gefunden' };
  }

  const status = (a as any).status as string;
  if (!ACTIVATED_ASSESSMENT_STATUSES.includes(status)) {
    if (status === 'awaiting_contract_confirmation') {
      return {
        ok: false,
        status: 409,
        error: 'Assessment ist noch nicht freigeschaltet (Vertragsbestätigung ausstehend).',
      };
    }
    return { ok: false, status: 403, error: 'Assessment ist nicht aktiv.' };
  }

  const purchaseId = (a as any).purchase_id as string | null;
  if (!purchaseId) {
    return { ok: false, status: 403, error: 'Assessment ist keinem gültigen Kauf zugeordnet.' };
  }

  const { data: p } = await admin
    .from('purchases')
    .select('id, user_id, product_id, status, confirmation_sent_at, product:products(tier)')
    .eq('id', purchaseId)
    .maybeSingle();

  if (
    !p ||
    (p as any).user_id !== (a as any).user_id ||
    (p as any).product_id !== (a as any).product_id
  ) {
    return { ok: false, status: 403, error: 'Kauf konnte nicht bestätigt werden.' };
  }
  // Rückerstattung/Dispute setzt status='refunded' → ab hier keine neuen
  // Einladungen und keine Token-Nutzung mehr. 402 signalisiert das Zahlungs-/
  // Berechtigungsproblem klar (vs. 403 "verboten").
  if ((p as any).status !== 'paid') {
    return {
      ok: false,
      status: 402,
      error: 'Der zugehörige Kauf ist nicht (mehr) gültig (z. B. nach Rückerstattung).',
    };
  }
  if (!(p as any).confirmation_sent_at) {
    return { ok: false, status: 409, error: 'Vertragsbestätigung ausstehend.' };
  }

  const tier = ((p as any).product?.tier ?? 0) as number;
  if (opts?.minTier && tier < opts.minTier) {
    return {
      ok: false,
      status: 403,
      error: `Für diesen Schritt ist mindestens Tier ${opts.minTier} erforderlich.`,
    };
  }

  return {
    ok: true,
    assessment: {
      id: (a as any).id,
      user_id: (a as any).user_id,
      product_id: (a as any).product_id,
      status,
    },
    purchaseId,
    tier,
  };
}

/**
 * Helfer für die anonymen Token-Routen (open/answer/complete): nimmt einen
 * Invitation-Token, löst das Eltern-Assessment auf und prüft das Entitlement.
 * Owner-Bindung gibt es hier nicht (anonyme Einschätzer). Liefert zusätzlich
 * die Invitation-Kerndaten für die weitere Verarbeitung.
 */
export type TokenEntitlement =
  | {
      ok: true;
      invitation: {
        id: string;
        status: string;
        expires_at: string;
        invitation_type: string;
        parent_assessment_id: string;
      };
      tier: number;
    }
  | { ok: false; status: number; error: string };

export async function requireActiveInvitationByToken(
  admin: SupabaseClient,
  token: string,
): Promise<TokenEntitlement> {
  const { data: inv } = await admin
    .from('invitations')
    .select('id, status, expires_at, invitation_type, parent_assessment_id')
    .eq('token', token)
    .maybeSingle();

  if (!inv) return { ok: false, status: 404, error: 'Invitation not found' };

  const ent = await requireActiveAssessmentEntitlement(admin, (inv as any).parent_assessment_id);
  if (!ent.ok) {
    // Nach Rückerstattung/Sperre: bestehende Token-Links dürfen nicht mehr
    // funktionieren. Wir geben den Entitlement-Status durch.
    return { ok: false, status: ent.status, error: ent.error };
  }

  return {
    ok: true,
    invitation: {
      id: (inv as any).id,
      status: (inv as any).status,
      expires_at: (inv as any).expires_at,
      invitation_type: (inv as any).invitation_type,
      parent_assessment_id: (inv as any).parent_assessment_id,
    },
    tier: ent.tier,
  };
}
