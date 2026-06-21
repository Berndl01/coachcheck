import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPaidEntitlement } from '@/lib/auth/entitlement';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Kostenloser Neuversuch (verbindliche Release-Bedingung Antwortqualität).
 *
 * Setzt das Assessment auf 'in_progress' zurück und löscht die bisherigen
 * Antworten + den eingefrorenen Ergebnis-Snapshot — aber NUR, wenn:
 *   - der Aufrufer der Eigentümer ist,
 *   - eine gültige, BEZAHLTE Purchase vorliegt (kein Refund-Bypass),
 *   - die gespeicherte Antwortqualität tatsächlich 'nicht_interpretierbar' ist.
 *
 * Damit lässt sich kein belastbares Ergebnis „wegklicken" — der Reset greift
 * ausschließlich für nicht interpretierbare Durchläufe. Schreiben über
 * service_role (answers/assessments sind seit den RLS-Härtungen gesperrt).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(`retry:${user.id}`, 6, 600_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Versuche. Bitte kurz warten.', retryAfterMs: rl.retryAfterMs }, { status: 429 });
  }

  const admin = createAdminClient();

  // Eigentum + bezahlter Kauf.
  const ent = await checkPaidEntitlement(admin, id, user.id);
  if (!ent.ok) {
    return NextResponse.json({ error: 'Keine aktive Berechtigung für diesen Vorgang.' }, { status: 402 });
  }

  // Reset nur bei nicht interpretierbarem Antwortmuster.
  const { data: a } = await admin
    .from('assessments')
    .select('id, user_id, response_quality')
    .eq('id', id)
    .maybeSingle();
  if (!a || a.user_id !== user.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const dq = (a.response_quality as { dataQuality?: string } | null)?.dataQuality ?? null;
  if (dq !== 'nicht_interpretierbar') {
    return NextResponse.json({ error: 'Ein Neuversuch ist hier nicht vorgesehen.' }, { status: 409 });
  }

  // Antworten löschen.
  const { error: delErr } = await admin.from('answers').delete().eq('assessment_id', id);
  if (delErr) {
    return NextResponse.json({ error: 'Antworten konnten nicht zurückgesetzt werden.' }, { status: 500 });
  }

  // Assessment auf Anfang zurücksetzen (Ergebnis-Snapshot leeren).
  const { error: updErr } = await admin
    .from('assessments')
    .update({
      status: 'in_progress',
      progress_pct: 0,
      current_item_index: 0,
      completed_at: null,
      primary_archetype_id: null,
      secondary_archetype_id: null,
      axis_scores: null,
      maturity_scores: null,
      response_quality: null,
      signature: null,
      result_snapshot: null,
      snapshot_finalized_at: null,
      scoring_version: null,
      itempool_version: null,
    })
    .eq('id', id);
  if (updErr) {
    return NextResponse.json({ error: 'Assessment konnte nicht zurückgesetzt werden.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
