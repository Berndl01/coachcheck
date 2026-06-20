import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Saison-Berechtigung — bei JEDER schreibenden Saison-Aktion zu prüfen, nicht nur
 * beim Anlegen. Eine Saison ist nur berechtigt, wenn sie an einen bezahlten,
 * bestätigten, NICHT erstatteten Tier-5-Kauf gebunden und aktiv ist.
 *
 * Nach einem Refund (purchases.status = 'refunded') oder bei archivierter Saison
 * schlägt die Prüfung fehl → Cycle starten, Tokens erzeugen, schließen und auch
 * das Annehmen von Pulse-Antworten werden blockiert.
 *
 * Erwartet den ADMIN-Client (service_role), damit purchases/products zuverlässig
 * (RLS-unabhängig) gelesen werden.
 */
export type SeasonEntitlement =
  | { ok: true; season: { id: string; user_id: string; status: string; purchase_id: string } }
  | { ok: false; status: number; error: string };

export async function requireSeasonEntitlement(
  admin: SupabaseClient,
  seasonId: string,
  opts?: { ownerUserId?: string },
): Promise<SeasonEntitlement> {
  const { data: season } = await admin
    .from('seasons')
    .select('id, user_id, status, purchase_id, purchase:purchases(status, confirmation_sent_at, product:products(tier))')
    .eq('id', seasonId)
    .maybeSingle();

  if (!season) return { ok: false, status: 404, error: 'Saison nicht gefunden' };
  if (opts?.ownerUserId && (season as any).user_id !== opts.ownerUserId) {
    return { ok: false, status: 404, error: 'Saison nicht gefunden' };
  }
  if ((season as any).status !== 'active') {
    return { ok: false, status: 403, error: 'Saison ist nicht aktiv' };
  }
  if (!(season as any).purchase_id) {
    return { ok: false, status: 403, error: 'Saison ist keinem gültigen Kauf zugeordnet.' };
  }
  const purchase = (season as any).purchase;
  if (!purchase || purchase.status !== 'paid' || !purchase.confirmation_sent_at) {
    return { ok: false, status: 403, error: 'Der zugehörige Kauf ist nicht (mehr) gültig.' };
  }
  const tier = purchase.product?.tier ?? 0;
  if (tier < 5) {
    return { ok: false, status: 403, error: 'Der Saison-Monitor erfordert das Saison-Paket (Tier 5).' };
  }
  return {
    ok: true,
    season: {
      id: (season as any).id,
      user_id: (season as any).user_id,
      status: (season as any).status,
      purchase_id: (season as any).purchase_id,
    },
  };
}
