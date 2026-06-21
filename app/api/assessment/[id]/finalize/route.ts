import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAssessmentActivated } from '@/lib/assessment/activation-gate';
import { computeAxisScores, determineArchetypes, classifyProfile, profileHeadline, buildSignature, computeMaturityScores, type RawAnswer, type Archetype } from '@/lib/scoring';
import { computeResponseQuality, type QualityAnswer } from '@/lib/insight/response-quality';
import { SCORING_VERSION, ITEMPOOL_VERSION } from '@/lib/release/contract';
import { isValidAnswerValue } from '@/lib/assessment/answer-validity';

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

  // Genau eine gültige Antwort je item_id (Set entdoppelt automatisch).
  const answerById = new Map<number, any>();
  for (const row of answers as any[]) {
    if (!answerById.has(row.item_id)) answerById.set(row.item_id, row);
  }

  // (P0.5) Zentrale, fail-closed Gültigkeitsprüfung (inkl. Choice-Schlüssel,
  // ungültig bei fehlenden Optionen). Siehe lib/assessment/answer-validity.ts.
  const hasValidValue = (fmt: string, row: any): boolean => isValidAnswerValue(fmt, row);

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

  // (P0.6) Ab hier wird AUSSCHLIESSLICH auf den erwarteten Items dieses Tiers
  // gerechnet. Fremde/doppelte/unerwartete Antworten fließen NICHT ins Scoring,
  // in die Modul-Signale, die Antwortqualität oder den Snapshot ein.
  const expectedIdSet = new Set<number>(expectedIds);
  const validAnswers = (answers as any[]).filter((row) => {
    if (!expectedIdSet.has(row.item_id)) return false;
    return hasValidValue(row.item?.format, row);
  });

  // Build RawAnswer array
  const rawAnswers: RawAnswer[] = validAnswers.map((row: any) => ({
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
  validAnswers.forEach((row) => {
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

  // Wichtig-vs-Gelebt-Lücke je Modul — ebenfalls aus den validen Items, damit
  // der Report sie aus dem eingefrorenen Snapshot lesen kann (statt später aus
  // möglicherweise geänderten Items neu zu rechnen).
  const gapW: Record<string, number[]> = {};
  const gapG: Record<string, number[]> = {};
  validAnswers.forEach((row: any) => {
    const code = row.item?.module_code;
    const fmt = row.item?.format;
    if (!code || row.value_numeric == null) return;
    if (fmt === 'gap_wichtig') (gapW[code] ??= []).push(row.value_numeric);
    else if (fmt === 'gap_gelebt') (gapG[code] ??= []).push(row.value_numeric);
  });
  const moduleGaps: Record<string, number> = {};
  Object.keys(gapW).forEach((code) => {
    const w = gapW[code]; const g = gapG[code];
    if (!w?.length || !g?.length) return;
    const avgW = w.reduce((x, y) => x + y, 0) / w.length;
    const avgG = g.reduce((x, y) => x + y, 0) / g.length;
    const gap = Math.max(0, Math.min(1, (avgW - avgG) / 4));
    if (gap > 0) moduleGaps[code] = gap;
  });

  // Antwortqualität (#6): rein aus Antwortwerten + Ausfülldauer (valide Items).
  const startedAt = assessment.started_at ? new Date(assessment.started_at).getTime() : null;
  const durationMs = startedAt != null ? Date.now() - startedAt : null;
  const qualityAnswers: QualityAnswer[] = validAnswers.map((row: any) => {
    const v = row.value_numeric;
    const likert = typeof v === 'number' && v >= 1 && v <= 5 ? v : null;
    return { likert, reverse: !!row.item?.reverse_scored };
  });
  const responseQuality = computeResponseQuality(qualityAnswers, durationMs);

  // Load archetypes — inkl. Anzeigefelder (P0.4), damit der Snapshot die
  // vollständige Archetyp-Darstellung EINFRIERT und ein späterer Edit an den
  // Archetyptexten einen neu erzeugten Report eines alten Assessments nicht ändert.
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('id, code, name_de, short_trait, kernmuster, staerken, risiken, entwicklungshebel, axis_profile');

  if (!archetypes || archetypes.length < 2) {
    return NextResponse.json({ error: 'at least two archetypes required' }, { status: 500 });
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

  // ----------------------------------------------------------------------
  // UNVERÄNDERBARER ERGEBNIS-SNAPSHOT (Migration 46): friert exakt das ein,
  // was bei diesem Abschluss galt — inkl. Scoring-/Itempool-Version und der
  // erwarteten Item-IDs. Ergebnisansicht/Report/PDF lesen danach diesen
  // Snapshot; alte Assessments werden NIE mit neuen Itemgewichten neu
  // gerechnet. Die Reife-Werte sind hier bewusst „Entwicklungsindikatoren"
  // (kein normiertes Reifemaß) — siehe Darstellung in Result/PDF.
  // ----------------------------------------------------------------------
  const resultSnapshot = {
    scoring_version: SCORING_VERSION,
    itempool_version: ITEMPOOL_VERSION,
    expected_item_ids: expectedIds,
    axis_scores: axisScores,
    module_signals: mAvg,
    module_gaps: moduleGaps,
    development_indicators: maturityScores,
    primary_archetype_code: primary.code,
    secondary_archetype_code: secondary.code,
    // (P0.4) Eingefrorene Archetyp-Darstellung — alle Felder, die Ergebnisseite,
    // Report und PDF anzeigen. Neue Assessments lesen daraus, nicht aus der
    // (potenziell später geänderten) Archetyptabelle.
    archetypes: {
      primary: {
        id: primary.id,
        code: primary.code,
        name_de: primary.name_de,
        short_trait: (primary as any).short_trait ?? null,
        kernmuster: (primary as any).kernmuster ?? null,
        staerken: (primary as any).staerken ?? [],
        risiken: (primary as any).risiken ?? [],
        entwicklungshebel: (primary as any).entwicklungshebel ?? [],
        axis_profile: primary.axis_profile,
      },
      secondary: {
        id: secondary.id,
        code: secondary.code,
        name_de: secondary.name_de,
        short_trait: (secondary as any).short_trait ?? null,
        axis_profile: secondary.axis_profile,
      },
    },
    profile,
    response_quality: responseQuality,
    completed_at: new Date().toISOString(),
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
      scoring_version: SCORING_VERSION,
      itempool_version: ITEMPOOL_VERSION,
      result_snapshot: resultSnapshot,
      snapshot_finalized_at: new Date().toISOString(),
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
