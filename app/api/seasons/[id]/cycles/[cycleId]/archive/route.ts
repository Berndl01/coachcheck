import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSeasonEntitlement } from '@/lib/season/entitlement';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/seasons/[id]/cycles/[cycleId]/archive
 *
 * Beendet einen offenen Pulse-Cycle OHNE Auswertung (kein Snapshot). Das ist die
 * bewusste Alternative zum normalen Schließen, wenn weniger als 5 Antworten
 * vorliegen und der Trainer die Runde trotzdem abschließen will. Es entsteht
 * KEIN Snapshot und keine Trendauswertung — die Anonymitätsschwelle bleibt
 * gewahrt.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; cycleId: string }> }
) {
  const { id: seasonId, cycleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const ent = await requireSeasonEntitlement(admin, seasonId, { ownerUserId: user.id });
  if (!ent.ok) return NextResponse.json({ error: ent.error }, { status: ent.status });

  const { data: cycle } = await admin
    .from('pulse_cycles')
    .select('id, season_id, status')
    .eq('id', cycleId)
    .maybeSingle();
  if (!cycle || cycle.season_id !== seasonId) {
    return NextResponse.json({ error: 'Zyklus nicht gefunden' }, { status: 404 });
  }
  if (cycle.status !== 'open') {
    return NextResponse.json(
      { error: 'Dieser Pulse-Cycle ist nicht (mehr) offen.' },
      { status: 409 },
    );
  }

  // Status auf 'archived' setzen, KEIN Snapshot. status='open'-Bedingung schützt
  // gegen Races mit der Close-Route.
  const { error: updErr } = await admin
    .from('pulse_cycles')
    .update({ status: 'archived', closed_at: new Date().toISOString() })
    .eq('id', cycleId)
    .eq('status', 'open');

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, archived: true });
}
