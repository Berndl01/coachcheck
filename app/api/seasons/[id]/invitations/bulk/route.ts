import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSeasonEntitlement } from '@/lib/season/entitlement';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Höchstzahl aktiver Pulse-Tokens pro Saison + Paketgröße pro Aufruf.
const MAX_ACTIVE_TOKENS_PER_SEASON = 200;
const MAX_PER_REQUEST = 100;

const BodySchema = z.object({
  season_id: z.string().min(1),
  count: z.coerce.number().int().min(1).max(MAX_PER_REQUEST),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: `Ungültige Eingaben (count muss 1–${MAX_PER_REQUEST} sein).` },
      { status: 400 },
    );
  }
  const { season_id, count } = body;

  const admin = createAdminClient();
  const ent = await requireSeasonEntitlement(admin, season_id, { ownerUserId: user.id });
  if (!ent.ok) return NextResponse.json({ error: ent.error }, { status: ent.status });

  // Bestehende AKTIVE Tokens zählen — für Mengenbegrenzung und fortlaufende
  // Nummerierung. (Die Gesamtzahl inkl. widerrufener nutzen wir als Label-Basis,
  // damit Labels nicht erneut bei "Spieler 01" beginnen und Dubletten entstehen.)
  const { count: activeCount } = await admin
    .from('pulse_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('season_id', season_id)
    .eq('status', 'active');

  const active = activeCount ?? 0;
  if (active >= MAX_ACTIVE_TOKENS_PER_SEASON) {
    return NextResponse.json({
      error: `Maximal ${MAX_ACTIVE_TOKENS_PER_SEASON} aktive Spieler-Tokens pro Saison.`,
    }, { status: 409 });
  }

  // Label-Nummerierung an der bestehenden Gesamtzahl fortsetzen.
  const { count: totalCount } = await admin
    .from('pulse_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('season_id', season_id);
  const labelOffset = totalCount ?? 0;

  const n = Math.min(count, MAX_ACTIVE_TOKENS_PER_SEASON - active);

  // Spieler-Tokens sind ANONYM: kein invited_email. label nur zur Orientierung.
  const records = Array.from({ length: n }, (_, i) => ({
    season_id,
    label: `Spieler ${String(labelOffset + i + 1).padStart(2, '0')}`,
  }));

  const { data: invitations, error } = await admin
    .from('pulse_invitations')
    .insert(records)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, invitations, capped: n < count });
}
