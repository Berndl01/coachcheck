import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateCareSignals, type CareResponse } from '@/lib/safety/care-triggers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

  // Cycle muss zur Saison gehören (kein Cross-Season-Close über fremde cycleId)
  const { data: cycle } = await admin
    .from('pulse_cycles')
    .select('id, season_id')
    .eq('id', cycleId)
    .maybeSingle();
  if (!cycle || cycle.season_id !== seasonId) {
    return NextResponse.json({ error: 'Zyklus nicht gefunden' }, { status: 404 });
  }

  // Compute snapshot
  const { data: snapshotResult, error: snapErr } = await admin.rpc('compute_pulse_snapshot', {
    cycle_uuid: cycleId,
  });
  if (snapErr) return NextResponse.json({ error: snapErr.message }, { status: 500 });

  const snapshot = (snapshotResult as any) ?? {};
  const responseCount = snapshot?.response_count ?? 0;

  // Achtsamkeits-Hinweise (Know-how-Transfer Humatrix 2026-06):
  // anonym aggregiert, wertabhängig, strenge Schwellen — siehe lib/safety/care-triggers.ts.
  // Fehler hier dürfen das Schließen des Zyklus NIE blockieren (best effort).
  try {
    const { data: raw } = await admin
      .from('pulse_responses')
      .select('value_numeric, respondent_token, pulse_item:pulse_items(code)')
      .eq('pulse_cycle_id', cycleId);

    const careResponses: CareResponse[] = (raw ?? [])
      .map((r: any) => ({
        code: r.pulse_item?.code as string | undefined,
        value: Number(r.value_numeric),
        respondent: String(r.respondent_token ?? ''),
      }))
      .filter((r): r is CareResponse => typeof r.code === 'string' && r.respondent.length > 0);

    const careHints = evaluateCareSignals(careResponses);
    if (careHints.length > 0) {
      snapshot.care_hints = careHints.map((h) => ({ topic: h.topic, text: h.text }));
    }
  } catch {
    // bewusst verschluckt — Achtsamkeits-Layer ist additiv, nie blockierend
  }

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
