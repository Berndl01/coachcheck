import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPaidEntitlement } from '@/lib/auth/entitlement';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Kostenloser Wiederholungstest — NUR wenn die Antwortqualität als
 * 'nicht_interpretierbar' eingestuft wurde. So lässt sich ein bezahltes
 * Ergebnis nicht beliebig „nachbessern"; die Wiederholung ist an genau diesen
 * Schutzfall gebunden (Ergebnisvertrag).
 *
 * Setzt die Session sauber zurück: Antworten gelöscht, Ergebnis-Snapshot und
 * abgeleitete Felder entfernt, Status zurück auf 'in_progress'. Der Kauf bleibt
 * unverändert gültig — kein neuer Zahlungsvorgang.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Ownership + weiterhin BEZAHLTE Berechtigung (nach Refund kein Retake).
  const ent = await checkPaidEntitlement(admin, id, user.id);
  if (!ent.ok) {
    return NextResponse.json({ error: 'Keine aktive Berechtigung.' }, { status: 402 });
  }

  const { data: assessment } = await admin
    .from('assessments')
    .select('id, user_id, status, response_quality')
    .eq('id', id)
    .maybeSingle();

  if (!assessment || assessment.user_id !== user.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const dq = (assessment.response_quality as { dataQuality?: string } | null)?.dataQuality ?? null;
  if (dq !== 'nicht_interpretierbar') {
    // Wiederholung ist ausschließlich für den Schutzfall vorgesehen.
    return NextResponse.json({ error: 'Wiederholung für dieses Ergebnis nicht vorgesehen.' }, { status: 409 });
  }

  // Antworten löschen.
  const { error: delErr } = await admin.from('answers').delete().eq('assessment_id', id);
  if (delErr) {
    return NextResponse.json({ error: 'Antworten konnten nicht zurückgesetzt werden.' }, { status: 500 });
  }

  // Ergebnisfelder + Snapshot leeren, Status zurück auf in_progress.
  const { error: updErr } = await admin
    .from('assessments')
    .update({
      status: 'in_progress',
      current_item_index: 0,
      progress_pct: 0,
      started_at: new Date().toISOString(),
      completed_at: null,
      primary_archetype_id: null,
      secondary_archetype_id: null,
      axis_scores: null,
      maturity_scores: null,
      signature: null,
      response_quality: null,
      result_snapshot: null,
    })
    .eq('id', id);

  if (updErr) {
    return NextResponse.json({ error: 'Wiederholung konnte nicht gestartet werden.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
