import { createClient } from '@supabase/supabase-js';

/**
 * Admin client with service_role key.
 * NEVER import this in client components or expose to the browser.
 * Use for: Stripe webhooks, anonymous invitation submissions, admin tasks.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
