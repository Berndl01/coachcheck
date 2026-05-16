import { createAdminClient } from '@/lib/supabase/admin';
import { bad, isValidTokenShape, ok, rateLimit } from '@/lib/utils/anon-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/invitations/[token]/open
 *
 * Markiert eine Invitation als geöffnet. Idempotent: wenn schon
 * 'opened' oder weiter, passiert nichts.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!isValidTokenShape(token)) return bad(400, 'Invalid token');

  const rl = rateLimit(`inv-open:${token}`, 20, 60_000);
  if (!rl.ok) return bad(429, 'Too many requests', { retryAfterMs: rl.retryAfterMs });

  const admin = createAdminClient();
  const { data: inv, error: selErr } = await admin
    .from('invitations')
    .select('id, status, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (selErr) return bad(500, 'DB error');
  if (!inv) return bad(404, 'Invitation not found');
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
