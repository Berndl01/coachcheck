import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailSafe } from '@/lib/email/resend';
import { renderWithdrawalConfirmationEmail } from '@/lib/email/withdrawal-confirmation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Holt fehlgeschlagene Widerrufs-Eingangsbestätigungen nach.
 *
 * Schutz: Header `Authorization: Bearer <CRON_SECRET>` (gleicher Secret wie der
 * Bestell-Bestätigungs-Cron). Gedacht für einen Scheduler (Vercel Cron). Ohne
 * gesetztes CRON_SECRET ist der Endpoint deaktiviert (503).
 *
 * Wählt Widerrufe ohne gesendete Bestätigung, deren nächster Retry-Zeitpunkt
 * fällig ist und die unter dem Versuchslimit liegen; versendet die identische,
 * vollständige Eingangsbestätigung erneut (gleicher Baustein wie die Route).
 * Bei Erfolg wird confirmation_sent_at gesetzt; sonst werden Versuchszähler,
 * Fehlertext und nächster (exponentiell wachsender) Retry-Zeitpunkt gepflegt.
 */
const MAX_ATTEMPTS = 6;
const BATCH = 25;
const BASE_DELAY_MS = 5 * 60_000; // 5 Minuten Basis, danach exponentiell.

function nextRetryDelayMs(attempts: number): number {
  // attempts ist die Anzahl bereits erfolgter Versuche (>=1 hier).
  const factor = Math.min(2 ** attempts, 64); // Deckel bei 64×.
  return BASE_DELAY_MS * factor;
}

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
  const nowIso = new Date().toISOString();

  const { data: pending, error } = await admin
    .from('withdrawals')
    .select('id, full_name, email, order_ref, product_hint, declaration, declaration_full, received_at, confirmation_attempts')
    .is('confirmation_sent_at', null)
    .lt('confirmation_attempts', MAX_ATTEMPTS)
    .or(`confirmation_next_retry_at.is.null,confirmation_next_retry_at.lte.${nowIso}`)
    .order('received_at', { ascending: true })
    .limit(BATCH);

  if (error) {
    return NextResponse.json({ error: 'query failed', detail: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const wd of pending ?? []) {
    const ref = `WD-${String(wd.id).slice(0, 8).toUpperCase()}`;
    const firstName = String(wd.full_name ?? '').split(' ')[0] || 'Kunde';
    const receivedAtLabel =
      new Intl.DateTimeFormat('de-AT', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        timeZone: 'Europe/Vienna',
      }).format(new Date(wd.received_at)) + ' Uhr (MEZ/MESZ)';

    const confirmation = renderWithdrawalConfirmationEmail({
      ref,
      firstName,
      fullName: String(wd.full_name ?? ''),
      email: String(wd.email),
      orderRef: wd.order_ref ?? null,
      productHint: wd.product_hint ?? null,
      note: wd.declaration ?? null,
      receivedAtLabel,
    });

    const res = await sendEmailSafe({
      to: wd.email,
      subject: confirmation.subject,
      html: confirmation.html,
      category: 'withdrawal-confirm-retry',
    });

    const attemptsNow = (wd.confirmation_attempts ?? 0) + 1;
    if (res.ok) {
      const patch: Record<string, unknown> = {
        confirmation_sent_at: new Date().toISOString(),
        confirmation_attempts: attemptsNow,
        confirmation_last_error: null,
        confirmation_next_retry_at: null,
      };
      // Falls beim ersten Mal auch der vollständige Erklärungstext nicht
      // gespeichert wurde, jetzt nachziehen.
      if (!wd.declaration_full) patch.declaration_full = confirmation.declarationText;
      await admin.from('withdrawals').update(patch).eq('id', wd.id);
      sent += 1;
    } else {
      await admin.from('withdrawals')
        .update({
          confirmation_attempts: attemptsNow,
          confirmation_last_error: (res.error ?? 'send failed').slice(0, 500),
          confirmation_next_retry_at: new Date(Date.now() + nextRetryDelayMs(attemptsNow)).toISOString(),
        })
        .eq('id', wd.id);
      failed += 1;
    }
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
