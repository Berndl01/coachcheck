import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSeasonEntitlement } from '@/lib/season/entitlement';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validierung (P1): closes_in_days muss eine Ganzzahl 3–60 sein. Früher führte
// z. B. "abc" über NaN zu einem ungültigen Datum und einem unnötigen 500er.
const BodySchema = z.object({
  season_id: z.string().min(1),
  closes_in_days: z.coerce.number().int().min(3).max(60).optional(),
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
      { error: 'Ungültige Eingaben (closes_in_days muss eine Ganzzahl zwischen 3 und 60 sein).' },
      { status: 400 },
    );
  }
  const { season_id, closes_in_days } = body;

  const admin = createAdminClient();
  // Berechtigung bei JEDER Aktion prüfen (Eigentümer + bezahlter Tier-5-Kauf + aktiv).
  const ent = await requireSeasonEntitlement(admin, season_id, { ownerUserId: user.id });
  if (!ent.ok) return NextResponse.json({ error: ent.error }, { status: ent.status });

  // Kein zweiter offener Cycle (zusätzlich per Unique-Index abgesichert).
  const { data: openCycle } = await admin
    .from('pulse_cycles')
    .select('id')
    .eq('season_id', season_id)
    .eq('status', 'open')
    .maybeSingle();
  if (openCycle) {
    return NextResponse.json({ error: 'Es läuft bereits ein offener Pulse-Zyklus.' }, { status: 409 });
  }

  const { data: existingCycles } = await admin
    .from('pulse_cycles')
    .select('cycle_number')
    .eq('season_id', season_id)
    .order('cycle_number', { ascending: false })
    .limit(1);
  const nextNumber = ((existingCycles?.[0]?.cycle_number ?? 0) as number) + 1;

  const days = closes_in_days ?? 14;
  const closesAt = new Date();
  closesAt.setDate(closesAt.getDate() + days);

  // Schreiben via service_role (direkte Browser-Schreibrechte sind ab Migration 38 entfernt).
  const { data: cycle, error } = await admin
    .from('pulse_cycles')
    .insert({
      season_id,
      cycle_number: nextNumber,
      closes_at: closesAt.toISOString(),
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'Es läuft bereits ein offener Pulse-Zyklus.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, cycle });
}
