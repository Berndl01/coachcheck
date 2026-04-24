import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_LEVELS = ['amateur_hobby', 'amateur_ambitioniert', 'semi_profi', 'profi'];
const VALID_AGES = ['kids_u12', 'jugend_u16', 'jugend_u18', 'erwachsene', 'gemischt'];
const VALID_CLUBS = ['dorfverein', 'stadtverein', 'leistungszentrum', 'akademie', 'sonstige'];

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
  const { full_name, sport, club, training_level, age_group, club_type } = body;

  const update: any = {};
  if (full_name !== undefined) update.full_name = full_name;
  if (sport !== undefined) update.sport = sport;
  if (club !== undefined) update.club = club;
  if (training_level === null || (training_level && VALID_LEVELS.includes(training_level))) {
    update.training_level = training_level;
  }
  if (age_group === null || (age_group && VALID_AGES.includes(age_group))) {
    update.age_group = age_group;
  }
  if (club_type === null || (club_type && VALID_CLUBS.includes(club_type))) {
    update.club_type = club_type;
  }

  // Upsert profile row
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...update }, { onConflict: 'id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
