import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSeasonEntitlement } from '@/lib/season/entitlement';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// URL-sicheres Token im selben Format wie der DB-Trigger (24 zufällige Bytes,
// base64url ohne Padding).
function generateToken(): string {
  return randomBytes(24)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * POST /api/seasons/[id]/invitations/[invitationId]/rotate
 *
 * Rotiert ein Pulse-Token: vergibt einen NEUEN, unrätselbaren Token und setzt
 * den Datensatz (wieder) auf 'active'. Der alte Link wird damit ungültig.
 * Nutzbar, wenn ein Link kompromittiert wurde — der Platz/„Spieler" bleibt
 * erhalten, nur der Zugang wird ersetzt.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  const { id: seasonId, invitationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const ent = await requireSeasonEntitlement(admin, seasonId, { ownerUserId: user.id });
  if (!ent.ok) return NextResponse.json({ error: ent.error }, { status: ent.status });

  const { data: inv } = await admin
    .from('pulse_invitations')
    .select('id, season_id')
    .eq('id', invitationId)
    .maybeSingle();
  if (!inv || inv.season_id !== seasonId) {
    return NextResponse.json({ error: 'Token nicht gefunden' }, { status: 404 });
  }

  // Bei (extrem unwahrscheinlicher) Token-Kollision einmal neu versuchen.
  let newToken = generateToken();
  let updated = false;
  for (let attempt = 0; attempt < 2 && !updated; attempt++) {
    const { error } = await admin
      .from('pulse_invitations')
      .update({ token: newToken, status: 'active' })
      .eq('id', invitationId)
      .eq('season_id', seasonId);
    if (!error) {
      updated = true;
      break;
    }
    if ((error as { code?: string }).code === '23505') {
      newToken = generateToken();
      continue;
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: 'Token-Rotation fehlgeschlagen' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token: newToken });
}
