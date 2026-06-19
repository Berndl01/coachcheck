import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAssessmentActivated } from '@/lib/assessment/activation-gate';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/assessment/[id]/answer
 *
 * Server-seitige Speicherung & Validierung einer Self-Assessment-Antwort
 * (P0 #3). Der Runner schreibt NICHT mehr direkt via Supabase-Client in die
 * answers-Tabelle, sondern ausschließlich über diese Route.
 *
 * Hartes Gate (analog zur anonymen Invitation-Answer-Route):
 *   - Auth + Ownership des Assessments
 *   - Item ist aktiv UND im Tier des Assessments (gehört dazu)
 *   - genau ein Wertfeld passend zum Item-Format:
 *       likert_5 / state / gap_wichtig / gap_gelebt → Integer 1..5
 *       spannungsfeld                               → Zahl 0..1
 *       forced_choice / szenario / dilemma / ranking → value_choice ∈ options[].key
 *   - alle anderen Felder werden serverseitig auf null gesetzt
 *   - Fortschritt (current_item_index/progress_pct) wird serverseitig gesetzt;
 *     der Client darf NIEMALS status='completed' setzen (das macht /finalize).
 */
const BodySchema = z.object({
  item_id: z.number().int().positive(),
  value_numeric: z.number().nullable().optional(),
  value_choice: z.string().max(120).nullable().optional(),
  value_position: z.number().min(0).max(1).nullable().optional(),
  // optionaler Resume-Index (rein UI/Fortschritt, nicht sicherheitsrelevant)
  current_item_index: z.number().int().min(0).max(1000).optional(),
});

const NUMERIC_FORMATS = new Set(['likert_5', 'state', 'gap_wichtig', 'gap_gelebt']);
const POSITION_FORMATS = new Set(['spannungsfeld']);
const CHOICE_FORMATS = new Set(['forced_choice', 'szenario', 'dilemma', 'ranking']);

type ItemOption = { key?: string | null };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rl = await checkRateLimit(`assessment-answer:${user.id}`, 600, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Anfragen', retryAfterMs: rl.retryAfterMs }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  // 1) Ownership + Tier
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, user_id, status, product:products(tier), started_at, current_item_index')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!assessment) return NextResponse.json({ error: 'not found' }, { status: 404 });
  // Aktivierungssperre (serverseitig, nicht nur UI): nur freigeschaltete
  // Assessments dürfen Antworten annehmen. Blockiert insbesondere
  // 'awaiting_contract_confirmation' (Vertragsbestätigung ausstehend) sowie alle
  // Terminalzustände (completed/report_ready/archived). Ohne diese Prüfung könnte
  // ein eingeloggter Käufer die Bestätigungssperre über einen direkten API-Aufruf
  // umgehen.
  if (!isAssessmentActivated(assessment.status)) {
    return NextResponse.json({ error: 'assessment not activated' }, { status: 409 });
  }
  const tier = (assessment.product as any)?.tier;
  if (!tier) return NextResponse.json({ error: 'could not resolve tier' }, { status: 500 });

  // 2) Item laden + validieren — Lesen ab Migration 29 über service_role
  //    (items_read_auth ist entfernt; der Browser kann items nicht mehr direkt
  //    lesen). Ownership des Assessments ist oben bereits geprüft.
  const admin = createAdminClient();
  const { data: item } = await admin
    .from('items')
    .select('id, active, package_tiers, format, options, player_item')
    .eq('id', body.item_id)
    .maybeSingle();

  if (!item || !item.active) return NextResponse.json({ error: 'item invalid' }, { status: 400 });
  if (!Array.isArray(item.package_tiers) || !item.package_tiers.includes(tier)) {
    return NextResponse.json({ error: 'item not allowed for this tier' }, { status: 400 });
  }
  // Defense-in-depth: Spieler-Items (player_item=true) gehören ausschließlich in
  // den Einladungs-Flow (get_items_for_invitation, invitation_type='spieler') und
  // dürfen NIEMALS im Coach-Selbstassessment landen — auch nicht via crafted
  // Request. get_items_for_assessment liefert sie ab Migration 26 nicht mehr aus;
  // dieser Guard schließt den Schreibpfad.
  if (item.player_item === true) {
    return NextResponse.json({ error: 'item not allowed for this assessment' }, { status: 400 });
  }

  // 3) Format-spezifische Wertvalidierung — genau EIN Feld zählt.
  let valueNumeric: number | null = null;
  let valueChoice: string | null = null;
  let valuePosition: number | null = null;

  if (NUMERIC_FORMATS.has(item.format)) {
    const v = body.value_numeric;
    if (!Number.isInteger(v as number) || (v as number) < 1 || (v as number) > 5) {
      return NextResponse.json({ error: 'invalid numeric value (expected integer 1..5)' }, { status: 400 });
    }
    valueNumeric = v as number;
  } else if (POSITION_FORMATS.has(item.format)) {
    const v = body.value_position;
    if (typeof v !== 'number' || v < 0 || v > 1) {
      return NextResponse.json({ error: 'invalid position value (expected number 0..1)' }, { status: 400 });
    }
    valuePosition = v;
  } else if (CHOICE_FORMATS.has(item.format)) {
    const options = Array.isArray(item.options) ? (item.options as ItemOption[]) : [];
    const allowed = new Set(
      options.map((o) => (typeof o?.key === 'string' ? o.key : null)).filter((k): k is string => !!k),
    );
    if (allowed.size === 0) return NextResponse.json({ error: 'item has no defined options' }, { status: 500 });
    if (typeof body.value_choice !== 'string' || !allowed.has(body.value_choice)) {
      return NextResponse.json({ error: 'invalid choice value' }, { status: 400 });
    }
    valueChoice = body.value_choice;
  } else {
    return NextResponse.json({ error: `unsupported item format: ${item.format}` }, { status: 400 });
  }

  // 4) Antwort + Fortschritt serverseitig persistieren (Service-Role, nach
  //    explizitem Ownership-Check). status bleibt 'in_progress' — Abschluss
  //    ausschließlich über /finalize.
  const { error: upErr } = await admin.from('answers').upsert(
    {
      assessment_id: id,
      item_id: body.item_id,
      value_numeric: valueNumeric,
      value_choice: valueChoice,
      value_position: valuePosition,
    },
    { onConflict: 'assessment_id,item_id' },
  );
  if (upErr) return NextResponse.json({ error: 'could not save answer' }, { status: 500 });

  // Fortschritt + echte Aktivitätszeit serverseitig setzen. last_activity_at
  // wird bei JEDER Antwort gebumpt — daran erkennt der Resume-Reminder echte
  // Inaktivität (statt am created_at, das jemanden erinnern würde, der gerade
  // erst weitergearbeitet hat). status bleibt 'in_progress' — Abschluss nur
  // über /finalize.
  const update: Record<string, unknown> = {
    status: 'in_progress',
    last_activity_at: new Date().toISOString(),
  };
  if (typeof body.current_item_index === 'number') {
    update.current_item_index = body.current_item_index;
  }
  if (!assessment.started_at) update.started_at = new Date().toISOString();
  await admin.from('assessments').update(update).eq('id', id);

  return NextResponse.json({ ok: true });
}
