import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailSafe } from '@/lib/email/resend';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { PROVIDER } from '@/lib/legal/provider';
import {
  escapeHtml,
  renderWithdrawalConfirmationEmail,
} from '@/lib/email/withdrawal-confirmation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/widerruf — Online-Widerrufsfunktion.
 *
 * Nimmt eine Widerrufserklärung entgegen, protokolliert den EINGANGSZEITPUNKT
 * (fristwahrend), bestätigt den Eingang auf einem dauerhaften Datenträger
 * (E-Mail, inkl. vollständigem Erklärungsinhalt) und benachrichtigt intern.
 * Der Kauf wird best effort zugeordnet.
 *
 * WICHTIG (Ehrlichkeit): Dieser Endpoint ENTSCHEIDET NICHT über die Wirksamkeit
 * des Widerrufs. Bei digitalen Inhalten kann das Widerrufsrecht durch den beim
 * Kauf erklärten vorzeitigen Leistungsbeginn bereits erloschen sein. Die
 * Bestätigung sagt daher zu, dass der Eingang geprüft wird — sie verspricht
 * keine automatische Rückerstattung.
 *
 * Robustheit:
 *  - Mindestens eine Vertragsidentifikation (Bestellnummer ODER Produkt) ist
 *    Pflicht, damit der Widerruf einem Vertrag zugeordnet werden kann.
 *  - Schlägt die Kunden-Eingangsbestätigung fehl, wird sie NICHT als gesendet
 *    behauptet; stattdessen werden Retry-Felder gesetzt und der Cron versendet
 *    sie automatisch erneut (siehe app/api/internal/withdrawal-retry).
 */

const RETRY_BASE_DELAY_MS = 5 * 60_000; // 5 Minuten bis zum ersten Wiederholungsversuch.

const hash = (v: string | null | undefined) =>
  v ? createHash('sha256').update(v).digest('hex').slice(0, 32) : null;

async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Turnstile nicht konfiguriert → überspringen.
  if (typeof token !== 'string' || !token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(4000),
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}

/**
 * Versucht, den Kauf über die Bestellnummer (CC-####) zu finden und nur dann zu
 * verknüpfen, wenn die E-Mail zum Kauf passt (kein Binden an fremde Konten).
 */
