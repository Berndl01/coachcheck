import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/utils/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DSGVO Auskunft/Portabilität (Art. 15 / 20): liefert alle personenbezogenen
 * Daten des angemeldeten Nutzers als JSON-Download. Rohantworten werden mit
 * exportiert (es sind die eigenen Daten des Nutzers).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [profile, assessments, purchases, reports, consents] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('assessments').select('*').eq('user_id', user.id),
    supabase.from('purchases').select('*').eq('user_id', user.id),
    supabase.from('reports').select('id, assessment_id, generated_at, pages, generation_model, metadata'),
    supabase.from('consent_records').select('*').eq('user_id', user.id),
  ]);

  const assessmentIds = (assessments.data ?? []).map((a: { id: string }) => a.id);
  let answers: unknown[] = [];
  if (assessmentIds.length) {
    const { data } = await supabase
      .from('answers')
      .select('assessment_id, item_id, value_numeric, value_choice, value_position, answered_at')
      .in('assessment_id', assessmentIds);
    answers = data ?? [];
  }

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data ?? null,
    assessments: assessments.data ?? [],
    answers,
    purchases: purchases.data ?? [],
    reports: (reports.data ?? []).filter((r: { assessment_id: string }) => assessmentIds.includes(r.assessment_id)),
    consents: consents.data ?? [],
    note: 'Export gemäß DSGVO Art. 15/20. Fragen: office@humatrix.cc',
  };

  await logAudit({ actorUserId: user.id, action: 'data_export', entityType: 'account', entityId: user.id });

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="humatrix-datenexport-${user.id.slice(0, 8)}.json"`,
    },
  });
}
