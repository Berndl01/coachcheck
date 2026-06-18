import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/utils/audit';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { deleteReportFiles } from '@/lib/pdf/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DSGVO Löschung (Art. 17).
 *   scope='assessment'|'report' + targetId → sofortige Löschung der eigenen
 *     Entität (DB-Cascade entfernt abhängige Zeilen).
 *   scope='account' → Löschanfrage wird protokolliert und vom Team verarbeitet
 *     (vollständige Auth-User-Löschung ist bewusst nicht 1-Klick-irreversibel).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(`delete:${user.id}`, 10, 600_000);
  if (!rl.ok) return NextResponse.json({ error: 'Zu viele Anfragen.', retryAfterMs: rl.retryAfterMs }, { status: 429 });

  let body: { scope?: string; targetId?: string };
  try { body = await request.json(); } catch { body = {}; }
  const scope = body.scope ?? 'account';
  const targetId = body.targetId;

  if (scope === 'assessment' || scope === 'report') {
    if (!targetId) return NextResponse.json({ error: 'targetId erforderlich' }, { status: 400 });
    const admin = createAdminClient();

    if (scope === 'assessment') {
      // Ownership prüfen, bevor wir mit Admin-Rechten löschen.
      const { data: owned } = await supabase
        .from('assessments').select('id').eq('id', targetId).eq('user_id', user.id).maybeSingle();
      if (!owned) return NextResponse.json({ error: 'not found' }, { status: 404 });

      // (1) Zuerst die zugehörigen PDF-Dateien aus dem Storage entfernen — die
      //     DB-Cascade löscht nur die reports-Zeilen, nicht die Dateien.
      const { data: reps } = await admin
        .from('reports').select('storage_path').eq('assessment_id', targetId);
      const filesGone = await deleteReportFiles((reps ?? []).map((r: { storage_path: string | null }) => r.storage_path));
      if (!filesGone) {
        return NextResponse.json({ error: 'Reportdateien konnten nicht gelöscht werden. Bitte erneut versuchen.' }, { status: 500 });
      }

      // (2) Erst danach die DB-Zeile (cascade: answers, reports, report_jobs) —
      //     und den Fehler PRÜFEN, statt blind ok zu melden.
      const { error: delErr } = await admin.from('assessments').delete().eq('id', targetId);
      if (delErr) {
        return NextResponse.json({ error: 'Löschung fehlgeschlagen. Bitte erneut versuchen.' }, { status: 500 });
      }
    } else {
      // Report nur löschen, wenn das zugehörige Assessment dem Nutzer gehört.
      const { data: rep } = await admin.from('reports').select('assessment_id, storage_path').eq('id', targetId).maybeSingle();
      const { data: owned } = rep
        ? await supabase.from('assessments').select('id').eq('id', rep.assessment_id).eq('user_id', user.id).maybeSingle()
        : { data: null };
      if (!owned) return NextResponse.json({ error: 'not found' }, { status: 404 });

      const filesGone = await deleteReportFiles([rep?.storage_path]);
      if (!filesGone) {
        return NextResponse.json({ error: 'Reportdatei konnte nicht gelöscht werden. Bitte erneut versuchen.' }, { status: 500 });
      }
      const { error: delErr } = await admin.from('reports').delete().eq('id', targetId);
      if (delErr) {
        return NextResponse.json({ error: 'Löschung fehlgeschlagen. Bitte erneut versuchen.' }, { status: 500 });
      }
    }

    await logAudit({ actorUserId: user.id, action: `delete_${scope}`, entityType: scope, entityId: targetId });
    return NextResponse.json({ ok: true, deleted: scope, targetId });
  }

  // scope === 'account' → protokollierte Löschanfrage (RLS-insert own).
  const { error } = await supabase
    .from('deletion_requests')
    .insert({ user_id: user.id, scope: 'account', status: 'requested' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ actorUserId: user.id, action: 'delete_account_requested', entityType: 'account', entityId: user.id });
  return NextResponse.json({ ok: true, requested: true, note: 'Deine Kontolöschung wurde angefordert und wird innerhalb von 30 Tagen bearbeitet.' });
}
