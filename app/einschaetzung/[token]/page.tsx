import { createAdminClient } from '@/lib/supabase/admin';
import { EinschaetzungRunner } from './runner';
import { sanitizeItemsForClient } from '@/lib/utils/sanitize-items';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function EinschaetzungPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ unsubscribe?: string }>;
}) {
  const { token } = await params;
  const { unsubscribe } = await searchParams;
  const admin = createAdminClient();
  const t = await getT();

  // Load invitation by token
  const { data: invitation, error: invitationError } = await admin
    .from('invitations')
    .select('id, status, expires_at, parent_assessment_id, invitation_type, unsubscribed_at')
    .eq('token', token)
    .maybeSingle();

  if (invitationError) {
    // Kein verschachteltes Embed mehr: assessments.user_id und profiles.id zeigen BEIDE
    // nur auf auth.users — KEIN direkter FK assessments→profiles. profile:user_id(...)
    // ist daher nicht auflösbar und hätte die ganze Abfrage scheitern lassen.
    console.error('[einschaetzung-page] invitation lookup failed', {
      tokenPrefix: token.slice(0, 6),
      code: invitationError.code,
      message: invitationError.message,
    });
  }

  if (!invitation) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-4">
            {t('einschaetzungPage.notFoundKicker')}
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            {t('einschaetzungPage.notFoundTitle')}
          </h1>
          <p className="text-muted">
            {t('einschaetzungPage.notFoundText')}
          </p>
        </div>
      </main>
    );
  }

  // Abmeldung (One-Click-Unsubscribe-Header / sichtbarer Link). Vorrangig vor
  // allen anderen Zuständen. Idempotent: erneuter Aufruf zeigt dieselbe Bestätigung.
  if (unsubscribe === '1' || invitation.unsubscribed_at) {
    if (!invitation.unsubscribed_at) {
      await admin
        .from('invitations')
        .update({ unsubscribed_at: new Date().toISOString(), status: 'expired' })
        .eq('id', invitation.id);
    }
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-4">
            {t('einschaetzungPage.unsubKicker')}
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            {t('einschaetzungPage.unsubTitle')}
          </h1>
          <p className="text-muted">
            {t('einschaetzungPage.unsubText')}
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
            {t('einschaetzungPage.doneKicker')}
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            {t('einschaetzungPage.doneTitle')}
          </h1>
          <p className="text-muted font-editorial italic text-lg">
            {t('einschaetzungPage.doneText')}
          </p>
        </div>
      </main>
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-4">
            {t('einschaetzungPage.expiredKicker')}
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            {t('einschaetzungPage.expiredTitle')}
          </h1>
          <p className="text-muted">
            {t('einschaetzungPage.expiredText')}
          </p>
        </div>
      </main>
    );
  }

  // Load items via RPC
  const { data: items } = await admin.rpc('get_items_for_invitation', {
    invitation_token: token,
  });

  // DATENSCHUTZ: Der öffentliche Einladungstoken darf NIEMALS bereits gespeicherte
  // Einzelantworten zurückgeben — sonst könnte der Trainer (der den Token verteilt)
  // die anonymen Antworten der Teilnehmer mitlesen. Der Fragebogen startet leer.
  const existing: Record<number, { value_numeric?: number; value_choice?: string; value_position?: number }> = {};

  // Trainerprofil über zwei klare Einzelabfragen (kein kaputtes Embed):
  // invitations → assessments.user_id → profiles.id.
  const { data: esAssessment } = await admin
    .from('assessments')
    .select('user_id')
    .eq('id', invitation.parent_assessment_id)
    .maybeSingle();

  let trainerProfile: { full_name: string | null; sport: string | null } | null = null;
  if (esAssessment?.user_id) {
    const { data: prof } = await admin
      .from('profiles')
      .select('full_name, sport')
      .eq('id', esAssessment.user_id)
      .maybeSingle();
    trainerProfile = prof ?? null;
  }

  const trainerName = trainerProfile?.full_name ?? 'der Trainer';
  const sport = trainerProfile?.sport ?? '';

  return (
    <EinschaetzungRunner
      token={token}
      items={sanitizeItemsForClient(items) as any}
      existingAnswers={existing}
      trainerName={trainerName}
      sport={sport}
    />
  );
}