async function resolvePurchase(
  admin: ReturnType<typeof createAdminClient>,
  orderRef: string | null,
  email: string,
): Promise<{ purchaseId: string | null; userId: string | null }> {
  if (!orderRef) return { purchaseId: null, userId: null };
  const digits = orderRef.replace(/[^0-9]/g, '');
  if (!digits) return { purchaseId: null, userId: null };
  const orderNumber = Number(digits);
  if (!Number.isFinite(orderNumber)) return { purchaseId: null, userId: null };

  const { data: purchase } = await admin
    .from('purchases')
    .select('id, user_id, metadata')
    .eq('order_number', orderNumber)
    .maybeSingle();
  if (!purchase) return { purchaseId: null, userId: null };

  const meta = (purchase.metadata ?? {}) as { stripe_customer_email?: string | null };
  const purchaseEmail = (meta.stripe_customer_email ?? '').toLowerCase();

  let profileEmail = '';
  if (purchase.user_id) {
    const { data: profile } = await admin
      .from('profiles').select('email').eq('id', purchase.user_id).maybeSingle();
    profileEmail = ((profile as { email?: string } | null)?.email ?? '').toLowerCase();
  }

  const matches = email.toLowerCase() === purchaseEmail || email.toLowerCase() === profileEmail;
  if (!matches) return { purchaseId: null, userId: null };
  return { purchaseId: purchase.id, userId: purchase.user_id ?? null };
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges Request-Format' }, { status: 400 });
  }
  const { full_name, email, order_ref, product_hint, declaration, confirm, website, turnstileToken } = body ?? {};

  // (1) Honeypot.
  if (typeof website === 'string' && website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  // (2) Rate-Limit pro IP.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = await checkRateLimit(`widerruf:ip:${ip}`, 8, 600_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte versuche es später erneut.', retryAfterMs: rl.retryAfterMs }, { status: 429 });
  }

  // (3) Pflichtfelder + eindeutige Widerrufserklärung.
  if (!full_name || !email) {
    return NextResponse.json({ error: 'Name und E-Mail sind erforderlich.' }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 });
  }

  // (3a) Vertragsidentifikation ist Pflicht: mindestens Bestellnummer ODER Produkt.
  const orderRefStr = typeof order_ref === 'string' ? order_ref.trim() : '';
  const productHintStr = typeof product_hint === 'string' ? product_hint.trim() : '';
  if (!orderRefStr && !productHintStr) {
    return NextResponse.json(
      { error: 'Bitte gib zur Identifizierung deines Vertrags mindestens deine Bestellnummer oder das gekaufte Produkt an.' },
      { status: 400 },
    );
  }

  if (confirm !== true) {
    return NextResponse.json({ error: 'Bitte bestätige die Widerrufserklärung.' }, { status: 400 });
  }

  // (4) Bot-Schutz.
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return NextResponse.json({ error: 'Bot-Schutz fehlgeschlagen. Bitte Seite neu laden und erneut senden.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const userAgent = request.headers.get('user-agent') ?? null;
  const { purchaseId, userId } = await resolvePurchase(admin, orderRefStr || null, email);

  const noteStr = typeof declaration === 'string' ? declaration.slice(0, 4000) : null;

  // (5) Eingang protokollieren (Eingangszeitpunkt = received_at default now()).
  const { data: wd, error: insErr } = await admin
    .from('withdrawals')
    .insert({
      purchase_id: purchaseId,
      user_id: userId,
      full_name: String(full_name).slice(0, 200),
      email: String(email).slice(0, 200),
      order_ref: orderRefStr ? orderRefStr.slice(0, 120) : null,
      product_hint: productHintStr ? productHintStr.slice(0, 200) : null,
      declaration: noteStr,
      ip_hash: hash(ip),
      user_agent_hash: hash(userAgent),
      status: 'received',
    })
    .select('id, received_at')
    .single();

  if (insErr || !wd) {
    console.error('[widerruf] insert failed:', insErr?.message);
    return NextResponse.json({ error: 'Dein Widerruf konnte gerade nicht gespeichert werden. Bitte versuche es in einem Moment erneut oder schreib an office@humatrix.cc.' }, { status: 503 });
  }

  const receivedAtLabel = new Intl.DateTimeFormat('de-AT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Vienna',
  }).format(new Date(wd.received_at)) + ' Uhr (MEZ/MESZ)';

  const ref = `WD-${String(wd.id).slice(0, 8).toUpperCase()}`;
  const firstName = String(full_name).split(' ')[0];

  // (6) Eingangsbestätigung an den Kunden — enthält den vollständigen
  //     Erklärungsinhalt (Pflicht: Inhalt, Datum und Uhrzeit der Erklärung).
  const confirmation = renderWithdrawalConfirmationEmail({
    ref,
    firstName,
    fullName: String(full_name),
    email: String(email),
    orderRef: orderRefStr || null,
    productHint: productHintStr || null,
    note: noteStr,
    receivedAtLabel,
  });

  // (6a) Vollständigen Erklärungstext nachweisrelevant speichern.
  const { error: declErr } = await admin.from('withdrawals')
    .update({ declaration_full: confirmation.declarationText })
    .eq('id', wd.id);
  if (declErr) {
    // Eingang ist bereits gespeichert (fristwahrend). Den Volltext zieht der
    // Retry-Cron nötigenfalls nach — aber wir ignorieren den Fehler nicht.
    console.warn('[widerruf] declaration_full speichern fehlgeschlagen:', declErr.message);
  }

  const customerRes = await sendEmailSafe({
    to: email,
    subject: confirmation.subject,
    html: confirmation.html,
    category: 'withdrawal-confirm',
  });

  // (7) Interne Benachrichtigung.
  const recipient = process.env.KONTAKT_EMAIL ?? PROVIDER.email;
  const adminHtml = `
<div style="font-family:-apple-system,sans-serif; max-width:560px; margin:0 auto; color:#1A1917;">
  <h2 style="font-family:Georgia,serif; font-weight:300; margin:0 0 16px;">Neuer Widerruf eingegangen</h2>
  <table style="border-collapse:collapse; width:100%; font-size:14px;">
    <tr><td style="padding:6px 0; color:#767471; width:38%;">Vorgang</td><td style="padding:6px 0;"><strong>${ref}</strong></td></tr>
    <tr><td style="padding:6px 0; color:#767471;">Eingang</td><td style="padding:6px 0;">${receivedAtLabel}</td></tr>
    <tr><td style="padding:6px 0; color:#767471;">Name</td><td style="padding:6px 0;">${escapeHtml(String(full_name))}</td></tr>
    <tr><td style="padding:6px 0; color:#767471;">E-Mail</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(String(email))}">${escapeHtml(String(email))}</a></td></tr>
    <tr><td style="padding:6px 0; color:#767471;">Bestellnummer</td><td style="padding:6px 0;">${orderRefStr ? escapeHtml(orderRefStr) : '—'}</td></tr>
    <tr><td style="padding:6px 0; color:#767471;">Kauf zugeordnet</td><td style="padding:6px 0;">${purchaseId ? `ja (${purchaseId})` : 'nein — manuell prüfen'}</td></tr>
    ${productHintStr ? `<tr><td style="padding:6px 0; color:#767471;">Produkt</td><td style="padding:6px 0;">${escapeHtml(productHintStr)}</td></tr>` : ''}
  </table>
  <div style="margin-top:18px; padding:16px; background:#F0EEEA; border-left:3px solid #7A1F1F; border-radius:4px;"><div style="color:#767471; font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Vollständige Erklärung</div><p style="margin:0; white-space:pre-wrap; font-size:14px;">${escapeHtml(confirmation.declarationText)}</p></div>
  <p style="margin-top:20px; font-size:13px; color:#767471;">Reply-To ist auf den Kunden gesetzt.</p>
</div>`.trim();

  const adminRes = await sendEmailSafe({
    to: recipient,
    subject: `Widerruf: ${full_name} (${ref})${purchaseId ? '' : ' — nicht zugeordnet'}`,
    html: adminHtml,
    replyTo: email,
    category: 'withdrawal-admin',
  });

  // (8) Versandstatus protokollieren. Bei fehlgeschlagener Kundenbestätigung
  //     KEINE Sende-Behauptung — stattdessen Retry-Felder setzen, der Cron
  //     versendet automatisch erneut.
  const nowIso = new Date().toISOString();
  let statusErr: { message: string } | null = null;
  if (customerRes.ok) {
    const { error } = await admin.from('withdrawals')
      .update({
        confirmation_sent_at: nowIso,
        admin_notified_at: adminRes.ok ? nowIso : null,
        confirmation_last_error: null,
        confirmation_next_retry_at: null,
      })
      .eq('id', wd.id);
    statusErr = error;
  } else {
    console.warn('[widerruf] customer confirm failed, scheduling retry:', customerRes.error);
    const { error } = await admin.from('withdrawals')
      .update({
        admin_notified_at: adminRes.ok ? nowIso : null,
        confirmation_attempts: 1,
        confirmation_last_error: (customerRes.error ?? 'send failed').slice(0, 500),
        confirmation_next_retry_at: new Date(Date.now() + RETRY_BASE_DELAY_MS).toISOString(),
      })
      .eq('id', wd.id);
    statusErr = error;
  }
  if (statusErr) console.warn('[widerruf] Versandstatus speichern fehlgeschlagen:', statusErr.message);

  if (!adminRes.ok) console.warn('[widerruf] admin notify failed:', adminRes.error);

  // Der Eingang ist gespeichert und fristwahrend protokolliert (ok:true). Ob die
  // Bestätigungs-E-Mail bereits raus ist, wird ehrlich zurückgemeldet, damit die
  // UI nicht fälschlich einen Versand behauptet.
  return NextResponse.json({ ok: true, ref, confirmationEmailSent: customerRes.ok });
}
