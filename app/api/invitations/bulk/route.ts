import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Bulk-create invitations for TeamCheck.
 * Supports two modes:
 * - mode 'emails':  user provides list of player emails
 * - mode 'tokens':  user provides number of tokens to generate (no emails)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  const { assessment_id, mode, emails, count } = body;

  if (!assessment_id) {
    return NextResponse.json({ error: 'assessment_id erforderlich' }, { status: 400 });
  }

  // Validate ownership and tier
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, user_id, product:products(tier, slug)')
    .eq('id', assessment_id)
    .eq('user_id', user.id)
    .single();

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment nicht gefunden' }, { status: 404 });
  }

  const tier = (assessment.product as any)?.tier ?? 0;
  if (tier < 4) {
    return NextResponse.json({
      error: 'Bulk-Einladungen sind erst ab dem TeamCheck verfügbar (Tier 4+).'
    }, { status: 403 });
  }

  // Build list of records.
  // WICHTIG: TeamCheck-Bulk-Einladungen sind anonym. Spieler-E-Mails werden
  // bewusst NICHT gespeichert — die Anonymitäts-Zusage gegenüber Spielern
  // hält nur dann, wenn keine PII pro Token in der DB landet.
  // Wer Spielern einen Link schicken will, kopiert den Token-Link selbst
  // (WhatsApp, QR, Slack, Aushang).
  let records: { parent_assessment_id: string; invited_email: string | null; invitation_type: string; status: string }[] = [];

  if (mode === 'tokens') {
    const n = Math.min(Math.max(parseInt(count ?? 0, 10), 1), 50);
    if (!n) {
      return NextResponse.json({ error: 'count > 0 erforderlich' }, { status: 400 });
    }
    records = Array.from({ length: n }, () => ({
      parent_assessment_id: assessment_id,
      invited_email: null,
      invitation_type: 'spieler',
      status: 'pending',
    }));
  } else if (mode === 'emails') {
    // Explizit nicht mehr unterstützt — Datenschutz-Garantie für Spieler.
    // emails-Parameter wird verworfen, falls jemand ihn direkt schickt.
    return NextResponse.json({
      error: 'E-Mail-Modus für Spieler-Einladungen deaktiviert. TeamCheck-Einladungen sind anonym; bitte mode="tokens" verwenden.',
    }, { status: 400 });
  } else {
    return NextResponse.json({ error: 'mode muss "tokens" sein' }, { status: 400 });
  }

  // Vorsorglich: emails-Parameter ignorieren, falls vorhanden.
  void emails;

  const { data: invitations, error } = await supabase
    .from('invitations')
    .insert(records)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, invitations, count: invitations?.length ?? 0 });
}
