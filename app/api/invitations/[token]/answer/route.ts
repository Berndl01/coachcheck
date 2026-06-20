import { createAdminClient } from '@/lib/supabase/admin';
import { bad, isValidTokenShape, ok } from '@/lib/utils/anon-api';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { requireActiveInvitationByToken } from '@/lib/auth/assessment-entitlement';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/invitations/[token]/answer
 *
 * Speichert eine Antwort eines anonymen Einschätzers (360° oder TeamCheck).
 * Hartes serverseitiges Gate (u. a.):
 *   - Token existiert, Eltern-Assessment AKTIVIERT + BEZAHLT + NICHT erstattet
 *     (P0 v3.42: zentrales Entitlement, sperrt Token nach Refund)
 *   - Token nicht expired, nicht completed
 *   - Item ist aktiv und im Tier des Eltern-Assessments
 *   - invitation_type (fremdbild/spieler) passt zum player_item-Flag
 *   - Antwortwert passt zum Item-Format und Bereich
 */
const BodySchema = z.object({
  item_id: z.number().int().positive(),
  value_numeric: z.number().nullable().optional(),
  value_choice: z.string().max(120).nullable().optional(),
  value_position: z.number().min(0).max(1).nullable().optional(),
});

const NUMERIC_FORMATS = new Set(['likert_5', 'state', 'gap_wichtig', 'gap_gelebt']);
const POSITION_FORMATS = new Set(['spannungsfeld']);
const CHOICE_FORMATS = new Set(['forced_choice', 'szenario', 'dilemma', 'ranking']);

type ItemOption = { key?: string | null };

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!isValidTokenShape(token)) return bad(400, 'Invalid token');

  const rl = await checkRateLimit(`inv-answer:${token}`, 200, 60_000);
  if (!rl.ok) return bad(429, 'Too many requests', { retryAfterMs: rl.retryAfterMs });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return bad(400, 'Invalid body');
  }

  const admin = createAdminClient();

  // 1) Token -> Invitation + Entitlement (inkl. Tier des Eltern-Assessments)
  const ent = await requireActiveInvitationByToken(admin, token);
  if (!ent.ok) return bad(ent.status, ent.error);
  const inv = ent.invitation;
  const tier = ent.tier;

  if (new Date(inv.expires_at) < new Date()) return bad(410, 'Invitation expired');
  if (inv.status === 'completed') return bad(409, 'Invitation already completed');
  if (inv.status === 'expired') return bad(410, 'Invitation expired');

  // 2) Item laden mit allen Validierungs-Feldern
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

  // 3) Invitation-Typ vs. Item-Player-Flag
  if (inv.invitation_type === 'spieler' && item.player_item !== true) {
    return bad(400, 'Item not allowed for player invitation');
  }
  if (inv.invitation_type === 'fremdbild' && item.player_item === true) {
    return bad(400, 'Item not allowed for 360 invitation');
  }

  // 4) Format-spezifische Wertvalidierung
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

  // 5) Antwort speichern (upsert für Zurück-Navigation)
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
