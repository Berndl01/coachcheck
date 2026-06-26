import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkPaidEntitlement } from '@/lib/auth/entitlement';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Aktionsbereich (Bestcase §11/§12): den nächsten Schritt aus dem Ergebnis als
 * trackbaren 7-Tage-Fokus setzen.
 *
 * POST   /api/assessment/[id]/action  — Fokus setzen/ersetzen (genau einer aktiv).
 * DELETE /api/assessment/[id]/action  — aktiven Fokus entfernen (archivieren).
 *
 * Schreibt ausschließlich über service_role in action_plans, nach Auth +
 * Eigentum. Kein Zugriff auf Scoring.
 */

const ALLOWED_STATUSES = ['completed', 'report_ready', 'archived'];

const BodySchema = z.object({
  title: z.string().trim().min(1).max(160),
  action: z.string().trim().min(1).max(600),
  source: z.string().trim().max(60).optional(),
});

async function ownedAssessment(id: string, userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('assessments')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 });
  }

  const assessment = await ownedAssessment(id, user.id, supabase);
  if (!assessment) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!ALLOWED_STATUSES.includes(assessment.status)) {
    return NextResponse.json({ error: 'Fokus erst nach Abschluss möglich' }, { status: 409 });
  }

  const admin = createAdminClient();

  // Entitlement-Gate: Nach vollem Refund keine neuen/aktualisierten Fokuspläne.
  const ent = await checkPaidEntitlement(admin, id, user.id);
  if (!ent.ok) {
    return NextResponse.json({ error: 'Keine aktive Berechtigung.' }, { status: 402 });
  }

  // Genau ein aktiver Fokus pro (Nutzer, Assessment): bestehenden aktiven Plan
  // in-place aktualisieren, sonst neu anlegen (vermeidet Partial-Unique-Konflikt).
  const { data: existing } = await admin
    .from('action_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('assessment_id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from('action_plans')
      .update({
        title: body.title,
        action: body.action,
        source: body.source ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, title, action, status, target_days, created_at')
      .single();
    if (error) return NextResponse.json({ error: 'Konnte Fokus nicht aktualisieren' }, { status: 500 });
    return NextResponse.json({ ok: true, plan: data });
  }

  const { data, error } = await admin
    .from('action_plans')
    .insert({
      user_id: user.id,
      assessment_id: id,
      title: body.title,
      action: body.action,
      source: body.source ?? null,
    })
    .select('id, title, action, status, target_days, created_at')
    .single();
  if (error) return NextResponse.json({ error: 'Konnte Fokus nicht setzen' }, { status: 500 });
  return NextResponse.json({ ok: true, plan: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const assessment = await ownedAssessment(id, user.id, supabase);
  if (!assessment) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('action_plans')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('assessment_id', id)
    .eq('status', 'active');
  if (error) return NextResponse.json({ error: 'Konnte Fokus nicht entfernen' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
