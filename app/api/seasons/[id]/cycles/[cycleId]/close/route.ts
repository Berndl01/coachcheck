import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cycleId: string }> }
) {
  const { id: seasonId, cycleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Validate ownership
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('id', seasonId)
    .eq('user_id', user.id)
    .single();
  if (!season) return NextResponse.json({ error: 'Saison nicht gefunden' }, { status: 404 });

  const admin = createAdminClient();

  // Compute snapshot
  const { data: snapshotResult, error: snapErr } = await admin.rpc('compute_pulse_snapshot', {
    cycle_uuid: cycleId,
  });
  if (snapErr) return NextResponse.json({ error: snapErr.message }, { status: 500 });

  const snapshot = snapshotResult as any;
  const responseCount = snapshot?.response_count ?? 0;

  // Update cycle: set snapshot, mark closed
  const { error: updErr } = await admin
    .from('pulse_cycles')
    .update({
      snapshot,
      response_count: responseCount,
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
    .eq('id', cycleId);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Detect trends
  const { data: trends } = await admin.rpc('detect_pulse_trends', {
    season_uuid: seasonId,
    cycle_uuid: cycleId,
  });

  return NextResponse.json({ ok: true, snapshot, trends, responseCount });
}
