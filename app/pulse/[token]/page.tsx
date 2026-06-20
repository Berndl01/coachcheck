import { createAdminClient } from '@/lib/supabase/admin';
import { PulseRunner } from './runner';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PulsePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();
  const t = await getT();

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
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">{t('pulsePage.invalidTitle')}</h1>
          <p className="text-muted">{t('pulsePage.invalidText')}</p>
        </div>
      </main>
    );
  }

  const season = invitation.season as any;
  if (season.status !== 'active') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">{t('pulsePage.pausedTitle')}</h1>
          <p className="text-muted">{t('pulsePage.pausedText')}</p>
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
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">{t('pulsePage.noOpenTitle')}</h1>
          <p className="text-muted">{t('pulsePage.noOpenText')}</p>
        </div>
      </main>
    );
  }

  if (new Date(openCycle.closes_at) < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl tracking-[-0.02em] mb-3">{t('pulsePage.expiredTitle')}</h1>
          <p className="text-muted">{t('pulsePage.expiredText')}</p>
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

  // DATENSCHUTZ: keine gespeicherten Einzelantworten über den Token zurückgeben.
  // Pulse-Antworten werden ohnehin gemeinsam abgeschickt; ein Vorbefüllen ist nicht
  // nötig und würde dem Trainer das Mitlesen anonymer Antworten ermöglichen.
  const existing: Record<number, number> = {};

  return (
    <PulseRunner
      token={token}
      cycleNumber={openCycle.cycle_number}
      items={(items ?? []) as any}
      existingResponses={existing}
      seasonName={season.name}
    />
  );
}
