import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeAxisScores, determineArchetypes, buildSignature, type RawAnswer, type Archetype } from '@/lib/scoring';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Validate ownership
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, user_id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!assessment) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Load all answers + items (for weights + options)
  const { data: answers, error: aErr } = await supabase
    .from('answers')
    .select('item_id, value_numeric, value_choice, value_position, item:items(format, axis_weights, reverse_scored, options)')
    .eq('assessment_id', id);

  if (aErr || !answers) {
    return NextResponse.json({ error: 'failed to load answers' }, { status: 500 });
  }

  if (answers.length === 0) {
    return NextResponse.json({ error: 'no answers submitted' }, { status: 400 });
  }

  // Build RawAnswer array
  const rawAnswers: RawAnswer[] = answers.map((row: any) => ({
    item_id: row.item_id,
    format: row.item.format,
    axis_weights: row.item.axis_weights ?? {},
    reverse_scored: row.item.reverse_scored,
    value_numeric: row.value_numeric,
    value_choice: row.value_choice,
    value_position: row.value_position,
    options: row.item.options,
  }));

  // Compute axis scores
  const axisScores = computeAxisScores(rawAnswers);

  // Load archetypes
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('id, code, name_de, axis_profile');

  if (!archetypes || archetypes.length === 0) {
    return NextResponse.json({ error: 'archetypes not seeded' }, { status: 500 });
  }

  const { primary, secondary } = determineArchetypes(axisScores, archetypes as Archetype[]);
  const signature = buildSignature(axisScores);

  // Save results via admin client (bypasses RLS for the UPDATE)
  const admin = createAdminClient();
  const { error: uErr } = await admin
    .from('assessments')
    .update({
      status: 'report_ready',
      completed_at: new Date().toISOString(),
      progress_pct: 100,
      primary_archetype_id: primary.id,
      secondary_archetype_id: secondary.id,
      axis_scores: axisScores,
      signature: { axes: signature },
    })
    .eq('id', id);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    primary: primary.code,
    secondary: secondary.code,
    axisScores,
  });
}
