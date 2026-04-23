import { createAdminClient } from '@/lib/supabase/admin';
import { PulseRunner } from './runner';

export default async function PulsePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  // Look up token → season → active cycle
  const { data: invitation } = await admin
    .from('pulse_invitations')
    .select('id, status, season:season_id(id, name, status, user_id)')
    .eq('token', token)
    .maybeSingle();

  if (!invitation || invitation.status !== 'active' || !(invitation.season as any)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">Link ungültig</h1>
          <p className="text-muted">Wende dich an deinen Trainer.</p>
        </div>
      </main>
    );
  }

  const season = invitation.season as any;
  if (season.status !== 'active') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">Saison pausiert</h1>
          <p className="text-muted">Aktuell läuft kein Pulse-Check.</p>
        </div>
      </main>
    );
  }

  // Find the active (open) cycle for this season
  const { data: openCycle } = await admin
    .from('pulse_cycles')
    .select('id, cycle_number, closes_at')
    .eq('season_id', season.id)
    .eq('status', 'open')
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!openCycle) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">Kein offener Pulse-Check</h1>
          <p className="text-muted">Schau später nochmal vorbei.</p>
        </div>
      </main>
    );
  }

  if (new Date(openCycle.closes_at) < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">Pulse-Check abgelaufen</h1>
          <p className="text-muted">Der nächste Pulse-Check startet in Kürze.</p>
        </div>
      </main>
    );
  }

  // Load pulse items
  const { data: items } = await admin
    .from('pulse_items')
    .select('id, code, dimension, text_de, reverse_scored')
    .eq('active', true)
    .order('id', { ascending: true });

  // Check if this token has already responded for this cycle
  const { data: existingResponses } = await admin
    .from('pulse_responses')
    .select('pulse_item_id, value_numeric')
    .eq('pulse_cycle_id', openCycle.id)
    .eq('respondent_token', token);

  const existing: Record<number, number> = {};
  (existingResponses ?? []).forEach((r: any) => {
    existing[r.pulse_item_id] = r.value_numeric;
  });

  return (
    <PulseRunner
      token={token}
      cycleId={openCycle.id}
      cycleNumber={openCycle.cycle_number}
      items={(items ?? []) as any}
      existingResponses={existing}
      seasonName={season.name}
    />
  );
}
