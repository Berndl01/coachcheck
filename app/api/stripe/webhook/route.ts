import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const productId = session.metadata?.product_id;

    if (!userId || !productId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Create assessment
    const { data: assessment, error: aErr } = await admin
      .from('assessments')
      .insert({
        user_id: userId,
        product_id: parseInt(productId),
        status: 'pending',
      })
      .select()
      .single();

    if (aErr) {
      console.error('Assessment create error:', aErr);
      return NextResponse.json({ error: 'Assessment creation failed' }, { status: 500 });
    }

    // 2. Record purchase
    await admin.from('purchases').insert({
      user_id: userId,
      product_id: parseInt(productId),
      assessment_id: assessment.id,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? 'eur',
      status: 'paid',
      paid_at: new Date().toISOString(),
    });

    // TODO: Send confirmation email via Resend
  }

  return NextResponse.json({ received: true });
}
