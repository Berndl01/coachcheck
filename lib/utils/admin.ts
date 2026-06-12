import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'office@humatrix.cc')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

/**
 * Admin-Check: primär DB-gestützt (admin_roles), Fallback auf ADMIN_EMAILS,
 * damit der erste Owner ohne Seed-Eintrag reinkommt. Serverseitig verwenden.
 */
export async function isAdminUser(user: { id: string; email?: string | null } | null): Promise<boolean> {
  if (!user) return false;
  try {
    const { data } = await createAdminClient()
      .from('admin_roles').select('user_id').eq('user_id', user.id).maybeSingle();
    if (data) return true;
  } catch {
    /* Tabelle evtl. noch nicht migriert → Fallback */
  }
  return !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
}
