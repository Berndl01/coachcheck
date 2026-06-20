import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationForPurchase } from '@/lib/email/order-confirmation';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia' as any,
  });
}


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  // Event-Idempotenz: jedes Event genau einmal VOLLSTÄNDIG verarbeiten.
  // Abkürzung NUR, wenn der Status bereits 'processed' ist. Ein vorheriger,
  // unvollständig gebliebener Versuch (status 'received'/'error') darf vom
  // Stripe-Retry erneut (idempotent) verarbeitet werden — sonst bliebe ein
  // zahlender Kunde ohne Assessment, falls ein späterer Schritt einmal scheitert.
  {
    const eventAdmin = createAdminClient();
    const { error: evErr } = await eventAdmin
      .from('stripe_events')
      .insert({ event_id: event.id, type: event.type });
    if (evErr) {
      if ((evErr as { code?: string }).code === '23505') {
        const { data: existingEvent } = await eventAdmin
          .from('stripe_events')
          .select('status')
          .eq('event_id', event.id)
          .maybeSingle();
        if (existingEvent?.status === 'processed') {
          return NextResponse.json({ received: true, already_processed: true });
        }
        // sonst: vorheriger Versuch unvollständig → unten erneut idempotent verarbeiten.
      } else {
        // Log-Fehler darf die Verarbeitung nicht hart blockieren → nur warnen.
        console.warn('[stripe] event log insert failed:', evErr.message);
      }
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const productId = session.metadata?.product_id;
    const checkoutAttemptId = session.metadata?.checkout_attempt_id ?? null;
    const consentVersion = session.metadata?.consent_version ?? null;

    if (!userId || !productId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // Nur tatsächlich bezahlte Sessions verarbeiten. checkout.session.completed
    // kann (z.B. bei asynchronen Zahlarten) mit payment_status != 'paid' kommen
    // — dann kein 'paid'-Purchase und kein Assessment anlegen.
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, ignored: 'payment_status not paid' });
    }

    const admin = createAdminClient();

    // Stripe Webhooks können mehrfach (auch nahezu gleichzeitig) zugestellt
    // werden. Wir nutzen den UNIQUE-Constraint auf purchases.stripe_session_id
    // als atomare Idempotenz-Klammer: zuerst die Purchase einfügen (ohne
    // assessment_id), dann das Assessment, dann verlinken. Verliert ein
    // gleichzeitiger Redelivery die Race, scheitert er beim Purchase-Insert
    // mit 23505 und legt KEIN Assessment an.

    // (1) Purchase idempotent anlegen — bei Redelivery die bestehende holen,
    //     NICHT abbrechen (sonst würde ein evtl. fehlendes Assessment nie angelegt).
    let purchaseId: string | null = null;
    let assessmentId: string | null = null;
    const { data: purchase, error: purchaseError } = await admin
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: parseInt(productId),
        assessment_id: null,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? 'eur',
        status: 'paid',
        paid_at: new Date().toISOString(),
        // Bindung an den konkreten Checkout-Vorgang (Consent-Verknüpfung).
        checkout_attempt_id: checkoutAttemptId,
        consent_version: consentVersion,
        metadata: {
          stripe_customer_email: session.customer_email ?? session.customer_details?.email ?? null,
          payment_status: session.payment_status,
        },
      })
      .select('id, assessment_id')
      .single();

    if (purchaseError) {
      if ((purchaseError as { code?: string }).code === '23505') {
        // Redelivery: Purchase existiert bereits → holen und fortfahren (Selbstheilung).
        const { data: existing } = await admin
          .from('purchases')
          .select('id, assessment_id')
          .eq('stripe_session_id', session.id)
          .maybeSingle();
        purchaseId = existing?.id ?? null;
        assessmentId = existing?.assessment_id ?? null;
      } else {
        console.error('Purchase create error:', purchaseError);
        return NextResponse.json({ error: 'Purchase creation failed' }, { status: 500 });
      }
    } else {
      purchaseId = purchase.id;
      assessmentId = purchase.assessment_id ?? null;
    }

    // (2) Assessment nur anlegen, wenn noch keines verlinkt ist. So bleibt ein
    //     zahlender Kunde nie ohne Assessment — auch wenn ein früherer Versuch
    //     genau hier abgebrochen ist und Stripe das Event erneut zustellt.
    //
    //     WICHTIG (FAGG, dauerhafter Datenträger): Das Assessment startet als
    //     'awaiting_contract_confirmation' und wird ERST nach erfolgreich
    //     zugestellter Vertragsbestätigung auf 'pending' freigeschaltet
    //     (sendOrderConfirmationForPurchase → Statuswechsel). Scheitert der
    //     Versand, bleibt es gesperrt und der Retry-Lauf holt die Bestätigung
    //     (und damit die Freischaltung) nach — der Kunde wird also nicht
    //     dauerhaft ausgesperrt, aber die Leistung beginnt nicht vor der
    //     Bestätigung.
    if (!assessmentId) {
      // SELBSTHEILUNG: Ein früherer Versuch kann das Assessment bereits angelegt
      // haben, ist aber GENAU beim Verlinken (purchases.assessment_id) gescheitert.
      // Dann ist purchase.assessment_id null, das Assessment existiert aber schon
      // (mit purchase_id-Bindung + Unique-Index). Ein erneuter Insert würde am
      // Unique-Index scheitern → Endlosfehler. Deshalb ZUERST nach vorhandenem
      // Assessment für diese Purchase suchen und wiederverwenden.
      let resolvedAssessmentId: string | null = null;
      if (purchaseId) {
        const { data: orphan } = await admin
          .from('assessments')
          .select('id')
          .eq('purchase_id', purchaseId)
          .maybeSingle();
        resolvedAssessmentId = orphan?.id ?? null;
      }

      if (!resolvedAssessmentId) {
        const { data: assessment, error: aErr } = await admin
          .from('assessments')
          // purchase_id sofort setzen → 1:1-Bindung an die bezahlte Purchase
          // (Entitlement-Gate + Migration-27-Unique-Index). Ohne diese Bindung
          // bekäme ein Assessment keinen Premium-Report.
          .insert({
            user_id: userId,
            product_id: parseInt(productId),
            status: 'awaiting_contract_confirmation',
            purchase_id: purchaseId,
            last_activity_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (aErr || !assessment) {
          console.error('Assessment create error:', aErr);
          return NextResponse.json({ error: 'Assessment creation failed' }, { status: 500 });
        }
        resolvedAssessmentId = assessment.id;
      }

      assessmentId = resolvedAssessmentId;

      // Verlinkung ist beweis-/entitlement-relevant. Scheitert sie, NICHT nur
      // loggen: 500 zurückgeben, damit Stripe das Event erneut zustellt — beim
      // nächsten Lauf wird das (jetzt vorhandene) Assessment gefunden und die
      // Verknüpfung repariert, statt den Kunden dauerhaft ohne Produkt zu lassen.
      if (purchaseId) {
        const { error: linkErr } = await admin
          .from('purchases')
          .update({ assessment_id: assessmentId })
          .eq('id', purchaseId);
        if (linkErr) {
          console.error('Purchase/assessment link error (returning 500 for redelivery):', linkErr.message);
          return NextResponse.json({ error: 'Purchase/assessment link failed' }, { status: 500 });
        }
      }
    }

    // (3) Bestell- und Vertragsbestätigung (dauerhafter Datenträger, FAGG).
    //     Idempotent + statusverfolgt: die Funktion überspringt, wenn bereits
    //     gesendet, und heilt einen früher fehlgeschlagenen Versand bei
    //     Redelivery selbst. Scheitert der Versand, bleibt das Assessment
    //     dennoch nutzbar (kein zahlender Kunde wird ausgesperrt) — der offene
    //     Versand wird protokolliert und ist über den Retry-Endpoint nachholbar.
    if (assessmentId && purchaseId) {
      const conf = await sendOrderConfirmationForPurchase(admin, purchaseId);
      if (!conf.ok && !conf.skipped) {
        console.warn('[webhook] order confirmation not sent (will retry):', conf.error);
      }
    }
  }

  // --- Rückerstattung / Dispute → Berechtigung entziehen --------------------
  // Stripe sendet 'charge.refunded' AUCH bei Teilrückerstattungen. Wir entziehen
  // die Berechtigung nur bei VOLLER Rückerstattung (amount_refunded >= amount).
  // Disputes (charge.dispute.created) entziehen immer. Da das Entitlement-Gate
  // nur Status 'paid' akzeptiert, wird danach kein neuer Premium-Report erzeugt.
  if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
    const obj = event.data.object as {
      payment_intent?: string | null;
      amount?: number | null;
      amount_refunded?: number | null;
    };
    const paymentIntent = typeof obj.payment_intent === 'string' ? obj.payment_intent : null;
    const isFullRefund =
      event.type === 'charge.dispute.created' ||
      (typeof obj.amount === 'number' &&
        typeof obj.amount_refunded === 'number' &&
        obj.amount_refunded >= obj.amount);

    if (paymentIntent && isFullRefund) {
      const admin = createAdminClient();
      // 1) Kauf auf 'refunded'. Bei DB-Fehler: 500 zurückgeben, damit das Event
      //    NICHT als processed markiert wird → Stripe stellt erneut zu. Sonst bliebe
      //    der Kauf fälschlich 'paid' und die Berechtigung bestehen.
      const { data: refundedPurchases, error: refErr } = await admin
        .from('purchases')
        .update({ status: 'refunded' })
        .eq('stripe_payment_intent', paymentIntent)
        .select('id, assessment_id');
      if (refErr) {
        console.error('[webhook] refund status update failed:', refErr.message);
        return NextResponse.json({ error: 'Refund entitlement update failed' }, { status: 500 });
      }

      // 2a) Einladungs-Berechtigung mitziehen (P0 Blocker 1): bestehende
      //     Fremdbild-/TeamCheck-Einladungen des betroffenen Assessments
      //     deaktivieren (status='expired') und einen ggf. aktiven öffentlichen
      //     Share-Link sperren (share_enabled=false, share_token=null). Sonst
      //     blieben bereits verschickte Token-Links und die Profilkarte nach
      //     einem Refund weiter nutzbar. Fehler → 500 (Retry, idempotent).
      for (const p of refundedPurchases ?? []) {
        const assessmentId = (p as { assessment_id?: string | null }).assessment_id ?? null;
        if (!assessmentId) continue;

        const { error: invErr } = await admin
          .from('invitations')
          .update({ status: 'expired' })
          .eq('parent_assessment_id', assessmentId)
          .not('status', 'in', '(completed,expired)');
        if (invErr) {
          console.error('[webhook] expire invitations on refund failed:', invErr.message);
          return NextResponse.json({ error: 'Refund entitlement update failed' }, { status: 500 });
        }

        const { error: shareErr } = await admin
          .from('assessments')
          .update({ share_enabled: false, share_token: null })
          .eq('id', assessmentId);
        if (shareErr) {
          console.error('[webhook] disable share on refund failed:', shareErr.message);
          return NextResponse.json({ error: 'Refund entitlement update failed' }, { status: 500 });
        }
      }

      // 2b) Saison-Berechtigung mitziehen: zugehörige Saisons archivieren und deren
      //    Pulse-Einladungen widerrufen. Auch hier Fehler → 500 (Retry, idempotent).
      for (const p of refundedPurchases ?? []) {
        const { data: seasons, error: sErr } = await admin
          .from('seasons')
          .update({ status: 'archived', updated_at: new Date().toISOString() })
          .eq('purchase_id', p.id)
          .select('id');
        if (sErr) {
          console.error('[webhook] season archive on refund failed:', sErr.message);
          return NextResponse.json({ error: 'Refund entitlement update failed' }, { status: 500 });
        }
        for (const s of seasons ?? []) {
          const { error: invErr } = await admin
            .from('pulse_invitations')
            .update({ status: 'revoked' })
            .eq('season_id', s.id)
            .neq('status', 'revoked');
          if (invErr) {
            console.error('[webhook] revoke pulse invitations on refund failed:', invErr.message);
            return NextResponse.json({ error: 'Refund entitlement update failed' }, { status: 500 });
          }
        }
      }
    }
  }

  // Event als verarbeitet markieren (idempotent, best effort).
  try {
    await createAdminClient()
      .from('stripe_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('event_id', event.id);
  } catch { /* best effort */ }

  return NextResponse.json({ received: true });
}
