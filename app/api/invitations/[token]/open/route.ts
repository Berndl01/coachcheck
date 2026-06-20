import { createAdminClient } from '@/lib/supabase/admin';
import { bad, isValidTokenShape, ok } from '@/lib/utils/anon-api';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { requireActiveInvitationByToken } from '@/lib/auth/assessment-entitlement';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/invitations/[token]/open
 *
 * Markiert eine Invitation als geöffnet. Idempotent.
 *
 * P0 (v3.42): Prüft zusätzlich das Entitlement des Eltern-Assessments. Nach
 * einer Rückerstattung (purchase.status='refunded') oder bei nicht aktiviertem
 * Assessment wird der bestehende Token-Link abgelehnt.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!isValidTokenShape(token)) return bad(400, 'Invalid token');

  const rl = await checkRateLimit(`inv-open:${token}`, 20, 60_000);
  if (!rl.ok) return bad(429, 'Too many requests', { retryAfterMs: rl.retryAfterMs });

  const admin = createAdminClient();

  const ent = await requireActiveInvitationByToken(admin, token);
  if (!ent.ok) return bad(ent.status, ent.error);
  const inv = ent.invitation;

  if (new Date(inv.expires_at) < new Date()) return bad(410, 'Invitation expired');
  if (inv.status === 'completed') return ok({ status: 'completed' });
  if (inv.status === 'expired') return bad(410, 'Invitation expired');
  if (inv.status === 'opened') return ok({ status: 'opened' });

  const { error: updErr } = await admin
    .from('invitations')
    .update({ status: 'opened' })
    .eq('id', inv.id);

  if (updErr) return bad(500, 'Could not update invitation');
  return ok({ status: 'opened' });
}
