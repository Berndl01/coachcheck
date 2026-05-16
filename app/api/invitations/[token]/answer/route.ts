import { createAdminClient } from '@/lib/supabase/admin';
import { bad, isValidTokenShape, ok, rateLimit } from '@/lib/utils/anon-api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/invitations/[token]/answer
 *
 * Body: { item_id, value_numeric?, value_choice?, value_position? }
 *
 * Speichert eine Antwort eines anonymen Einschätzers (360° oder
 * TeamCheck-Spieler). Hartes serverseitiges Gate:
 *   - Token existiert, nicht expired, nicht completed
 *   - Item ist aktiv und im Tier des Eltern-Assessments
 *   - invitation_type (fremdbild/spieler) passt zu player_item-Flag
 *   - Antwortwert passt zum Item-Format und liegt im erlaubten Bereich
 *   - Choice-Antworten gehören zu einer der item.options[].key-Werte
 *   - Rate Limit pro Token (In-Memory pro Lambda; Upstash s. P1)
 */
const BodySchema = z.object({
  item_id: z.number().int().positive(),
  value_numeric: z.number().nullable().optional(),
  value_choice: z.string().max(120).nullable().optional(),
  value_position: z.number().min(0).max(1).nullable().optional(),
});

// Numerische Likert-/State-/Gap-Formate (1..5)
const NUMERIC_FORMATS = new Set([
  'likert_5',
  'state',
  'gap_wichtig',
  'gap_gelebt',
]);

// Spannungsfeld: kontinuierliche Position 0..1 (Slider)
const POSITION_FORMATS = new Set(['spannungsfeld']);

// Choice-Formate: value_choice muss in item.options[].key liegen
const CHOICE_FORMATS = new Set([
  'forced_choice',
  'szenario',
  'dilemma',
  'ranking',
]);

type ItemOption = { key?: string | null };

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!isValidTokenShape(token)) return bad(400, 'Invalid token');

  const rl = rateLimit(`inv-answer:${token}`, 200, 60_000);
  if (!rl.ok) return bad(429, 'Too many requests', { retryAfterMs: rl.retryAfterMs });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return bad(400, 'Invalid body');
  }

  const admin = createAdminClient();

  // 1) Token -> Invitation (inkl. Typ)
  const { data: inv, error: selErr } = await admin
    .from('invitations')
    .select('id, status, expires_at, parent_assessment_id, invitation_type')
    .eq('token', token)
    .maybeSingle();

  if (selErr) return bad(500, 'DB error');
  if (!inv) return bad(404, 'Invitation not found');
  if (new Date(inv.expires_at) < new Date()) return bad(410, 'Invitation expired');
  if (inv.status === 'completed') return bad(409, 'Invitation already completed');
  if (inv.status === 'expired') return bad(410, 'Invitation expired');

  // 2) Tier des Eltern-Assessments
  const { data: assessment, error: aErr } = await admin
    .from('assessments')
    .select('product_id')
    .eq('id', inv.parent_assessment_id)
    .maybeSingle();
  if (aErr || !assessment) return bad(500, 'Could not resolve assessment');

  const { data: product, error: pErr } = await admin
    .from('products')
    .select('tier')
    .eq('id', assessment.product_id)
    .maybeSingle();
  if (pErr || !product?.tier) return bad(500, 'Could not resolve product tier');

  const tier = product.tier;

  // 3) Item laden mit allen Validierungs-Feldern
  const { data: item, error: itemErr } = await admin
    .from('items')
    .select('id, active, package_tiers, format, options, player_item')
    .eq('id', body.item_id)
    .maybeSingle();

  if (itemErr) return bad(500, 'DB error');
  if (!item || !item.active) return bad(400, 'Item invalid');
  if (!Array.isArray(item.package_tiers) || !item.package_tiers.includes(tier)) {
    return bad(400, 'Item not allowed for this invitation');
  }

  // 4) Invitation-Typ vs. Item-Player-Flag
  // Spieler-Einladung darf nur Items mit player_item=true bekommen.
  // 360°-Einladung darf nur Items mit player_item=false (oder null) bekommen.
  if (inv.invitation_type === 'spieler' && item.player_item !== true) {
    return bad(400, 'Item not allowed for player invitation');
  }
  if (inv.invitation_type === 'fremdbild' && item.player_item === true) {
    return bad(400, 'Item not allowed for 360 invitation');
  }

  // 5) Format-spezifische Wertvalidierung
  // Wir normalisieren: jedes Item-Format erwartet GENAU ein Feld,
  // alles andere wird auf null gesetzt - egal was der Client geschickt hat.
  let valueNumeric: number | null = null;
  let valueChoice: string | null = null;
  let valuePosition: number | null = null;

  if (NUMERIC_FORMATS.has(item.format)) {
    if (
      !Number.isInteger(body.value_numeric) ||
      (body.value_numeric as number) < 1 ||
      (body.value_numeric as number) > 5
    ) {
      return bad(400, 'Invalid numeric value (expected integer 1..5)');
    }
    valueNumeric = body.value_numeric as number;
  } else if (POSITION_FORMATS.has(item.format)) {
    if (
      typeof body.value_position !== 'number' ||
      body.value_position < 0 ||
      body.value_position > 1
    ) {
      return bad(400, 'Invalid position value (expected number 0..1)');
    }
    valuePosition = body.value_position;
  } else if (CHOICE_FORMATS.has(item.format)) {
    const options = Array.isArray(item.options) ? (item.options as ItemOption[]) : [];
    const allowed = new Set(
      options
        .map((o) => (typeof o?.key === 'string' ? o.key : null))
        .filter((k): k is string => !!k),
    );
    if (allowed.size === 0) {
      return bad(500, 'Item has no defined options');
    }
    if (typeof body.value_choice !== 'string' || !allowed.has(body.value_choice)) {
      return bad(400, 'Invalid choice value');
    }
    valueChoice = body.value_choice;
  } else {
    return bad(400, `Unsupported item format: ${item.format}`);
  }

  // 6) Antwort speichern (upsert für Zurück-Navigation)
  const { error: upErr } = await admin.from('invitation_answers').upsert(
    {
      invitation_id: inv.id,
      item_id: body.item_id,
      value_numeric: valueNumeric,
      value_choice: valueChoice,
      value_position: valuePosition,
    },
    { onConflict: 'invitation_id,item_id' },
  );

  if (upErr) return bad(500, 'Could not save answer');
  return ok();
}
