import { createAdminClient } from '@/lib/supabase/admin';
import { TeamcheckRunner } from './runner';

export default async function TeamcheckPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invitation } = await admin
    .from('invitations')
    .select('id, status, expires_at, parent_assessment_id, invitation_type, assessment:parent_assessment_id(profile:user_id(full_name, sport, club))')
    .eq('token', token)
    .maybeSingle();

  if (!invitation || invitation.invitation_type !== 'spieler') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-4">
            Ungültiger Link
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            Diese Einladung ist ungültig.
          </h1>
          <p className="text-muted">
            Wende dich an deinen Trainer.
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
            ✓ Bereits abgegeben
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            Du hast schon geantwortet.
          </h1>
          <p className="text-muted font-editorial italic text-lg">
            Danke! Deine anonyme Einschätzung ist eingegangen.
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
            Link abgelaufen
          </h1>
          <p className="text-muted">
            Der Einladungszeitraum ist vorbei.
          </p>
        </div>
      </main>
    );
  }

  const { data: items } = await admin.rpc('get_items_for_invitation', {
    invitation_token: token,
  });

  const { data: existingAnswers } = await admin
    .from('invitation_answers')
    .select('item_id, value_numeric, value_choice, value_position')
    .eq('invitation_id', invitation.id);

  const existing: Record<number, { value_numeric?: number; value_choice?: string; value_position?: number }> = {};
  (existingAnswers ?? []).forEach((a: any) => {
    existing[a.item_id] = {
      value_numeric: a.value_numeric ?? undefined,
      value_choice: a.value_choice ?? undefined,
      value_position: a.value_position ?? undefined,
    };
  });

  const trainerProfile = (invitation.assessment as any)?.profile;
  const trainerName = trainerProfile?.full_name ?? 'der Trainer';
  const sport = trainerProfile?.sport ?? '';
  const club = trainerProfile?.club ?? '';

  return (
    <TeamcheckRunner
      token={token}
      invitationId={invitation.id}
      items={(items ?? []) as any}
      existingAnswers={existing}
      trainerName={trainerName}
      sport={sport}
      club={club}
    />
  );
}
