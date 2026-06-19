import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationForPurchase } from '@/lib/email/order-confirmation';
import { sendEmailSafe } from '@/lib/email/resend';
import { PROVIDER } from '@/lib/legal/provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Holt fehlgeschlagene/ausstehende Bestell-Bestätigungen nach.
 *
 * Schutz: Header `Authorization: Bearer <CRON_SECRET>`. Gedacht für einen
 * Scheduler (z. B. Vercel Cron) im Minuten-/Stundentakt. Ohne gesetztes
 * CRON_SECRET ist der Endpoint deaktiviert (503).
 *
 * Wählt bezahlte Käufe mit verknüpftem Assessment, ohne gesendete Bestätigung
 * und unter dem Versuchslimit; versendet idempotent über
 * sendOrderConfirmationForPurchase (setzt confirmation_sent_at bei Erfolg).
 */
const MAX_ATTEMPTS = 6;
const BATCH = 25;

async function run(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // (0) SELBSTHEILUNG der Verknüpfung: bezahlte Käufe OHNE assessment_id, deren
  //     Assessment aber (durch einen abgebrochenen Webhook) bereits existiert.
  //     Ohne Verknüpfung kann die Bestätigung nie versendet werden und der Kunde
  //     bliebe dauerhaft ohne Produkt. Hier die 1:1-gebundene Assessment-Zeile
  //     über purchase_id finden und die Verknüpfung nachziehen.
  let relinked = 0;
  const { data: orphanPurchases } = await admin
    .from('purchases')
    .select('id')
    .eq('status', 'paid')
    .is('assessment_id', null)
    .lt('confirmation_attempts', MAX_ATTEMPTS)
    .limit(BATCH);
  for (const p of orphanPurchases ?? []) {
    const { data: a } = await admin
      .from('assessments')
      .select('id')
      .eq('purchase_id', p.id)
      .maybeSingle();
    if (a?.id) {
      const { error: relErr } = await admin
        .from('purchases')
        .update({ assessment_id: a.id })
        .eq('id', p.id)
        .is('assessment_id', null);
      if (!relErr) relinked += 1;
    }
  }

  const { data: pending, error } = await admin
    .from('purchases')
    .select('id')
    .eq('status', 'paid')
    .is('confirmation_sent_at', null)
    .not('assessment_id', 'is', null)
    .lt('confirmation_attempts', MAX_ATTEMPTS)
    .order('paid_at', { ascending: true })
    .limit(BATCH);

  if (error) {
    return NextResponse.json({ error: 'query failed', detail: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let escalated = 0;
  for (const p of pending ?? []) {
    const res = await sendOrderConfirmationForPurchase(admin, p.id);
    if (res.ok) sent += 1;
    else if (!res.skipped) failed += 1;
  }

  // (Eskalation) Käufe, die das Versuchslimit erreicht haben und immer noch nicht
  // bestätigt sind, einmalig an den Betreiber melden, damit niemand still hängen
  // bleibt. admin_escalated_at verhindert Mehrfachmeldungen.
  const { data: stuckMax } = await admin
    .from('purchases')
    .select('id, order_number, confirmation_last_error, metadata')
    .eq('status', 'paid')
    .is('confirmation_sent_at', null)
    .gte('confirmation_attempts', MAX_ATTEMPTS)
    .is('admin_escalated_at', null)
    .limit(BATCH);
  for (const p of stuckMax ?? []) {
    const meta = (p.metadata ?? {}) as { stripe_customer_email?: string | null };
    const r = await sendEmailSafe({
      to: process.env.KONTAKT_EMAIL ?? PROVIDER.email,
      subject: `⚠️ Bestellbestätigung hängt nach ${MAX_ATTEMPTS} Versuchen (CC-${p.order_number ?? p.id})`,
      html: `<p>Eine bezahlte Bestellung konnte nach ${MAX_ATTEMPTS} Versuchen nicht bestätigt werden und braucht manuelle Prüfung.</p>
             <p>Kauf-ID: ${p.id}<br/>Bestellnummer: CC-${p.order_number ?? '—'}<br/>Kunde: ${meta.stripe_customer_email ?? '—'}<br/>Letzter Fehler: ${p.confirmation_last_error ?? '—'}</p>`,
      category: 'order-confirmation-escalation',
    });
    if (r.ok) {
      await admin.from('purchases').update({ admin_escalated_at: new Date().toISOString() }).eq('id', p.id);
      escalated += 1;
    }
  }

  // Selbstheilung (Szenario A): Bestätigung bereits versendet
  // (confirmation_sent_at gesetzt), aber das Assessment hängt noch im gesperrten
  // Zustand. Freischaltung läuft AUSSCHLIESSLICH über finalize_order_confirmation
  // (einzige Autorität; der DB-Trigger lässt awaiting→pending sonst nicht zu).
  let repaired = 0;
  const { data: stuck } = await admin
    .from('purchases')
    .select('id, assessment_id')
    .eq('status', 'paid')
    .not('confirmation_sent_at', 'is', null)
    .not('assessment_id', 'is', null)
    .limit(BATCH);
  for (const p of stuck ?? []) {
    if (!p.assessment_id) continue;
    // Nur reparieren, wenn das Assessment wirklich noch gesperrt ist.
    const { data: a } = await admin
      .from('assessments')
      .select('id, status')
      .eq('id', p.assessment_id)
      .maybeSingle();
    if (a?.status !== 'awaiting_contract_confirmation') continue;
    const { error: finErr } = await admin.rpc('finalize_order_confirmation', {
      p_purchase_id: p.id,
      p_assessment_id: p.assessment_id,
    });
    if (!finErr) repaired += 1;
  }

  return NextResponse.json({ attempted: (pending ?? []).length, sent, failed, relinked, repaired, escalated });
}

export async function POST(request: NextRequest) {
  return run(request);
}

// GET erlaubt, damit einfache Cron-Dienste (die nur GET können) funktionieren.
export async function GET(request: NextRequest) {
  return run(request);
}
