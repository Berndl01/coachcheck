import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSeasonEntitlement } from '@/lib/season/entitlement';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/seasons/[id]/invitations/[invitationId]/revoke
 *
 * Widerruft ein einzelnes Pulse-Token (status='revoked'). Danach nimmt der
 * /pulse/[token]-Pfad keine Antworten mehr von diesem Token an. Nutzbar, wenn
 * ein Link weitergegeben/kompromittiert wurde oder ein Spieler ausgeschieden ist.
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

  // Token muss zur Saison gehören (kein Cross-Season-Revoke).
  const { data: inv } = await admin
    .from('pulse_invitations')
    .select('id, season_id, status')
    .eq('id', invitationId)
    .maybeSingle();
  if (!inv || inv.season_id !== seasonId) {
    return NextResponse.json({ error: 'Token nicht gefunden' }, { status: 404 });
  }

  const { error } = await admin
    .from('pulse_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)
    .eq('season_id', seasonId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, revoked: true });
}
