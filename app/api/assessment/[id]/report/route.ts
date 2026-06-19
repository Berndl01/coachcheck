import { NextResponse, type NextRequest } from 'next/server';
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateReportTextsWithMeta, type ReportInput } from '@/lib/ai/report-prompt';
import { softenDeep } from '@/lib/knowledge/claim-guard';
import { evaluateCareSignals, type CareResponse } from '@/lib/safety/care-triggers';
import { uploadReportPDF, getReportSignedUrl } from '@/lib/pdf/storage';
import { sendEmailSafe } from '@/lib/email/resend';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { checkPaidEntitlement } from '@/lib/auth/entitlement';
import { isAdminUser } from '@/lib/utils/admin';
import {
  computeFremdbildAxisScores,
  computeAxisDiscrepancies,
  computeMaturityScores,
  computeDispersion,
  axisDistance,
  type AxisScores,
  type FremdbildAggregateRow,
  type MaturityScores,
} from '@/lib/scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: assessmentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Missbrauchsschutz für (teure) Report-Generierung — v. a. ?regenerate=1.
  const rl = await checkRateLimit(`report:${user.id}`, 12, 600_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Report-Anfragen. Bitte kurz warten.', retryAfterMs: rl.retryAfterMs }, { status: 429 });
  }

  const { data: assessment } = await supabase
    .from('assessments')
    .select(`
      *,
      product:products(*),
      primary:primary_archetype_id(*),
      secondary:secondary_archetype_id(*)
    `)
    .eq('id', assessmentId)
    .eq('user_id', user.id)
    .single();

  if (!assessment) {
    return NextResponse.json({ error: 'assessment not found' }, { status: 404 });
  }
  if (!assessment.primary_archetype_id || !assessment.axis_scores) {
    return NextResponse.json({ error: 'assessment not finalized yet' }, { status: 400 });
  }

  // --- Idempotenz-Klammer (P0) -------------------------------------------
  // Admin-Client einmalig für Lock + Persistenz.
  const admin = createAdminClient();

  // --- Entitlement-Gate (P0) ---------------------------------------------
  // Bevor IRGENDEIN KI-/PDF-Kostenpfad startet: Assessment muss durch eine
  // gültige, bezahlte Purchase desselben Nutzers gedeckt sein. Schließt die
  // umgehbare Paywall (Migration 27 + dieser Check + RLS-Lockdown).
  const entitlement = await checkPaidEntitlement(admin, assessmentId, user.id);
  if (!entitlement.ok) {
    return NextResponse.json(
      { error: 'Für dieses Assessment liegt keine gültige Bezahlung vor.', reason: entitlement.reason },
      { status: 402 },
    );
  }

  // ?regenerate=1 erzwingt einen neuen (teuren) KI-/PDF-Lauf. Nur für Admins —
  // ein normaler Käufer kann so keine wiederholten Kostenläufe auslösen und
  // erhält den bereits erzeugten Report aus dem Cache.
  const regenerate =
    new URL(request.url).searchParams.get('regenerate') === '1' && (await isAdminUser(user));

  // (a) Existiert bereits ein fertiger Report? Dann ohne neuen KI-/PDF-Lauf
  //     ausliefern — verhindert teure Doppelläufe bei Reload/Mehrfachklick.
  if (!regenerate) {
    const { data: existing } = await admin
      .from('reports')
      .select('storage_path')
      .eq('assessment_id', assessmentId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.storage_path) {
      const signedUrl = await getReportSignedUrl(existing.storage_path);
      return NextResponse.json({ ok: true, storagePath: existing.storage_path, signedUrl, reused: true });
    }
  }

  // (b) Atomarer Lock: höchstens ein aktiver Job pro Assessment. Ein
  //     gleichzeitiger zweiter Lauf scheitert am Partial-Unique-Index (23505)
  //     — gleicher Mechanismus wie im Stripe-Webhook.
  const { data: job, error: jobErr } = await admin
    .from('report_jobs')
    .insert({ assessment_id: assessmentId, user_id: user.id, status: 'processing', locked_at: new Date().toISOString() })
    .select('id')
    .single();

  if (jobErr) {
    if ((jobErr as { code?: string }).code === '23505') {
      // Aktiver Job läuft bereits → Frontend pollt; KEIN zweiter teurer Lauf.
      return NextResponse.json({ error: 'report generation already in progress', inProgress: true }, { status: 409 });
    }
    return NextResponse.json({ error: `job lock failed: ${jobErr.message}` }, { status: 500 });
  }
  const jobId = job.id;

  // Bei jedem Fehlerpfad den Job freigeben (failed), damit ein Retry den
  // Lock erneut claimen kann. Liefert die ursprüngliche Fehlerantwort zurück.
  const failJob = async (reason: string, status = 500) => {
    await admin.from('report_jobs').update({ status: 'failed', error_message: reason }).eq('id', jobId);
    return NextResponse.json({ error: reason }, { status });
  };

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, sport, training_level, age_group, club_type')
    .eq('id', user.id)
    .single();

  // Compute module averages — Item-Join über admin (items für Browser/RLS
  // seit Migration 29 nicht lesbar; sonst module_code/reverse_scored null).
  const { data: answers } = await admin
    .from('answers')
    .select('value_numeric, value_position, item:items(module_code, format, reverse_scored)')
    .eq('assessment_id', assessmentId);

  const moduleAverages: Record<string, number> = {};
  const moduleCounts: Record<string, number> = {};
  (answers ?? []).forEach((a: any) => {
    const code = a.item?.module_code;
    if (!code) return;
    let v: number | null = null;
    if (a.value_numeric != null) {
      v = (a.value_numeric - 3) / 2;
      if (a.item.reverse_scored) v = -v;
    } else if (a.value_position != null) {
      v = a.value_position * 2 - 1;
    }
    if (v == null) return;
    moduleAverages[code] = (moduleAverages[code] ?? 0) + v;
    moduleCounts[code] = (moduleCounts[code] ?? 0) + 1;
  });
  Object.keys(moduleAverages).forEach((code) => {
    moduleAverages[code] = moduleAverages[code] / moduleCounts[code];
  });

  // Wichtig-vs-Gelebt-Lücke je Modul (developmental signal):
  // Differenz zwischen "wie wichtig" (gap_wichtig) und "wie gelebt" (gap_gelebt),
  // normalisiert auf 0..1 (Likert 1-5 → max. Differenz 4). Höher = größere Lücke.
  const gapWichtig: Record<string, number[]> = {};
  const gapGelebt: Record<string, number[]> = {};
  (answers ?? []).forEach((a: any) => {
    const code = a.item?.module_code;
    const fmt = a.item?.format;
    if (!code || a.value_numeric == null) return;
    if (fmt === 'gap_wichtig') (gapWichtig[code] ??= []).push(a.value_numeric);
    else if (fmt === 'gap_gelebt') (gapGelebt[code] ??= []).push(a.value_numeric);
  });
  const moduleGaps: Record<string, number> = {};
  Object.keys(gapWichtig).forEach((code) => {
    const w = gapWichtig[code];
    const g = gapGelebt[code];
    if (!w?.length || !g?.length) return;
    const avgW = w.reduce((x, y) => x + y, 0) / w.length;
    const avgG = g.reduce((x, y) => x + y, 0) / g.length;
    const gap = Math.max(0, Math.min(1, (avgW - avgG) / 4));
    if (gap > 0) moduleGaps[code] = gap;
  });

  const primary = assessment.primary as any;
  const secondary = assessment.secondary as any;
  const productTier = (assessment.product as any)?.tier ?? 0;

  const traineeName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Trainer:in';
  const sport = profile?.sport ?? '';

  // ============== 360° FREMDBILD AGGREGATION ==============
  let fremdbildSection: ReportInput['fremdbild'] = null;
  let pdfFremdbildScores: AxisScores | null = null;
  let pdfDiscrepancies: any[] | null = null;
  let pdfResponseCount = 0;

  if (productTier >= 3) {
    const admin = createAdminClient();
    const { data: aggregates } = await admin.rpc('get_fremdbild_aggregate', {
      assessment_uuid: assessmentId,
    });

    if (aggregates && aggregates.length > 0) {
      // Build items lookup for the aggregated items
      const itemIds = (aggregates as any[]).map((a) => a.item_id);
      const { data: items } = await admin
        .from('items')
        .select('id, format, axis_weights, reverse_scored, options')
        .in('id', itemIds);

      const itemsLookup = new Map(
        (items ?? []).map((it: any) => [
          it.id,
          {
            format: it.format,
            axis_weights: it.axis_weights ?? {},
            reverse_scored: it.reverse_scored ?? false,
            options: it.options,
          },
        ])
      );

      const fremd = computeFremdbildAxisScores(aggregates as FremdbildAggregateRow[], itemsLookup);
      if (fremd) {
        const selfScores = assessment.axis_scores as AxisScores;
        const discrepancies = computeAxisDiscrepancies(selfScores, fremd.axisScores);

        fremdbildSection = {
          axisScores: fremd.axisScores,
          discrepancies,
          responseCount: fremd.responseCount,
        };
        pdfFremdbildScores = fremd.axisScores;
        pdfDiscrepancies = discrepancies;
        pdfResponseCount = fremd.responseCount;
      }
    }
  }

  // ============== TEAMCHECK PLAYER AGGREGATION ==============
  let teamcheckSection: ReportInput['teamcheck'] = null;
  let teamcheckResponseCount = 0;
  if (productTier >= 4) {
    const admin = createAdminClient();
    const { data: tcAggs } = await admin.rpc('get_teamcheck_aggregate', {
      assessment_uuid: assessmentId,
    });

    if (tcAggs && tcAggs.length > 0) {
      // Build items lookup for axis weights
      const itemIds = (tcAggs as any[]).map((a) => a.item_id);
      const { data: tcItems } = await admin
        .from('items')
        .select('id, format, axis_weights, reverse_scored, options')
        .in('id', itemIds);

      const itemsLookup = new Map(
        (tcItems ?? []).map((it: any) => [it.id, it])
      );

      // Aggregate per axis
      const totals: Record<string, number> = {};
      const counts: Record<string, number> = {};
      const TEAM_AXES = ['coach_impact', 'psy_safety', 'team_klima', 'leistungsdr', 'klarheit'];

      (tcAggs as any[]).forEach((row) => {
        const item = itemsLookup.get(row.item_id);
        if (!item) return;
        let signed: number | null = null;
        if (row.format === 'likert_5' && row.avg_numeric != null) {
          signed = (Number(row.avg_numeric) - 3) / 2;
          if (item.reverse_scored) signed = -signed;
        } else if (row.format === 'spannungsfeld' && row.avg_position != null) {
          signed = Number(row.avg_position) * 2 - 1;
        } else if ((row.format === 'forced_choice') && row.top_choice && item.options) {
          const opt = (item.options as any[]).find((o) => o.key === row.top_choice);
          if (opt) {
            // Use the option's weights to derive a signed value per axis
            const weights = opt.weights ?? {};
            TEAM_AXES.forEach((ax) => {
              if (weights[ax] !== undefined) {
                totals[ax] = (totals[ax] ?? 0) + weights[ax];
                counts[ax] = (counts[ax] ?? 0) + Math.abs(weights[ax]);
              }
            });
            return;
          }
        }
        if (signed === null) return;
        const itemWeights = item.axis_weights ?? {};
        TEAM_AXES.forEach((ax) => {
          const w = itemWeights[ax];
          if (w === undefined || w === null) return;
          totals[ax] = (totals[ax] ?? 0) + signed * w;
          counts[ax] = (counts[ax] ?? 0) + Math.abs(w);
        });
      });

      const norm = (axis: string) => {
        if (!counts[axis]) return 0.5;
        const avg = totals[axis] / counts[axis];
        return Math.max(0, Math.min(1, (avg + 1) / 2));
      };

      teamcheckResponseCount = Math.max(...(tcAggs as any[]).map(a => Number(a.response_count) || 0));

      // Achtsamkeitshinweise (Know-how-Transfer Humatrix 2026-06):
      // wertabhängig, anonym aggregiert, strenge Schwellen (≥5 Antwortende,
      // ≥2 betroffene Antworten, ≥25 % Anteil) — siehe lib/safety/care-triggers.ts.
      // Best effort: Fehler hier dürfen die Reporterstellung nie blockieren.
      let teamcheckCareHints: { topic: string; text: string }[] = [];
      try {
        const { data: playerInvs } = await admin
          .from('invitations')
          .select('id')
          .eq('parent_assessment_id', assessmentId)
          .eq('invitation_type', 'spieler')
          .eq('status', 'completed');

        const invIds = (playerInvs ?? []).map((i: any) => i.id);
        if (invIds.length >= 5) {
          const { data: rawAnswers } = await admin
            .from('invitation_answers')
            .select('invitation_id, value_numeric, item:items(code, format)')
            .in('invitation_id', invIds);

          const careResponses: CareResponse[] = (rawAnswers ?? [])
            .filter((r: any) => r.item?.format === 'likert_5' && r.value_numeric != null)
            .map((r: any) => ({
              code: String(r.item.code),
              value: Number(r.value_numeric),
              respondent: String(r.invitation_id),
            }));

          teamcheckCareHints = evaluateCareSignals(careResponses).map((h) => ({
            topic: h.topic,
            text: h.text,
          }));
        }
      } catch {
        // additiv, nie blockierend
      }

      teamcheckSection = {
        coachImpact: norm('coach_impact'),
        psySafety: norm('psy_safety'),
        teamKlima: norm('team_klima'),
        leistungsdruck: norm('leistungsdr'),
        klarheit: norm('klarheit'),
        responseCount: teamcheckResponseCount,
        careHints: teamcheckCareHints,
      };
    }
  }

  // ============== PREMIUM INTELLIGENCE LAYER ==============

  // Maturity scores (always computed for tier 2+)
  let maturityScores: MaturityScores | null = null;
  if (productTier >= 2) {
    maturityScores = computeMaturityScores(
      assessment.axis_scores as AxisScores,
      moduleAverages
    );
    // Persist to assessments table for future use
    try {
      const admin = createAdminClient();
      await admin
        .from('assessments')
        .update({ maturity_scores: maturityScores })
        .eq('id', assessmentId);
    } catch (e) {
      console.warn('Failed to persist maturity_scores:', e);
    }
  }

  // Polarization detection in fremdbild (if 360° data exists)
  let polarizedAxes: string[] = [];
  if (productTier >= 3 && fremdbildSection && fremdbildSection.responseCount >= 3) {
    try {
      const admin = createAdminClient();

      // 1. Get completed fremdbild invitation IDs for this assessment
      const { data: invs } = await admin
        .from('invitations')
        .select('id')
        .eq('parent_assessment_id', assessmentId)
        .eq('invitation_type', 'fremdbild')
        .eq('status', 'completed');

      const invIds = (invs ?? []).map((i: any) => i.id);
      if (invIds.length < 3) {
        // skip — need 3+ for meaningful dispersion
      } else {
        // 2. Get only relevant answers
        const { data: rawAnswers } = await admin
          .from('invitation_answers')
          .select('item_id, value_numeric')
          .in('invitation_id', invIds)
          .not('value_numeric', 'is', null);

        // Group by item, compute dispersion
        const byItem = new Map<number, number[]>();
        (rawAnswers ?? []).forEach((r: any) => {
          if (!byItem.has(r.item_id)) byItem.set(r.item_id, []);
          byItem.get(r.item_id)!.push(Number(r.value_numeric));
        });

        // Items with high dispersion → map to their axes
        const { data: itemsInfo } = await admin
          .from('items')
          .select('id, axis_weights')
          .in('id', Array.from(byItem.keys()));

        const polarizedAxisSet = new Set<string>();
        (itemsInfo ?? []).forEach((item: any) => {
          const vals = byItem.get(item.id);
          if (!vals || vals.length < 3) return;
          const disp = computeDispersion(vals);
          if (disp.polarized) {
            const weights = item.axis_weights ?? {};
            Object.keys(weights).forEach((ax) => polarizedAxisSet.add(ax));
          }
        });
        polarizedAxes = Array.from(polarizedAxisSet);
      }
    } catch (e) {
      console.warn('Polarization detection failed:', e);
    }
  }

  // Context from assessment + profile. Premium-Kontext liegt bevorzugt in eigenen Spalten,
  // zusätzlich aber als Fallback in metadata.context, damit ältere DB-Stände nicht brechen.
  const metadataContext = ((assessment.metadata as any)?.context ?? {}) as Record<string, any>;
  const seasonPhase = assessment.context_season_phase ?? metadataContext.seasonPhase ?? null;
  const teamMaturity = assessment.context_team_maturity ?? metadataContext.teamMaturity ?? null;
  const conflictState = assessment.context_conflict_state ?? metadataContext.conflictState ?? null;
  const ageRange = assessment.context_age_range ?? metadataContext.ageRange ?? null;
  const notes = assessment.context_notes ?? metadataContext.notes ?? null;
  const hasAssessmentContext = !!(seasonPhase || teamMaturity || conflictState || ageRange || notes);
  const hasProfileContext = !!(profile?.training_level || profile?.age_group || profile?.club_type);

  const context = (hasAssessmentContext || hasProfileContext)
    ? {
        seasonPhase,
        teamMaturity,
        conflictState,
        ageRange,
        notes,
        trainingLevel: profile?.training_level ?? null,
        ageGroup: profile?.age_group ?? null,
        clubType: profile?.club_type ?? null,
      }
    : null;

  // Distanz-Differenz Primär vs Sekundär — flagged Mischtypen für AI-Prompt
  let archetypeDistanceDelta: number | null = null;
  if (primary?.axis_profile && secondary?.axis_profile) {
    const dPrimary = axisDistance(assessment.axis_scores as AxisScores, primary.axis_profile);
    const dSecondary = axisDistance(assessment.axis_scores as AxisScores, secondary.axis_profile);
    archetypeDistanceDelta = Math.abs(dSecondary - dPrimary);
  }

  const reportInput: ReportInput = {
    productTier,
    productName: assessment.product.name_de,
    traineeName,
    sport,
    primaryArchetype: {
      name_de: primary.name_de,
      short_trait: primary.short_trait,
      kernmuster: primary.kernmuster,
      staerken: primary.staerken ?? [],
      risiken: primary.risiken ?? [],
      entwicklungshebel: primary.entwicklungshebel ?? [],
    },
    secondaryArchetype: {
      name_de: secondary.name_de,
      short_trait: secondary.short_trait,
    },
    archetypeDistanceDelta,
    axisScores: assessment.axis_scores as AxisScores,
    moduleAverages,
    moduleGaps,
    maturityScores,
    context,
    fremdbild: fremdbildSection
      ? { ...fremdbildSection, polarizedAxes }
      : null,
    teamcheck: teamcheckSection,
    responseQuality: assessment.response_quality ?? null,
  };

  // 1. Generate AI texts (mit Retry + Validierung + Fallback ohne KI).
  //    Auch fehlende/fehlerhafte API-Keys o. Ä. dürfen den Job NIE auf
  //    'processing' hängen lassen — daher hart abfangen → failJob.
  let gen: Awaited<ReturnType<typeof generateReportTextsWithMeta>>;
  try {
    gen = await generateReportTextsWithMeta(reportInput);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'report generation failed';
    console.error('[report] generation failed:', msg);
    return failJob(`Report-Erstellung fehlgeschlagen: ${msg}`);
  }
  let texts = gen.output;

  // --- Bei nicht verfügbarem KI-Dienst: SAUBER aus den Daten ausliefern -------
  // Früher wurde hier ein Fehler ("Dienst ausgelastet") gezeigt und auf einen
  // erneuten Versuch verwiesen. Stattdessen liefern wir jetzt die vollständige,
  // deterministisch aus Archetyp + Achsenwerten abgeleitete Auswertung aus
  // (inkl. Bedienungsanleitung + Wirkung-je-Spielertyp). Der Käufer bekommt also
  // immer sofort einen kompletten Report — ohne sichtbaren Hinweis auf einen
  // ausgelasteten Dienst. Intern bleibt ai_fallback=true gesetzt, damit solche
  // Reports im Monitor sichtbar sind und bei Bedarf neu erzeugt werden können.

  // 1b. Claim Guard — Sicherheitsnetz: gesperrte Begriffe garantiert entfernen.
  const guard = softenDeep(texts);
  texts = guard.value;
  if (!guard.audit.clean) {
    console.warn('[claim-guard] forbidden terms softened:', JSON.stringify(guard.audit.hits));
  }

  // 2. Render PDF
  let pdfBuffer: Buffer;
  try {
    // @react-pdf/renderer + Report-Dokument lazy laden: hält die schwere
    // PDF-Bibliothek aus der Next-Build-Sammelphase ("Collecting page data")
    // heraus und lädt sie erst zur Laufzeit, wenn wirklich gerendert wird.
    const [{ renderToBuffer }, { ReportDocument }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/lib/pdf/report-document'),
    ]);
    const element = React.createElement(ReportDocument, {
      traineeName,
      sport,
      productName: assessment.product.name_de,
      productTier,
      date: new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }),
      primaryArchetype: reportInput.primaryArchetype,
      secondaryArchetype: reportInput.secondaryArchetype,
      axisScores: reportInput.axisScores,
      texts,
      fremdbildScores: pdfFremdbildScores,
      discrepancies: pdfDiscrepancies,
      fremdbildResponseCount: pdfResponseCount,
      teamcheckScores: teamcheckSection ? {
        coachImpact: teamcheckSection.coachImpact,
        psySafety: teamcheckSection.psySafety,
        teamKlima: teamcheckSection.teamKlima,
        leistungsdruck: teamcheckSection.leistungsdruck,
        klarheit: teamcheckSection.klarheit,
      } : null,
      teamcheckResponseCount,
      teamcheckCareHints: teamcheckSection?.careHints?.length ? teamcheckSection.careHints : null,
      maturityScores,
      context,
      dataQuality: assessment.response_quality
        ? {
            band: assessment.response_quality.dataQuality,
            confidence: assessment.response_quality.confidence,
            note: assessment.response_quality.note,
          }
        : null,
    });
    // @ts-expect-error - renderToBuffer accepts Document element
    pdfBuffer = await renderToBuffer(element);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'PDF error';
    console.error('PDF render failed:', msg);
    return failJob(`PDF render failed: ${msg}`);
  }

  // 3. Upload PDF
  let storagePath: string;
  try {
    storagePath = await uploadReportPDF(assessmentId, user.id, pdfBuffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'storage error';
    console.error('Upload failed:', msg);
    return failJob(`Upload failed: ${msg}`);
  }

  // 4. Store report row
  const { data: reportRow, error: reportErr } = await admin.from('reports').insert({
    assessment_id: assessmentId,
    storage_path: storagePath,
    file_size_bytes: pdfBuffer.length,
    pages: productTier >= 4 && teamcheckSection
      ? (fremdbildSection ? 19 : 17)
      : productTier >= 3 && fremdbildSection ? 15 : productTier >= 2 ? 12 : 7,
    generation_model: gen.model,
    prompt_version: gen.promptVersion,
    prompt_tokens: gen.promptTokens,
    completion_tokens: gen.completionTokens,
    ai_fallback: gen.fallback,
    metadata: {
      has_360: !!fremdbildSection,
      fremdbild_count: pdfResponseCount,
      has_teamcheck: !!teamcheckSection,
      teamcheck_count: teamcheckResponseCount,
      claim_audit: guard.audit,
      ai_attempts: gen.attempts,
      ai_fallback: gen.fallback,
    },
  }).select('id').single();

  // PDF liegt zwar im Storage, aber ohne Report-Zeile darf der Status NICHT
  // auf report_ready springen — sonst zeigt das UI einen "fertigen" Report
  // ohne DB-Referenz. Job sauber auf failed setzen.
  if (reportErr || !reportRow) {
    return failJob(`Report DB insert failed: ${reportErr?.message ?? 'missing report row'}`);
  }

  // 5. Mark assessment as report_ready + Job als ready abschließen (mit report_id).
  await admin
    .from('assessments')
    .update({ status: 'report_ready' })
    .eq('id', assessmentId);
  await admin
    .from('report_jobs')
    .update({ status: 'ready', report_id: reportRow.id })
    .eq('id', jobId);

  // 6. Signed URL
  const signedUrl = await getReportSignedUrl(storagePath);

  // 7. Send email
  if (process.env.RESEND_API_KEY && user.email) {
    try {
      const has360Note = fremdbildSection
        ? `<p style="font-size: 14px; line-height: 1.55; color: #143F3A; background: #F0EEEA; padding: 14px 18px; border-left: 3px solid #B38E45; margin-bottom: 24px;">
             <strong>360° Spiegel inklusive:</strong> Dein Report enthält die Diskrepanz-Analyse zwischen deinem Selbstbild und ${fremdbildSection.responseCount} Fremdeinschätzungen aus deinem Team.
           </p>`
        : '';

      await sendEmailSafe({
        to: user.email,
        subject: `Dein Humatrix Coach Report ist bereit — ${assessment.product.name_de}`,
        category: 'report-ready',
        html: `
          <div style="font-family: -apple-system, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #1B1C1E;">
            <div style="padding: 32px 0; border-bottom: 1px solid #DBD8D1;">
              <div style="font-family: monospace; font-size: 11px; letter-spacing: 4px; color: #1B1C1E;">HUMATRIX</div>
            </div>
            <div style="padding: 32px 0;">
              <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #B38E45; text-transform: uppercase; margin-bottom: 12px;">
                Dein Report ist bereit
              </div>
              <h1 style="font-size: 28px; font-weight: 300; letter-spacing: -0.5px; line-height: 1.2; margin: 0 0 16px 0;">
                ${traineeName}, <br>dein Premium-Profil wartet.
              </h1>
              <p style="font-size: 15px; line-height: 1.55; color: #767471; margin-bottom: 18px;">
                Dein ${assessment.product.name_de} wurde ausgewertet. Der vollständige Premium-Report mit deinem Archetyp, deiner funktionalen Signatur, allen Modul-Interpretationen und einem konkreten 30-Tage-Entwicklungspfad steht zum Download bereit.
              </p>
              ${has360Note}
              <a href="${signedUrl}" style="display: inline-block; padding: 14px 28px; background: #1B1C1E; color: #FAFAF8; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 14px;">
                Report herunterladen →
              </a>
              <p style="font-size: 12px; color: #9A9793; margin-top: 32px;">
                Der Download-Link ist 7 Tage gültig. Du findest den Report auch jederzeit in deinem Dashboard auf coachcheck.humatrix.cc.
              </p>
            </div>
            <div style="padding: 20px 0; border-top: 1px solid #DBD8D1; font-size: 11px; color: #9A9793; letter-spacing: 1px; text-transform: uppercase;">
              Humatrix · The Mind Club Company · Made in Tyrol, Austria
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.error('Email send failed:', err);
    }
  }

  return NextResponse.json({
    ok: true,
    storagePath,
    signedUrl,
    has360: !!fremdbildSection,
    fremdbildCount: pdfResponseCount,
  });
}
