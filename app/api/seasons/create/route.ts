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
  const { name, sport, team_size_estimate, assessment_id, pulse_interval_days } = body;

  // Validate user has tier-5 purchase or assessment
  if (assessment_id) {
    const { data: ax } = await supabase
      .from('assessments')
      .select('id, user_id, product:products(tier)')
      .eq('id', assessment_id)
      .eq('user_id', user.id)
      .single();
    if (!ax) return NextResponse.json({ error: 'Assessment nicht gefunden' }, { status: 404 });
    const tier = (ax.product as any)?.tier ?? 0;
    if (tier < 5) {
      return NextResponse.json({ error: 'Saison-Monitor erfordert das Saison-Paket (Tier 5).' }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from('seasons')
    .insert({
      user_id: user.id,
      assessment_id: assessment_id ?? null,
      name: name ?? 'Saison',
      sport: sport ?? null,
      team_size_estimate: team_size_estimate ?? null,
      pulse_interval_days: pulse_interval_days ?? 30,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, season: data });
}
