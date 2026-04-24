import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_SEASON_PHASES = [
  'vorbereitung', 'fruehe_saison', 'erfolgslauf', 'formkrise',
  'kaderumbruch', 'trainerwechsel', 'saisonendphase', 'aufstiegsdruck', 'abstiegsdruck',
];
const VALID_TEAM_MATURITIES = ['jung_unerfahren', 'gemischt', 'reif_etabliert', 'umbruch'];
const VALID_CONFLICT_STATES = ['stabil', 'leichte_spannungen', 'spuerbare_spannungen', 'akuter_konflikt'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  const { seasonPhase, teamMaturity, conflictState, ageRange, notes } = body;

  const update: any = {};
  if (seasonPhase === null || (seasonPhase && VALID_SEASON_PHASES.includes(seasonPhase))) {
    update.context_season_phase = seasonPhase;
  }
  if (teamMaturity === null || (teamMaturity && VALID_TEAM_MATURITIES.includes(teamMaturity))) {
    update.context_team_maturity = teamMaturity;
  }
  if (conflictState === null || (conflictState && VALID_CONFLICT_STATES.includes(conflictState))) {
    update.context_conflict_state = conflictState;
  }
  if (ageRange !== undefined) update.context_age_range = ageRange;
  if (notes !== undefined) update.context_notes = notes;

  const { error } = await supabase
    .from('assessments')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
