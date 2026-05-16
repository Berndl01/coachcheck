import { createAdminClient } from '@/lib/supabase/admin';
import { bad, isValidTokenShape, ok, rateLimit } from '@/lib/utils/anon-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/invitations/[token]/complete
 *
 * Markiert eine Invitation als abgeschlossen.
 * Prüft:
 *   - Token gültig, nicht expired, nicht schon completed
 *   - ALLE für die Einladung erwarteten Items wurden beantwortet
 *
 * Wichtig: ein einzelner manipulierter "complete"-Call darf nicht
 * dazu führen, dass eine Einladung als "completed" gilt, obwohl
 * fast nichts beantwortet wurde. Die Aggregate-Funktionen zählen
 * completed Invitations - schwache Abschlussprüfung würde die
 * Aggregate-Aussagekraft sofort zerstören.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!isValidTokenShape(token)) return bad(400, 'Invalid token');

  const rl = rateLimit(`inv-complete:${token}`, 10, 60_000);
  if (!rl.ok) return bad(429, 'Too many requests', { retryAfterMs: rl.retryAfterMs });

  const admin = createAdminClient();

  // 1) Invitation laden
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

  // 2) Erwartete Items für diesen Token ermitteln (über Service-Role-RPC)
  const { data: expectedItems, error: itemsErr } = await admin.rpc(
    'get_items_for_invitation',
    { invitation_token: token },
  );
  if (itemsErr) return bad(500, 'Could not resolve invitation items');

  const expectedIds: number[] = Array.isArray(expectedItems)
    ? (expectedItems as Array<{ id: number }>).map((i) => i.id).filter((id): id is number => typeof id === 'number')
    : [];
  if (expectedIds.length === 0) return bad(400, 'No items available for this invitation');

  // 3) Anzahl tatsächlich beantworteter Items vergleichen
  const { count, error: cntErr } = await admin
    .from('invitation_answers')
    .select('id', { count: 'exact', head: true })
    .eq('invitation_id', inv.id)
    .in('item_id', expectedIds);

  if (cntErr) return bad(500, 'DB error');

  const submitted = count ?? 0;
  if (submitted < expectedIds.length) {
    return bad(400, 'Invitation incomplete', {
      expected: expectedIds.length,
      submitted,
    });
  }

  // 4) Abschluss markieren
  const { error: updErr } = await admin
    .from('invitations')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', inv.id);

  if (updErr) return bad(500, 'Could not complete invitation');
  return ok({ status: 'completed', expected: expectedIds.length, submitted });
}
