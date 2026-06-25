import { createAdminClient } from '@/lib/supabase/admin';
import { TeamcheckRunner } from './runner';
import { sanitizeItemsForClient } from '@/lib/utils/sanitize-items';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function TeamcheckPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();
  const t = await getT();

  const { data: invitation, error: invitationError } = await admin
    .from('invitations')
    .select('id, status, expires_at, parent_assessment_id, invitation_type')
    .eq('token', token)
    .maybeSingle();

  if (invitationError) {
    // Kein verschachteltes Embed mehr: assessments.user_id und profiles.id zeigen BEIDE
    // nur auf auth.users — es gibt KEINEN direkten FK assessments→profiles. Ein
    // verschachteltes PostgREST-Embed (profile:user_id(...)) ist daher nicht auflösbar
    // und würde die gesamte Abfrage scheitern lassen (data = null). Sollte die reine
    // Einladungsabfrage dennoch fehlschlagen, wird der Fehler protokolliert statt still
    // als „ungültige Einladung" verschluckt.
    console.error('[teamcheck-page] invitation lookup failed', {
      tokenPrefix: token.slice(0, 6),
      code: invitationError.code,
      message: invitationError.message,
    });
  }

  if (!invitation || invitation.invitation_type !== 'spieler') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-4">
            {t('teamcheckPage.invalidKicker')}
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            {t('teamcheckPage.invalidTitle')}
          </h1>
          <p className="text-muted">
            {t('teamcheckPage.invalidText')}
          </p>
        </div>
      </main>
    );
  }

  if (invitation.status === 'completed') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
            {t('teamcheckPage.doneKicker')}
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            {t('teamcheckPage.doneTitle')}
          </h1>
          <p className="text-muted font-editorial italic text-lg">
            {t('teamcheckPage.doneText')}
          </p>
        </div>
      </main>
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            {t('teamcheckPage.expiredTitle')}
          </h1>
          <p className="text-muted">
            {t('teamcheckPage.expiredText')}
          </p>
        </div>
      </main>
    );
  }

  const { data: items } = await admin.rpc('get_items_for_invitation', {
    invitation_token: token,
  });

  // DATENSCHUTZ: keine gespeicherten Einzelantworten über den öffentlichen Token
  // zurückgeben (sonst könnte der Trainer anonyme Antworten mitlesen). Start leer.
  const existing: Record<number, { value_numeric?: number; value_choice?: string; value_position?: number }> = {};

  // Trainerprofil über zwei klare Einzelabfragen laden (kein kaputtes Embed):
  // invitations → assessments.user_id → profiles.id. Das Profil ist nicht
  // rendering-kritisch; fehlt es, bleibt es bei den neutralen Fallbacks unten.
  const { data: tcAssessment } = await admin
    .from('assessments')
    .select('user_id')
    .eq('id', invitation.parent_assessment_id)
    .maybeSingle();

  let trainerProfile: { full_name: string | null; sport: string | null; club: string | null } | null = null;
  if (tcAssessment?.user_id) {
    const { data: prof } = await admin
      .from('profiles')
      .select('full_name, sport, club')
      .eq('id', tcAssessment.user_id)
      .maybeSingle();
    trainerProfile = prof ?? null;
  }

  const trainerName = trainerProfile?.full_name ?? 'der Trainer';
  const sport = trainerProfile?.sport ?? '';
  const club = trainerProfile?.club ?? '';

  return (
    <TeamcheckRunner
      token={token}
      items={sanitizeItemsForClient(items) as any}
      existingAnswers={existing}
      trainerName={trainerName}
      sport={sport}
      club={club}
    />
  );
}
