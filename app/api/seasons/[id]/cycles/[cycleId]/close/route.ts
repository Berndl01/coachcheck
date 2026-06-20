import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSeasonEntitlement } from '@/lib/season/entitlement';
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

  const admin = createAdminClient();
  // Berechtigung bei JEDER Aktion prüfen (Eigentümer + bezahlter, nicht erstatteter
  // Tier-5-Kauf + aktive Saison). Blockiert das Schließen nach einem Refund.
  const ent = await requireSeasonEntitlement(admin, seasonId, { ownerUserId: user.id });
  if (!ent.ok) return NextResponse.json({ error: ent.error }, { status: ent.status });

  // Cycle muss zur Saison gehören (kein Cross-Season-Close über fremde cycleId)
  // UND noch offen sein (kein erneutes Schließen / Schließen archivierter Cycles).
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

  // Anonymitätsschwelle (P0 Blocker 3): vor dem Auswerten den Live-Stand exakt
  // neu zählen. Unter 5 vollständigen Antworten wird KEIN Snapshot erzeugt —
  // sonst würde ein versehentliches Schließen bei 4 Antworten die Runde
  // dauerhaft mit leerer Auswertung beenden. Wer trotzdem beenden will, nutzt
  // die getrennte Aktion „ohne Auswertung archivieren" (archive-Route).
  const { data: liveCount } = await admin.rpc('refresh_pulse_cycle_response_count', {
    cycle_uuid: cycleId,
  });
  const liveResponseCount = typeof liveCount === 'number' ? liveCount : 0;
  if (liveResponseCount < 5) {
    return NextResponse.json(
      {
        error: 'Noch nicht genügend vollständige Antworten für eine anonyme Auswertung (mindestens 5 erforderlich).',
        responseCount: liveResponseCount,
      },
      { status: 409 },
    );
  }

  // Compute snapshot (>= 5 ist hier garantiert)
  const { data: snapshotResult, error: snapErr } = await admin.rpc('compute_pulse_snapshot', {
    cycle_uuid: cycleId,
  });
  if (snapErr) return NextResponse.json({ error: snapErr.message }, { status: 500 });

  const snapshot = (snapshotResult as any) ?? {};
  const responseCount = snapshot?.response_count ?? liveResponseCount;

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

  // Update cycle: set snapshot, mark closed. status='open'-Bedingung schützt
  // gegen ein paralleles Schließen (Race).
  const { error: updErr } = await admin
    .from('pulse_cycles')
    .update({
      snapshot,
      response_count: responseCount,
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
    .eq('id', cycleId)
    .eq('status', 'open');

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Detect trends
  const { data: trends } = await admin.rpc('detect_pulse_trends', {
    season_uuid: seasonId,
    cycle_uuid: cycleId,
  });

  return NextResponse.json({ ok: true, snapshot, trends, responseCount });
}
