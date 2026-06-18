import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { recordConsent } from '@/lib/utils/audit';
import { CONSENT_VERSION } from '@/lib/constants/consent';
import { CONSENT_TEXTS } from '@/lib/legal/withdrawal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /checkout/[slug]/start
 *
 * Startet den Stripe-Checkout — ABER nur nach aktiver Zustimmung (P0 #4).
 * Der Consent wird hier (nicht beim bloßen Seitenaufruf) versioniert
 * gespeichert. Fehlt eine der drei Zustimmungen → kein Checkout.
 */
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

  // tier 4+ → Kontaktformular statt Stripe
  if (product.tier >= 4) {
    return NextResponse.redirect(new URL(`/kontakt?plan=${slug}`, request.url));
  }

  // --- Aktive Zustimmung prüfen ------------------------------------------
  const form = await request.formData();
  const checked = (key: string) => {
    const v = form.get(key);
    return v === 'on' || v === 'true' || v === '1';
  };
  const agbOk = checked('agb');
  const datenschutzOk = checked('datenschutz');
  const kiOk = checked('ki_verarbeitung');
  const widerrufOk = checked('widerruf_verzicht');

  if (!agbOk || !datenschutzOk || !kiOk || !widerrufOk) {
    // Ohne vollständige Zustimmung zurück zum Consent-Gate.
    return NextResponse.redirect(new URL(`/checkout/${slug}?consent=incomplete`, request.url), { status: 303 });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json({ error: 'Stripe/App-URL nicht konfiguriert' }, { status: 500 });
  }

  // --- Consent versioniert & nachweisbar speichern (DSGVO Art. 7) --------
  // Erst NACH aktiver Zustimmung. IP/UA werden in recordConsent gehasht.
  // Schlägt die Nachweis-Speicherung fehl, darf KEIN Checkout starten —
  // sonst gäbe es eine Zahlung ohne gesicherten Einwilligungsnachweis.
  //
  // checkout_attempt_id bindet die vier Consents eindeutig an GENAU diesen
  // Checkout-Vorgang. Dieselbe ID landet in den Stripe-Metadaten und später in
  // der Purchase, sodass die Bestätigung exakt die zu diesem Kauf gehörenden
  // Einwilligungen verwendet (nicht „die letzten N des Users").
  const checkoutAttemptId = randomUUID();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent') ?? null;
  const consentResults = await Promise.all(
    (['agb', 'datenschutz', 'ki_verarbeitung', 'widerruf_verzicht'] as const).map((consentType) =>
      recordConsent({
        userId: user.id,
        consentType,
        version: CONSENT_VERSION,
        ip,
        userAgent,
        source: 'checkout-consent',
        checkoutAttemptId,
        consentText: CONSENT_TEXTS[consentType] ?? null,
      }),
    ),
  );
  if (consentResults.some((ok) => !ok)) {
    return NextResponse.json(
      { error: 'Deine Zustimmung konnte gerade nicht gesichert gespeichert werden. Bitte versuche es in einem Moment erneut.' },
      { status: 503 },
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia' as any,
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
    // Stripe-Terms zusätzlich (ersetzt NICHT den eigenen KI-/Datenschutz-Consent).
    consent_collection: {
      terms_of_service: 'required',
    },
    custom_text: {
      terms_of_service_acceptance: {
        message: 'Ich akzeptiere die [AGB](https://coachcheck.humatrix.cc/legal/agb) und die [Datenschutzerklärung](https://coachcheck.humatrix.cc/legal/datenschutz).',
      },
    },
    billing_address_collection: 'required',
    allow_promotion_codes: true,
    metadata: {
      user_id: user.id,
      product_id: product.id.toString(),
      product_slug: product.slug,
      consent_version: CONSENT_VERSION,
      checkout_attempt_id: checkoutAttemptId,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}

// Direktes GET (ohne Zustimmung) führt zurück zum Consent-Gate.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return NextResponse.redirect(new URL(`/checkout/${slug}`, request.url), { status: 303 });
}
