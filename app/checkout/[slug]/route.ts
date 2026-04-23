import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/login?redirectTo=/checkout/${slug}`, request.url));
  }

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!product || error) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // tier 4+5 → Kontaktformular statt Stripe
  if (product.tier >= 4) {
    return NextResponse.redirect(new URL(`/kontakt?plan=${slug}`, request.url));
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Humatrix Coach · ${product.name_de}`,
            description: product.description ?? undefined,
          },
          unit_amount: product.price_cents,
        },
        quantity: 1,
      },
    ],
    customer_email: user.email,
    // DSGVO / ECG: ausdrückliche Zustimmung zu AGB & Rechnungsadresse erfassen
    consent_collection: {
      terms_of_service: 'required',
    },
    custom_text: {
      terms_of_service_acceptance: {
        message: 'Ich akzeptiere die [AGB](https://coachcheck.humatrix.cc/legal/agb) und die [Datenschutzerklärung](https://coachcheck.humatrix.cc/legal/datenschutz).',
      },
    },
    // Rechnungsadresse für Rechnungsstellung
    billing_address_collection: 'required',
    // Automatische Steuerberechnung kann später aktiviert werden
    // automatic_tax: { enabled: true },
    metadata: {
      user_id: user.id,
      product_id: product.id.toString(),
      product_slug: product.slug,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}

export const GET = POST;
