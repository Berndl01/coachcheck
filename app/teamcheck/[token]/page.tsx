import { createAdminClient } from '@/lib/supabase/admin';
import { TeamcheckRunner } from './runner';
import { sanitizeItemsForClient } from '@/lib/utils/sanitize-items';
import { getInviterProfile } from '@/lib/invitations/inviter-profile';
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

  const { data: invitation } = await admin
    .from('invitations')
    .select('id, status, expires_at, parent_assessment_id, invitation_type')
    .eq('token', token)
    .maybeSingle();

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

  const inviter = await getInviterProfile(admin, invitation.parent_assessment_id);
  const trainerName = inviter?.fullName ?? 'der Trainer';
  const sport = inviter?.sport ?? '';
  const club = inviter?.club ?? '';

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
