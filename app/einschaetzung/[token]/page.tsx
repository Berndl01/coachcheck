import { createAdminClient } from '@/lib/supabase/admin';
import { EinschaetzungRunner } from './runner';

export default async function EinschaetzungPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  // Load invitation by token
  const { data: invitation } = await admin
    .from('invitations')
    .select('id, status, expires_at, parent_assessment_id, invitation_type, assessment:parent_assessment_id(profile:user_id(full_name, sport))')
    .eq('token', token)
    .maybeSingle();

  if (!invitation) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-4">
            Einschätzung nicht gefunden
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            Dieser Link ist ungültig.
          </h1>
          <p className="text-muted">
            Der Einladungslink ist nicht (mehr) gültig oder wurde widerrufen. Wende dich an den Trainer, der dir den Link geschickt hat.
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
            ✓ Bereits abgeschlossen
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            Du hast bereits geantwortet.
          </h1>
          <p className="text-muted font-editorial italic text-lg">
            Danke! Deine Einschätzung ist eingegangen und fließt anonym in den Report ein.
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
            Link abgelaufen
          </div>
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">
            Dieser Link ist nicht mehr gültig.
          </h1>
          <p className="text-muted">
            Der Einladungszeitraum von 14 Tagen ist vorbei.
          </p>
        </div>
      </main>
    );
  }

  // Load items via RPC
  const { data: items } = await admin.rpc('get_items_for_invitation', {
    invitation_token: token,
  });

  // Load already submitted answers
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

  return (
    <EinschaetzungRunner
      token={token}
      invitationId={invitation.id}
      items={(items ?? []) as any}
      existingAnswers={existing}
      trainerName={trainerName}
      sport={sport}
    />
  );
}
