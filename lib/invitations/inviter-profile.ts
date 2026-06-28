import type { SupabaseClient } from '@supabase/supabase-js';

export type InviterProfile = {
  fullName: string | null;
  sport: string | null;
  club: string | null;
};

/**
 * Lädt das Trainer-(Inviter-)Profil zu einer Einladung über ZWEI explizite
 * Lookups statt über einen verschachtelten PostgREST-Embed.
 *
 * Hintergrund (v3.73 — PostgREST-Embed-Bug, an drei Stellen):
 *   `assessments.user_id` referenziert `auth.users(id)`, NICHT `public.profiles`.
 *   Damit existiert keine von PostgREST auflösbare Relation assessments→profiles.
 *   Der frühere Embed
 *     `assessment:parent_assessment_id(profile:user_id(full_name, sport, club))`
 *   ließ sich deshalb nicht auflösen → die Query lieferte `data = null`. Folge:
 *     - Einladungs-Token-Seiten (Fremdbild/TeamCheck) zeigten für GÜLTIGE Token
 *       „nicht gefunden" (Validity bricht, weil `invitation` null wird), und
 *     - der Rater-Reminder-Cron fand 0 Zeilen und verschickte nie eine Mail.
 *
 * Diese Auflösung ist FK-Inferenz-unabhängig und fail-closed: Sie nutzt nur
 * Relationen, die real als Fremdschlüssel existieren
 * (`invitations.parent_assessment_id → assessments.id`, `profiles.id = user_id`),
 * und gibt bei jedem fehlenden Glied sauber `null` zurück, statt zu werfen.
 *
 * MUSS mit dem ADMIN-Client (service_role) aufgerufen werden — die anonymen
 * Token-Seiten und der Cron lesen profiles/assessments RLS-unabhängig.
 */
export async function getInviterProfile(
  admin: SupabaseClient,
  parentAssessmentId: string | null | undefined,
): Promise<InviterProfile | null> {
  if (!parentAssessmentId) return null;

  const { data: assessment } = await admin
    .from('assessments')
    .select('user_id')
    .eq('id', parentAssessmentId)
    .maybeSingle();

  const userId = (assessment as { user_id?: string | null } | null)?.user_id;
  if (!userId) return null;

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, sport, club')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return null;
  const p = profile as {
    full_name?: string | null;
    sport?: string | null;
    club?: string | null;
  };
  return {
    fullName: p.full_name ?? null,
    sport: p.sport ?? null,
    club: p.club ?? null,
  };
}
