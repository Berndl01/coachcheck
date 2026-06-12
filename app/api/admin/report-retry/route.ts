import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/utils/admin';
import { logAudit } from '@/lib/utils/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Admin-Aktion für das Monitoring (P2 #14).
 *
 * action 'reset-job': löscht fehlgeschlagene/steckengebliebene report_jobs für
 *   ein Assessment und gibt damit den Lock frei — eine erneute
 *   Report-Generierung kann sauber neu starten.
 *
 * Bewusst eng & service-role-geschützt; nur für Admins erreichbar.
 */
const BodySchema = z.object({
  assessmentId: z.string().uuid(),
  action: z.enum(['reset-job']),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (body.action === 'reset-job') {
    const { error } = await admin
      .from('report_jobs')
      .delete()
      .eq('assessment_id', body.assessmentId)
      .in('status', ['failed', 'queued', 'processing']);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit({
      actorUserId: user.id,
      action: 'admin.report_job_reset',
      entityType: 'assessment',
      entityId: body.assessmentId,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
