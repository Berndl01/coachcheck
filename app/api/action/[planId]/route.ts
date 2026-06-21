import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPaidEntitlement } from '@/lib/auth/entitlement';
import { z } from 'zod';
import { localDateISO } from '@/lib/utils/local-date';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Aktionsbereich – Check-in-Schleife (Bestcase §12), je aktivem Fokus-Plan.
 *
 * POST   /api/action/[planId]  — Check-in für heute (optional Notiz). Plan aktiv.
 * DELETE /api/action/[planId]  — Check-in von heute zurücknehmen.
 * PATCH  /api/action/[planId]  — Fokus abschließen (status = completed).
 *
 * Ownership wird über action_plans.user_id geprüft; Schreiben ausschließlich
 * über service_role. Kein Scoring-Zugriff.
 */

function todayISO(): string {
  // Lokales Datum (Europe/Vienna) statt UTC — verhindert Datumssprung um Mitternacht.
  return localDateISO('Europe/Vienna');
}

const CheckinSchema = z.object({
  note: z.string().trim().max(300).optional(),
});

async function loadOwnedPlan(planId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('action_plans')
    .select('id, user_id, status, target_days, assessment_id')
    .eq('id', planId)
    .maybeSingle();
  if (!data || data.user_id !== userId) return null;
  return data;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: z.infer<typeof CheckinSchema>;
  try {
    body = CheckinSchema.parse(await request.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 });
  }

  const plan = await loadOwnedPlan(planId, user.id);
  if (!plan) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (plan.status !== 'active') {
    return NextResponse.json({ error: 'Fokus ist nicht aktiv' }, { status: 409 });
  }

  const admin = createAdminClient();

  // Refund-Kaskade (§14): nach voller Rückerstattung keine neuen Check-ins mehr.
  if (plan.assessment_id) {
    const ent = await checkPaidEntitlement(admin, plan.assessment_id, user.id);
    if (!ent.ok) {
      return NextResponse.json({ error: 'Keine aktive Berechtigung für diesen Vorgang.' }, { status: 402 });
    }
  }

  const { error } = await admin
    .from('action_checkins')
    .upsert(
      { plan_id: planId, user_id: user.id, checkin_date: todayISO(), note: body.note ?? null },
      { onConflict: 'plan_id,checkin_date' },
    );
  if (error) return NextResponse.json({ error: 'Konnte Check-in nicht speichern' }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const plan = await loadOwnedPlan(planId, user.id);
  if (!plan) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('action_checkins')
    .delete()
    .eq('plan_id', planId)
    .eq('user_id', user.id)
    .eq('checkin_date', todayISO());
  if (error) return NextResponse.json({ error: 'Konnte Check-in nicht zurücknehmen' }, { status: 500 });

  return NextResponse.json({ ok: true });
}

const PatchSchema = z.object({
  status: z.literal('completed'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    PatchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 });
  }

  const plan = await loadOwnedPlan(planId, user.id);
  if (!plan) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const admin = createAdminClient();

  // Refund-Kaskade (§14): nach voller Rückerstattung kein Abschluss mehr.
  if (plan.assessment_id) {
    const ent = await checkPaidEntitlement(admin, plan.assessment_id, user.id);
    if (!ent.ok) {
      return NextResponse.json({ error: 'Keine aktive Berechtigung für diesen Vorgang.' }, { status: 402 });
    }
  }

  const { error } = await admin
    .from('action_plans')
    .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Konnte Fokus nicht abschließen' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
