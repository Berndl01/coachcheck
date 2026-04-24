import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  const { season_id, closes_in_days } = body;
  if (!season_id) return NextResponse.json({ error: 'season_id erforderlich' }, { status: 400 });

  // Validate ownership
  const { data: season } = await supabase
    .from('seasons')
    .select('id, status')
    .eq('id', season_id)
    .eq('user_id', user.id)
    .single();

  if (!season) return NextResponse.json({ error: 'Saison nicht gefunden' }, { status: 404 });
  if (season.status !== 'active') {
    return NextResponse.json({ error: 'Saison ist nicht aktiv' }, { status: 400 });
  }

  // Get next cycle number
  const { data: existingCycles } = await supabase
    .from('pulse_cycles')
    .select('cycle_number')
    .eq('season_id', season_id)
    .order('cycle_number', { ascending: false })
    .limit(1);

  const nextNumber = ((existingCycles?.[0]?.cycle_number ?? 0) as number) + 1;

  // Calculate closes_at
  const days = Math.min(Math.max(parseInt(closes_in_days ?? 14, 10), 3), 60);
  const closesAt = new Date();
  closesAt.setDate(closesAt.getDate() + days);

  const { data: cycle, error } = await supabase
    .from('pulse_cycles')
    .insert({
      season_id,
      cycle_number: nextNumber,
      closes_at: closesAt.toISOString(),
      status: 'open',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, cycle });
}
