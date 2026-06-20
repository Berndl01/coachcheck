import { createAdminClient } from '@/lib/supabase/admin';
import { requireSeasonEntitlement } from '@/lib/season/entitlement';
import { bad, isValidTokenShape, ok, rateLimit } from '@/lib/utils/anon-api';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/pulse/[token]/submit
 *
 * Body: { responses: [{ pulse_item_id, value_numeric }, ...] }
 *
 * Speichert Pulse-Antworten eines anonymen Spielers (Saison-Monitor).
 * Prüft serverseitig:
 *   - pulse_invitations: Token existiert, status='active', Season aktiv
 *   - genau ein offener pulse_cycle für die Season → dort einfügen
 *   - alle pulse_item_ids sind aktiv
 *   - Rate Limit pro Token
 *
 * Das Backend bestimmt cycle_id (nicht der Client) — verhindert
 * Submit auf alte/falsche Cycles.
 */
const BodySchema = z.object({
  responses: z
    .array(
      z.object({
        pulse_item_id: z.number().int().positive(),
        value_numeric: z.number().int().min(1).max(5),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!isValidTokenShape(token)) return bad(400, 'Invalid token');

  const rl = await checkRateLimit(`pulse-submit:${token}`, 10, 60_000);
  if (!rl.ok) return bad(429, 'Too many requests', { retryAfterMs: rl.retryAfterMs });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return bad(400, 'Invalid body');
  }

  const admin = createAdminClient();

  // 1) Token → Pulse-Invitation
  const { data: inv, error: invErr } = await admin
    .from('pulse_invitations')
    .select('id, status, season_id')
    .eq('token', token)
    .maybeSingle();

  if (invErr) return bad(500, 'DB error');
  if (!inv || inv.status !== 'active') return bad(404, 'Invitation not found or revoked');

  // Saison-Berechtigung prüfen: nur eine aktive, an einen bezahlten (nicht
  // erstatteten) Tier-5-Kauf gebundene Saison nimmt Pulse-Antworten an.
  const ent = await requireSeasonEntitlement(admin, inv.season_id);
  if (!ent.ok) return bad(ent.status === 404 ? 404 : 409, ent.error);
  const season = ent.season;

  // 2) Offenen Cycle der Season finden
  const { data: openCycle, error: cycErr } = await admin
    .from('pulse_cycles')
    .select('id, status, closes_at')
    .eq('season_id', season.id)
    .eq('status', 'open')
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cycErr) return bad(500, 'DB error');
  if (!openCycle) return bad(409, 'No open pulse cycle');
  if (new Date(openCycle.closes_at) < new Date()) return bad(410, 'Pulse cycle closed');

  // 3) Alle aktiven Pulse-Items laden — submitted muss == expected sein
  const { data: activeItems, error: activeErr } = await admin
    .from('pulse_items')
    .select('id')
    .eq('active', true);
  if (activeErr) return bad(500, 'DB error');

  const expectedIds = new Set((activeItems ?? []).map((i: any) => i.id as number));
  const submittedIds = new Set(body.responses.map((r) => r.pulse_item_id));

  if (expectedIds.size === 0) return bad(409, 'No active pulse items');
  if (submittedIds.size !== expectedIds.size) {
    return bad(400, 'Pulse incomplete', {
      expected: expectedIds.size,
      submitted: submittedIds.size,
    });
  }
  for (const id of expectedIds) {
    if (!submittedIds.has(id)) {
      return bad(400, 'Pulse incomplete', {
        expected: expectedIds.size,
        submitted: submittedIds.size,
      });
    }
  }
  for (const id of submittedIds) {
    if (!expectedIds.has(id)) {
      return bad(400, 'Unknown or inactive pulse item');
    }
  }

  // 4) Upsert
  const records = body.responses.map((r) => ({
    pulse_cycle_id: openCycle.id,
    pulse_item_id: r.pulse_item_id,
    value_numeric: r.value_numeric,
    respondent_token: token,
  }));

  const { error: upErr } = await admin
    .from('pulse_responses')
    .upsert(records, { onConflict: 'pulse_cycle_id,pulse_item_id,respondent_token' });

  if (upErr) return bad(500, 'Could not save responses');

  // Live-Antwortzähler aktualisieren (P0 Blocker 3): der Trainer sieht den Stand
  // sofort (1 → 5 → …) und erkennt, ob die Anonymitätsschwelle erreicht ist.
  // Best effort — ein Fehler hier darf die bereits gespeicherte Antwort nicht
  // verwerfen (beim Schließen wird ohnehin neu gezählt).
  let responseCount: number | null = null;
  try {
    const { data } = await admin.rpc('refresh_pulse_cycle_response_count', {
      cycle_uuid: openCycle.id,
    });
    if (typeof data === 'number') responseCount = data;
  } catch (err) {
    console.warn('[pulse-submit] response count refresh failed:', err);
  }

  return ok({ saved: records.length, responseCount });
}
