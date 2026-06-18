import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DEV ONLY — legt ein Test-Assessment für ein beliebiges Paket an, ohne Stripe.
 *
 * In Produktion deaktiviert (NODE_ENV-Check).
 * Zugriff: POST /api/dev/create-assessment?slug=schnelltest
 *
 * Ab v3_30: spiegelt den echten Webhook-Pfad — es wird eine bezahlte
 * Test-Purchase angelegt und 1:1 mit dem Assessment verknüpft (purchase_id),
 * damit das Entitlement-Gate in Dev exakt wie in Produktion greift. Schreiben
 * läuft über die service_role (Browser-RLS lässt keine assessments-Writes mehr
 * zu — Migration 27).
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') ?? 'schnelltest';

  const admin = createAdminClient();

  const { data: product } = await admin
    .from('products')
    .select('id, price_cents')
    .eq('slug', slug)
    .single();

  if (!product) return NextResponse.json({ error: 'product not found' }, { status: 404 });

  // (1) Test-Purchase (paid) anlegen — wie der Webhook, nur ohne Stripe.
  const { data: purchase, error: pErr } = await admin
    .from('purchases')
    .insert({
      user_id: user.id,
      product_id: product.id,
      stripe_session_id: `dev_${crypto.randomUUID()}`,
      amount_cents: product.price_cents ?? 0,
      currency: 'eur',
      status: 'paid',
      paid_at: new Date().toISOString(),
      metadata: { source: 'dev-create-assessment' },
    })
    .select('id')
    .single();

  if (pErr || !purchase) {
    return NextResponse.json({ error: pErr?.message ?? 'purchase create failed' }, { status: 500 });
  }

  // (2) Assessment mit purchase_id-Bindung anlegen.
  const { data: assessment, error } = await admin
    .from('assessments')
    .insert({
      user_id: user.id,
      product_id: product.id,
      status: 'pending',
      purchase_id: purchase.id,
    })
    .select('id')
    .single();

  if (error || !assessment) {
    return NextResponse.json({ error: error?.message ?? 'assessment create failed' }, { status: 500 });
  }

  // (3) Gegenrichtung verknüpfen (Konsistenz mit Webhook).
  await admin.from('purchases').update({ assessment_id: assessment.id }).eq('id', purchase.id);

  return NextResponse.redirect(new URL(`/assessment/${assessment.id}`, request.url), 303);
}

// Allow GET too for convenience
export const GET = POST;
