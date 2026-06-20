import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAssessmentActivated } from '@/lib/assessment/activation-gate';
import { computeAxisScores, determineArchetypes, classifyProfile, profileHeadline, buildSignature, computeMaturityScores, type RawAnswer, type Archetype } from '@/lib/scoring';
import { computeResponseQuality, type QualityAnswer } from '@/lib/insight/response-quality';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    .select('id, user_id, status, started_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!assessment) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Aktivierungssperre: ein Assessment darf nur abgeschlossen werden, wenn es
  // freigeschaltet ist (pending/in_progress). Blockiert insbesondere
  // 'awaiting_contract_confirmation' — sonst ließe sich die Vertragsbestätigungs-
  // sperre durch direkten Aufruf der Finalize-API umgehen.
  if (!isAssessmentActivated(assessment.status)) {
    return NextResponse.json({ error: 'assessment not activated' }, { status: 409 });
  }
  // service_role lesen — der Browser-/RLS-Client kann items nicht mehr lesen,
  // sonst kämen axis_weights als null und das Scoring wäre falsch.
  const admin = createAdminClient();
  const { data: answers, error: aErr } = await admin
    .from('answers')
    .select('item_id, value_numeric, value_choice, value_position, item:items(format, axis_weights, reverse_scored, options, module_code)')
    .eq('assessment_id', id);

  if (aErr || !answers) {
    return NextResponse.json({ error: 'failed to load answers' }, { status: 500 });
  }

  if (answers.length === 0) {
    return NextResponse.json({ error: 'no answers submitted' }, { status: 400 });
  }

  // ----------------------------------------------------------------------
  // VOLLSTÄNDIGKEIT (P0 #2): Es genügt NICHT, dass irgendwelche Antworten
  // existieren — es müssen exakt alle erwarteten Items des Tiers gültig
  // beantwortet sein. Doppelte oder fremde item_ids zählen nicht.
  // ----------------------------------------------------------------------
  const { data: expectedItems, error: eErr } = await supabase.rpc('get_items_for_assessment', {
    assessment_uuid: id,
  });
  if (eErr || !expectedItems || expectedItems.length === 0) {
    return NextResponse.json({ error: 'could not load expected items' }, { status: 500 });
  }

  const NUMERIC_FORMATS = new Set(['likert_5', 'state', 'gap_wichtig', 'gap_gelebt']);
  const POSITION_FORMATS = new Set(['spannungsfeld']);
  const CHOICE_FORMATS = new Set(['forced_choice', 'szenario', 'dilemma', 'ranking']);

  // Genau eine gültige Antwort je item_id (Set entdoppelt automatisch).
  const answerById = new Map<number, any>();
  for (const row of answers as any[]) {
    if (!answerById.has(row.item_id)) answerById.set(row.item_id, row);
  }

  const hasValidValue = (fmt: string, row: any): boolean => {
    if (!row) return false;
    if (NUMERIC_FORMATS.has(fmt)) {
      return Number.isInteger(row.value_numeric) && row.value_numeric >= 1 && row.value_numeric <= 5;
    }
    if (POSITION_FORMATS.has(fmt)) {
      return typeof row.value_position === 'number' && row.value_position >= 0 && row.value_position <= 1;
    }
    if (CHOICE_FORMATS.has(fmt)) {
      return typeof row.value_choice === 'string' && row.value_choice.length > 0;
    }
    return false;
  };

  const expectedIds: number[] = (expectedItems as any[]).map((it) => it.id);
  const missingItemIds: number[] = [];
  for (const it of expectedItems as any[]) {
    if (!hasValidValue(it.format, answerById.get(it.id))) missingItemIds.push(it.id);
  }
  const submittedValid = expectedIds.length - missingItemIds.length;

  if (missingItemIds.length > 0) {
    // Kein Score, kein Archetyp, kein 'completed'.
    return NextResponse.json(
      { error: 'assessment incomplete', expected: expectedIds.length, submitted: submittedValid, missingItemIds },
      { status: 400 }
    );
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

  // Compute leadership maturity (second layer) and persist for progress / re-check.
  const mAvg: Record<string, number> = {};
  const mCnt: Record<string, number> = {};
  (answers as any[]).forEach((row) => {
    const code = row.item?.module_code;
    if (!code) return;
    let v: number | null = null;
    if (row.value_numeric != null) {
      v = (row.value_numeric - 3) / 2;
      if (row.item.reverse_scored) v = -v;
    } else if (row.value_position != null) {
      v = row.value_position * 2 - 1;
    }
    if (v == null) return;
    mAvg[code] = (mAvg[code] ?? 0) + v;
    mCnt[code] = (mCnt[code] ?? 0) + 1;
  });
  Object.keys(mAvg).forEach((c) => { mAvg[c] = mAvg[c] / mCnt[c]; });
  const maturityScores = computeMaturityScores(axisScores, mAvg);

  // Antwortqualität (#6): rein aus Antwortwerten + Ausfülldauer.
  const startedAt = assessment.started_at ? new Date(assessment.started_at).getTime() : null;
  const durationMs = startedAt != null ? Date.now() - startedAt : null;
  const qualityAnswers: QualityAnswer[] = (answers as any[]).map((row) => {
    const v = row.value_numeric;
    const likert = typeof v === 'number' && v >= 1 && v <= 5 ? v : null;
    return { likert, reverse: !!row.item?.reverse_scored };
  });
  const responseQuality = computeResponseQuality(qualityAnswers, durationMs);

  // Load archetypes
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('id, code, name_de, axis_profile');

  if (!archetypes || archetypes.length === 0) {
    return NextResponse.json({ error: 'archetypes not seeded' }, { status: 500 });
  }

  const { primary, secondary, distances } = determineArchetypes(axisScores, archetypes as Archetype[]);
  const signature = buildSignature(axisScores);

  // Mischprofil-Klassifikation (Bestcase §9): einmal deterministisch bestimmen
  // und speichern. Alle Consumer (Result, Report, PDF, Coach Card) lesen diese
  // gespeicherte Einordnung — es wird nie beim Lesen neu gerechnet (§24).
  const classification = classifyProfile(distances);
  const profile = {
    type: classification.type,
    dominance: Math.round(classification.dominance * 10000) / 10000,
    gap: Math.round(classification.gap * 10000) / 10000,
    primary_code: primary.code,
    secondary_code: secondary.code,
    headline: profileHeadline(classification),
  };

  // Save results via admin client (bypasses RLS for the UPDATE).
  const { error: uErr } = await admin
    .from('assessments')
    .update({
      // Wahrheitsgemäß: Achsen/Reife berechnet, aber noch KEIN PDF-Report.
      // 'report_ready' wird erst von der Report-Route nach erfolgreichem
      // Upload gesetzt. Ergebnis-Seite & Dashboard akzeptieren 'completed'
      // bereits gleichwertig — kein UI-Bruch.
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress_pct: 100,
      primary_archetype_id: primary.id,
      secondary_archetype_id: secondary.id,
      axis_scores: axisScores,
      maturity_scores: maturityScores,
      response_quality: responseQuality,
      signature: { axes: signature, profile },
    })
    .eq('id', id);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    primary: primary.code,
    secondary: secondary.code,
    profileType: classification.type,
    axisScores,
  });
}
