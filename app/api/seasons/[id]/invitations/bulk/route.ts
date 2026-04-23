import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json();
  const { season_id, count } = body;
  if (!season_id) return NextResponse.json({ error: 'season_id erforderlich' }, { status: 400 });

  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('id', season_id)
    .eq('user_id', user.id)
    .single();
  if (!season) return NextResponse.json({ error: 'Saison nicht gefunden' }, { status: 404 });

  const n = Math.min(Math.max(parseInt(count ?? 0, 10), 1), 100);
  if (!n) return NextResponse.json({ error: 'count > 0 erforderlich' }, { status: 400 });

  const records = Array.from({ length: n }, (_, i) => ({
    season_id,
    label: `Spieler ${String(i + 1).padStart(2, '0')}`,
  }));

  const { data: invitations, error } = await supabase
    .from('pulse_invitations')
    .insert(records)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, invitations });
}
