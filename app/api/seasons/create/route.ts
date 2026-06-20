import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Serverseitige Eingabevalidierung (P1): verhindert überlange/ungültige Werte
// und unnötige 500er. Der Client kann jede dieser Grenzen ohnehin umgehen.
const BodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  sport: z.string().trim().max(100).optional().nullable(),
  team_size_estimate: z.coerce.number().int().min(1).max(500).optional().nullable(),
  pulse_interval_days: z.coerce.number().int().min(7).max(365).optional().nullable(),
});

/**
 * Saison-Monitor (Tier 5) anlegen.
 *
 * Eine Saison MUSS an einen bezahlten, bestätigten, nicht erstatteten Tier-5-Kauf
 * gebunden sein (seasons.purchase_id). Ohne einen solchen Kauf → 403. Pro Kauf
 * genau eine Saison (Unique-Index auf purchase_id). Geschrieben wird ausschließlich
 * serverseitig via service_role — direkte Browser-Schreibrechte auf seasons sind
 * in Migration 38 entfernt.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: 'Ungültige Eingaben (Name 1–120 Zeichen, Sportart ≤100, Teamgröße 1–500, Pulse-Intervall 7–365 Tage).' },
      { status: 400 },
    );
  }
  const { name, sport, team_size_estimate, pulse_interval_days } = body;

  const admin = createAdminClient();

  // Bezahlte, bestätigte Tier-5-Käufe des Nutzers (nicht erstattet = status 'paid').
  const { data: purchases } = await admin
    .from('purchases')
    .select('id, paid_at, product:products(tier)')
    .eq('user_id', user.id)
    .eq('status', 'paid')
    .not('confirmation_sent_at', 'is', null)
    .order('paid_at', { ascending: true });

  const tier5 = (purchases ?? []).filter((p) => (((p as any).product?.tier ?? 0) as number) >= 5);
  if (tier5.length === 0) {
    return NextResponse.json(
      { error: 'Der Saison-Monitor erfordert ein gekauftes und bestätigtes Saison-Paket (Tier 5).' },
      { status: 403 },
    );
  }

  // Ersten Tier-5-Kauf ohne bestehende Saison wählen (eine Saison pro Kauf).
  let purchaseId: string | null = null;
  for (const p of tier5) {
    const { data: existing } = await admin
      .from('seasons')
      .select('id')
      .eq('purchase_id', p.id)
      .maybeSingle();
    if (!existing) { purchaseId = p.id; break; }
  }
  if (!purchaseId) {
    return NextResponse.json(
      { error: 'Für deine Saison-Pakete besteht bereits jeweils eine Saison.' },
      { status: 409 },
    );
  }

  const { data, error } = await admin
    .from('seasons')
    .insert({
      user_id: user.id,
      purchase_id: purchaseId,
      name,
      sport: sport ?? null,
      team_size_estimate: team_size_estimate ?? null,
      pulse_interval_days: pulse_interval_days ?? 30,
    })
    .select()
    .single();

  if (error) {
    // Unique-Verletzung = Race: für diesen Kauf existiert schon eine Saison.
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'Für diesen Kauf besteht bereits eine Saison.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, season: data });
}
