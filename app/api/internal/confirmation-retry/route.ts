import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationForPurchase } from '@/lib/email/order-confirmation';

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
  for (const p of pending ?? []) {
    const res = await sendOrderConfirmationForPurchase(admin, p.id);
    if (res.ok) sent += 1;
    else if (!res.skipped) failed += 1;
  }

  return NextResponse.json({ attempted: (pending ?? []).length, sent, failed });
}

export async function POST(request: NextRequest) {
  return run(request);
}

// GET erlaubt, damit einfache Cron-Dienste (die nur GET können) funktionieren.
export async function GET(request: NextRequest) {
  return run(request);
}
