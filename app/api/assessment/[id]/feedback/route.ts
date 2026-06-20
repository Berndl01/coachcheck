import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/assessment/[id]/feedback  — Treffer-Feedback (Bestcase §27)
 *
 * Erfasst „Wie gut erkennst du dich wieder?" (0–10) + optional den hilfreichsten
 * Abschnitt. Schreibt AUSSCHLIESSLICH in result_feedback (eigene Tabelle) über
 * service_role. Rührt NIE Scoring/axis_scores/Archetyp an — das Feedback darf
 * das berechnete Ergebnis nicht verändern.
 */

// Whitelist der bewertbaren Abschnitte (deckt die Ergebnis-Bausteine ab).
const HELPFUL_SECTIONS = ['profil', 'signatur', 'staerken', 'druck', 'naechster_schritt'] as const;

const BodySchema = z.object({
  recognition: z.number().int().min(0).max(10),
  most_helpful: z.enum(HELPFUL_SECTIONS).nullable().optional(),
});

const ALLOWED_STATUSES = ['completed', 'report_ready', 'archived'];

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

  // Eigentum + Zustand prüfen (nur eigenes, abgeschlossenes Assessment).
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!assessment) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!ALLOWED_STATUSES.includes(assessment.status)) {
    return NextResponse.json({ error: 'Feedback erst nach Abschluss möglich' }, { status: 409 });
  }

  // Schreiben ausschließlich über service_role, ausschließlich in result_feedback.
  const admin = createAdminClient();
  const { error } = await admin
    .from('result_feedback')
    .upsert(
      {
        assessment_id: id,
        user_id: user.id,
        recognition: body.recognition,
        most_helpful: body.most_helpful ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'assessment_id' },
    );

  if (error) {
    return NextResponse.json({ error: 'Konnte Feedback nicht speichern' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
