import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getReportSignedUrl } from '@/lib/pdf/storage';
import { checkPaidEntitlement } from '@/lib/auth/entitlement';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Poll-Endpoint für den Report-Status. Wird vom Frontend benutzt, wenn die
 * synchrone Generierung mit 409 (bereits in Arbeit) antwortet oder nach
 * Reload. Liefert den Job-Status und — falls fertig — die Signed-URL.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: assessment } = await supabase
    .from('assessments').select('id').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!assessment) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const admin = createAdminClient();

  // P0 (v3.42, Blocker 1 — Refund-Lockdown, Variante A): Nach vollständiger
  // Rückerstattung darf der fertige Report nicht mehr ausgeliefert werden. Die
  // Signed-URL wird nur bei weiterhin BEZAHLTER Purchase erzeugt.
  const ent = await checkPaidEntitlement(admin, id, user.id);
  if (!ent.ok) {
    return NextResponse.json(
      { status: 'locked', error: 'Für dieses Ergebnis besteht keine aktive Berechtigung mehr.' },
      { status: 402 },
    );
  }

  const { data: report } = await admin
    .from('reports').select('storage_path').eq('assessment_id', id)
    .order('generated_at', { ascending: false }).limit(1).maybeSingle();

  if (report?.storage_path) {
    const signedUrl = await getReportSignedUrl(report.storage_path);
    return NextResponse.json({ status: 'ready', signedUrl });
  }

  const { data: job } = await admin
    .from('report_jobs').select('status, error_message').eq('assessment_id', id)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  const retryable = job?.status === 'failed' && (job?.error_message ?? '').includes('retryable');

  return NextResponse.json({
    status: job?.status ?? 'none',
    error: retryable ? null : (job?.error_message ?? null),
    retryable,
  });
}
