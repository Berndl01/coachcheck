import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailSafe } from '@/lib/email/resend';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });
}

function welcomeEmailHtml(params: {
  firstName: string;
  productName: string;
  appUrl: string;
  assessmentId: string;
}) {
  const { firstName, productName, appUrl, assessmentId } = params;
  return `
<div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 560px; margin: 0 auto; color: #1A1917; line-height: 1.55;">
  <div style="padding: 32px 24px 24px;">
    <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #B38E45; margin-bottom: 14px;">
      ✓ Freigeschaltet
    </div>
    <h1 style="font-family: Georgia, serif; font-weight: 300; font-size: 34px; letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 16px;">
      Willkommen, ${firstName}.
    </h1>
    <p style="font-size: 16px; margin: 0 0 24px;">
      Dein <strong>${productName}</strong> ist bereit. Du hast jetzt vollen Zugriff auf dein persönliches Coach-Assessment.
    </p>

    <div style="background: #F0EEEA; border-left: 4px solid #B38E45; padding: 18px 20px; border-radius: 4px; margin: 0 0 28px;">
      <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #767471; margin-bottom: 10px;">
        So geht es weiter
      </div>
      <ol style="margin: 0; padding-left: 20px; font-size: 15px;">
        <li style="margin-bottom: 8px;">Profil kurz vervollständigen — auf welchem Niveau trainierst du, welche Altersklasse?</li>
        <li style="margin-bottom: 8px;">Assessment durchmachen — ca. 10–15 Minuten, am besten in Ruhe.</li>
        <li style="margin-bottom: 0;">Dein Report wird erstellt und ist sofort verfügbar — inklusive PDF zum Download.</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 0 0 32px;">
      <a href="${appUrl}/assessment/${assessmentId}"
         style="display: inline-block; background: #1A1917; color: #F5F3EE; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Jetzt starten →
      </a>
    </div>

    <p style="font-family: Georgia, serif; font-style: italic; color: #767471; font-size: 15px; margin: 0 0 10px;">
      Ein Tipp: Sei bei den Fragen ehrlich — du beantwortest sie für dich selbst.
      Der Report ist dann präzise, wenn die Daten echt sind.
    </p>

    <p style="font-size: 13px; color: #767471; margin: 32px 0 0; border-top: 1px solid #E6E3DD; padding-top: 18px;">
      Fragen? Antworte einfach auf diese Mail oder schreib an
      <a href="mailto:office@humatrix.cc" style="color: #B38E45;">office@humatrix.cc</a>.<br>
      Humatrix by Bernhard Lampl · Ried 80 · 6363 Westendorf · Tirol
    </p>
  </div>
</div>
`;
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const productId = session.metadata?.product_id;

    if (!userId || !productId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const admin = createAdminClient();

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

    // Welcome-Email versenden (fehlerrobust — blockiert nicht)
    try {
      const { data: profile } = await admin
        .from('profiles').select('full_name').eq('id', userId).single();
      const { data: product } = await admin
        .from('products').select('name_de').eq('id', parseInt(productId)).single();

      const email = session.customer_email ?? session.customer_details?.email;
      if (email) {
        const firstName = profile?.full_name?.split(' ')[0] ?? 'Trainer';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coachcheck.humatrix.cc';
        await sendEmailSafe({
          to: email,
          subject: `Willkommen bei Humatrix Coach — ${product?.name_de ?? 'dein Assessment'} ist freigeschaltet`,
          html: welcomeEmailHtml({
            firstName,
            productName: product?.name_de ?? 'Dein Paket',
            appUrl,
            assessmentId: assessment.id,
          }),
        });
      }
    } catch (err) {
      console.warn('[webhook] Welcome email failed but checkout ok:', err);
    }
  }

  return NextResponse.json({ received: true });
}
