import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailSafe } from '@/lib/email/resend';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { PROVIDER, providerAddressLine } from '@/lib/legal/provider';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/widerruf — Online-Widerrufsfunktion (Pflicht ab 19.06.2026).
 *
 * Nimmt eine Widerrufserklärung entgegen, protokolliert den EINGANGSZEITPUNKT
 * (fristwahrend), bestätigt den Eingang auf einem dauerhaften Datenträger
 * (E-Mail) und benachrichtigt intern. Der Kauf wird best effort zugeordnet.
 *
 * WICHTIG (Ehrlichkeit): Dieser Endpoint ENTSCHEIDET NICHT über die Wirksamkeit
 * des Widerrufs. Bei digitalen Inhalten kann das Widerrufsrecht durch den beim
 * Kauf erklärten vorzeitigen Leistungsbeginn bereits erloschen sein. Die
 * Bestätigung sagt daher zu, dass der Eingang geprüft wird — sie verspricht
 * keine automatische Rückerstattung.
 */

const hash = (v: string | null | undefined) =>
  v ? createHash('sha256').update(v).digest('hex').slice(0, 32) : null;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
  if (confirm !== true) {
    return NextResponse.json({ error: 'Bitte bestätige die Widerrufserklärung.' }, { status: 400 });
  }

  // (4) Bot-Schutz.
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return NextResponse.json({ error: 'Bot-Schutz fehlgeschlagen. Bitte Seite neu laden und erneut senden.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const userAgent = request.headers.get('user-agent') ?? null;
  const { purchaseId, userId } = await resolvePurchase(admin, typeof order_ref === 'string' ? order_ref : null, email);

  // (5) Eingang protokollieren (Eingangszeitpunkt = received_at default now()).
  const { data: wd, error: insErr } = await admin
    .from('withdrawals')
    .insert({
      purchase_id: purchaseId,
      user_id: userId,
      full_name: String(full_name).slice(0, 200),
      email: String(email).slice(0, 200),
      order_ref: typeof order_ref === 'string' ? order_ref.slice(0, 120) : null,
      product_hint: typeof product_hint === 'string' ? product_hint.slice(0, 200) : null,
      declaration: typeof declaration === 'string' ? declaration.slice(0, 4000) : null,
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

  const receivedAt = new Intl.DateTimeFormat('de-AT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Vienna',
  }).format(new Date(wd.received_at)) + ' Uhr (MEZ/MESZ)';

  const ref = `WD-${String(wd.id).slice(0, 8).toUpperCase()}`;
  const firstName = String(full_name).split(' ')[0];

  // (6) Eingangsbestätigung an den Kunden (dauerhafter Datenträger).
  const customerHtml = `
<div style="font-family:-apple-system,'Segoe UI',sans-serif; max-width:560px; margin:0 auto; color:#1A1917; line-height:1.55;">
  <div style="padding:32px 24px 24px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#7A1F1F; margin-bottom:14px;">
      &#10003; Widerruf eingegangen
    </div>
    <h1 style="font-family:Georgia,serif; font-weight:300; font-size:28px; letter-spacing:-0.02em; line-height:1.15; margin:0 0 16px;">
      Wir haben deinen Widerruf erhalten, ${escapeHtml(firstName)}.
    </h1>
    <p style="font-size:16px; margin:0 0 18px;">
      Hiermit best&auml;tigen wir den Eingang deiner Widerrufserkl&auml;rung. Wir pr&uuml;fen sie und melden
      uns zeitnah bei dir. Bewahre diese E-Mail als Eingangsbest&auml;tigung auf.
    </p>
    <div style="background:#F0EEEA; border-left:3px solid #7A1F1F; padding:16px 18px; border-radius:4px; margin:0 0 22px;">
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:5px 0; color:#767471; width:42%;">Eingangszeitpunkt</td><td style="padding:5px 0;">${receivedAt}</td></tr>
        <tr><td style="padding:5px 0; color:#767471;">Vorgangsnummer</td><td style="padding:5px 0;">${ref}</td></tr>
        ${order_ref ? `<tr><td style="padding:5px 0; color:#767471;">Deine Bestellnummer</td><td style="padding:5px 0;">${escapeHtml(String(order_ref))}</td></tr>` : ''}
        <tr><td style="padding:5px 0; color:#767471;">Name</td><td style="padding:5px 0;">${escapeHtml(String(full_name))}</td></tr>
      </table>
    </div>
    <p style="font-size:13px; color:#767471; margin:0 0 8px;">
      Hinweis: Bei digitalen Inhalten kann das 14-t&auml;gige Widerrufsrecht bereits erloschen sein, wenn die
      Ausf&uuml;hrung mit deiner ausdr&uuml;cklichen Zustimmung begonnen hat (FAGG). Wir pr&uuml;fen deinen Fall
      individuell und informieren dich &uuml;ber das Ergebnis.
    </p>
    <p style="font-size:12px; color:#9A9894; margin:24px 0 0; border-top:1px solid #E6E3DD; padding-top:16px;">
      ${escapeHtml(PROVIDER.legalName)}<br/>
      ${escapeHtml(providerAddressLine())}<br/>
      <a href="mailto:${escapeHtml(PROVIDER.email)}" style="color:#B38E45;">${escapeHtml(PROVIDER.email)}</a>
    </p>
  </div>
</div>`.trim();

  const customerRes = await sendEmailSafe({
    to: email,
    subject: `Eingangsbestätigung deines Widerrufs · ${ref}`,
    html: customerHtml,
    category: 'withdrawal-confirm',
  });

  // (7) Interne Benachrichtigung.
  const recipient = process.env.KONTAKT_EMAIL ?? PROVIDER.email;
  const adminHtml = `
<div style="font-family:-apple-system,sans-serif; max-width:560px; margin:0 auto; color:#1A1917;">
  <h2 style="font-family:Georgia,serif; font-weight:300; margin:0 0 16px;">Neuer Widerruf eingegangen</h2>
  <table style="border-collapse:collapse; width:100%; font-size:14px;">
    <tr><td style="padding:6px 0; color:#767471; width:38%;">Vorgang</td><td style="padding:6px 0;"><strong>${ref}</strong></td></tr>
    <tr><td style="padding:6px 0; color:#767471;">Eingang</td><td style="padding:6px 0;">${receivedAt}</td></tr>
    <tr><td style="padding:6px 0; color:#767471;">Name</td><td style="padding:6px 0;">${escapeHtml(String(full_name))}</td></tr>
    <tr><td style="padding:6px 0; color:#767471;">E-Mail</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(String(email))}">${escapeHtml(String(email))}</a></td></tr>
    <tr><td style="padding:6px 0; color:#767471;">Bestellnummer</td><td style="padding:6px 0;">${order_ref ? escapeHtml(String(order_ref)) : '—'}</td></tr>
    <tr><td style="padding:6px 0; color:#767471;">Kauf zugeordnet</td><td style="padding:6px 0;">${purchaseId ? `ja (${purchaseId})` : 'nein — manuell prüfen'}</td></tr>
    ${product_hint ? `<tr><td style="padding:6px 0; color:#767471;">Produkt</td><td style="padding:6px 0;">${escapeHtml(String(product_hint))}</td></tr>` : ''}
  </table>
  ${declaration ? `<div style="margin-top:18px; padding:16px; background:#F0EEEA; border-left:3px solid #7A1F1F; border-radius:4px;"><div style="color:#767471; font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Erklärung</div><p style="margin:0; white-space:pre-wrap; font-size:14px;">${escapeHtml(String(declaration))}</p></div>` : ''}
  <p style="margin-top:20px; font-size:13px; color:#767471;">Reply-To ist auf den Kunden gesetzt.</p>
</div>`.trim();

  const adminRes = await sendEmailSafe({
    to: recipient,
    subject: `Widerruf: ${full_name} (${ref})${purchaseId ? '' : ' — nicht zugeordnet'}`,
    html: adminHtml,
    replyTo: email,
    category: 'withdrawal-admin',
  });

  // (8) Versandstatus protokollieren (best effort).
  await admin.from('withdrawals')
    .update({
      confirmation_sent_at: customerRes.ok ? new Date().toISOString() : null,
      admin_notified_at: adminRes.ok ? new Date().toISOString() : null,
    })
    .eq('id', wd.id);

  if (!adminRes.ok) console.warn('[widerruf] admin notify failed:', adminRes.error);
  if (!customerRes.ok) console.warn('[widerruf] customer confirm failed:', customerRes.error);

  return NextResponse.json({ ok: true, ref });
}
