import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireActiveAssessmentEntitlement } from '@/lib/auth/assessment-entitlement';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Höchstzahl aktiver (nicht abgelaufener/abgeschlossener) Spieler-Tokens pro
// Assessment. Verhindert das unbegrenzte Anlegen beliebig vieler Datensätze
// über wiederholte Bulk-Aufrufe.
const MAX_ACTIVE_PLAYER_TOKENS = 200;
const MAX_PER_REQUEST = 50;

/**
 * Bulk-create invitations for TeamCheck (anonyme Spieler-Tokens).
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

  // ZENTRALE Berechtigung (P0): Ownership + aktiviert + bezahlt + bestätigt +
  // NICHT erstattet. Schließt zwei Lücken: (1) Status
  // 'awaiting_contract_confirmation' kann keine Tokens mehr erzeugen,
  // (2) nach Refund ist der Weg gesperrt.
  const admin = createAdminClient();
  const ent = await requireActiveAssessmentEntitlement(admin, assessment_id, {
    ownerUserId: user.id,
  });
  if (!ent.ok) return NextResponse.json({ error: ent.error }, { status: ent.status });

  if (ent.tier < 4) {
    return NextResponse.json({
      error: 'Bulk-Einladungen sind erst ab dem TeamCheck verfügbar (Tier 4+).'
    }, { status: 403 });
  }

  // Modus prüfen. E-Mail-Modus für Spieler ist aus Datenschutzgründen deaktiviert.
  if (mode === 'emails') {
    return NextResponse.json({
      error: 'E-Mail-Modus für Spieler-Einladungen deaktiviert. TeamCheck-Einladungen sind anonym; bitte mode="tokens" verwenden.',
    }, { status: 400 });
  }
  if (mode !== 'tokens') {
    return NextResponse.json({ error: 'mode muss "tokens" sein' }, { status: 400 });
  }
  void emails; // vorsorglich ignorieren, falls mitgeschickt

  // Bestehende aktive Spieler-Tokens zählen (für Mengenbegrenzung + fortlaufende
  // Nummerierung).
  const { count: existingActive } = await admin
    .from('invitations')
    .select('id', { count: 'exact', head: true })
    .eq('parent_assessment_id', assessment_id)
    .eq('invitation_type', 'spieler')
    .not('status', 'in', '(completed,expired)');

  const active = existingActive ?? 0;
  if (active >= MAX_ACTIVE_PLAYER_TOKENS) {
    return NextResponse.json({
      error: `Maximal ${MAX_ACTIVE_PLAYER_TOKENS} aktive Spieler-Tokens pro Assessment.`,
    }, { status: 409 });
  }

  const requested = Math.min(Math.max(parseInt(count ?? 0, 10), 1), MAX_PER_REQUEST);
  if (!requested) {
    return NextResponse.json({ error: 'count > 0 erforderlich' }, { status: 400 });
  }
  const n = Math.min(requested, MAX_ACTIVE_PLAYER_TOKENS - active);

  // WICHTIG: TeamCheck-Bulk-Einladungen sind anonym. Spieler-E-Mails werden
  // bewusst NICHT gespeichert (invited_email: null).
  const records = Array.from({ length: n }, () => ({
    parent_assessment_id: assessment_id,
    invited_email: null as string | null,
    invitation_type: 'spieler',
    status: 'pending',
  }));

  const { data: invitations, error } = await admin
    .from('invitations')
    .insert(records)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    invitations,
    count: invitations?.length ?? 0,
    capped: n < requested,
  });
}
