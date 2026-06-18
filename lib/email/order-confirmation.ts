import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmailSafe } from '@/lib/email/resend';
import { PROVIDER, providerAddressLine, VAT_NOTE, AGB_VERSION } from '@/lib/legal/provider';

/**
 * Bestell- und Vertragsbestätigung (FAGG, digitale Inhalte).
 *
 * Diese Mail ist der dauerhafte Datenträger nach dem Kauf: sie enthält die
 * vollständigen Vertragsdaten, den exakten Wortlaut der Widerruf-Zustimmung,
 * Consent-Version + -Zeitpunkt sowie die maßgebliche AGB-Fassung. Der Versand
 * wird auf der purchase-Zeile protokolliert (confirmation_sent_at/attempts/error)
 * und ist über den Retry-Endpoint nachholbar.
 *
 * WICHTIG: Ob diese Bestätigung die rechtliche Schwelle (z. B. Erlöschen des
 * Widerrufsrechts) erfüllt, ist eine anwaltliche Bewertung — nicht von diesem
 * Code zugesichert. Der Code stellt den Mechanismus bereit (Inhalt + zuverlässiger,
 * protokollierter Versand), nicht das Rechtsurteil.
 */

const EUR = (cents: number, currency: string) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: (currency || 'eur').toUpperCase() })
    .format((cents ?? 0) / 100);

const DT = (d: Date) =>
  new Intl.DateTimeFormat('de-AT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Vienna',
  }).format(d) + ' Uhr (MEZ/MESZ)';

/** Der exakte Wortlaut der Widerruf-Verzicht-Checkbox aus dem Checkout. */
export const WIDERRUF_CONSENT_TEXT =
  'Ich verlange ausdrücklich, dass CoachCheck schon vor Ablauf der 14-tägigen ' +
  'Widerrufsfrist mit der Bereitstellung des digitalen Inhalts beginnt. Mir ist ' +
  'bekannt, dass ich dadurch mit Beginn der Ausführung mein Widerrufsrecht verliere.';

export function buildOrderConfirmationEmail(p: {
  firstName: string;
  productName: string;
  orderNumber: string;
  purchaseId: string;
  purchasedAt: Date;
  amountCents: number;
  currency: string;
  consentVersion: string | null;
  consentAcceptedAt: Date | null;
  appUrl: string;
  assessmentId: string;
}): { subject: string; html: string } {
  const agbUrl = `${p.appUrl}/legal/agb`;
  const datenschutzUrl = `${p.appUrl}/legal/datenschutz`;
  const impressumUrl = `${p.appUrl}/legal/impressum`;
  const startUrl = `${p.appUrl}/assessment/${p.assessmentId}`;

  const row = (label: string, value: string) =>
    `<tr>
       <td style="padding:6px 0; color:#767471; font-size:13px; vertical-align:top; width:42%;">${label}</td>
       <td style="padding:6px 0; color:#1A1917; font-size:14px; vertical-align:top;">${value}</td>
     </tr>`;

  const consentLine = p.consentAcceptedAt
    ? `${DT(p.consentAcceptedAt)}${p.consentVersion ? ` · Fassung ${p.consentVersion}` : ''}`
    : (p.consentVersion ? `Fassung ${p.consentVersion}` : '—');

  const subject = `Deine Bestell- und Vertragsbestätigung · ${p.productName} (${p.orderNumber})`;

  const html = `
<div style="font-family:-apple-system,Segoe UI,sans-serif; max-width:600px; margin:0 auto; color:#1A1917; line-height:1.55;">
  <div style="padding:32px 24px 8px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#B38E45; margin-bottom:14px;">
      ✓ Zahlung erhalten
    </div>
    <h1 style="font-family:Georgia,serif; font-weight:300; font-size:30px; letter-spacing:-0.02em; line-height:1.12; margin:0 0 14px;">
      Schön, dass du da bist, ${p.firstName}.
    </h1>
    <p style="font-size:16px; margin:0 0 8px;">
      Dein <strong>${p.productName}</strong> ist freigeschaltet. Du kannst direkt loslegen —
      und unten findest du deine vollständige Bestell- und Vertragsbestätigung zum Aufbewahren.
    </p>
    <p style="margin:18px 0 28px;">
      <a href="${startUrl}" style="display:inline-block; background:#1A1917; color:#F4F1EC; text-decoration:none; padding:13px 22px; border-radius:999px; font-weight:600; font-size:15px;">
        Assessment starten →
      </a>
    </p>
  </div>

  <div style="background:#F0EEEA; border-radius:6px; padding:22px 22px 8px; margin:0 8px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#767471; margin-bottom:8px;">
      Bestell- und Vertragsbestätigung
    </div>
    <table style="width:100%; border-collapse:collapse;">
      ${row('Bestellnummer', p.orderNumber)}
      ${row('Bestelldatum', DT(p.purchasedAt))}
      ${row('Produkt', p.productName)}
      ${row('Bruttopreis', `${EUR(p.amountCents, p.currency)} <span style="color:#767471;">— ${VAT_NOTE}</span>`)}
      ${row('Zahlungsart', 'Kreditkarte (über Stripe)')}
      ${row('Vertragsreferenz', p.purchaseId)}
    </table>
    <div style="border-top:1px solid #DCD8D1; margin:14px 0 0; padding-top:12px;">
      <div style="font-size:13px; color:#767471; margin-bottom:4px;">Anbieter</div>
      <div style="font-size:14px;">
        ${PROVIDER.legalName}<br/>
        ${PROVIDER.person}<br/>
        ${providerAddressLine()}<br/>
        Tel.: ${PROVIDER.phone} · ${PROVIDER.email}<br/>
        <a href="${impressumUrl}" style="color:#B38E45;">Impressum</a>
      </div>
    </div>
  </div>

  <div style="padding:22px 24px 8px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#767471; margin-bottom:8px;">
      Widerruf &amp; digitale Leistung
    </div>
    <p style="font-size:14px; margin:0 0 10px;">
      Du hast beim Kauf ausdrücklich dem sofortigen Leistungsbeginn zugestimmt. Im Wortlaut:
    </p>
    <blockquote style="margin:0 0 12px; padding:10px 14px; background:#FAF8F4; border-left:3px solid #B38E45; font-size:13.5px; color:#3A3835;">
      „${WIDERRUF_CONSENT_TEXT}“
    </blockquote>
    <table style="width:100%; border-collapse:collapse;">
      ${row('Zustimmung dokumentiert', consentLine)}
      ${row('Maßgebliche AGB-Fassung', `Stand ${AGB_VERSION} — <a href="${agbUrl}" style="color:#B38E45;">AGB ansehen</a>`)}
    </table>
    <p style="font-size:13px; color:#767471; margin:12px 0 0;">
      Hinweis: Bei digitalen Inhalten erlischt das 14-tägige Widerrufsrecht, sobald die
      Ausführung mit deiner ausdrücklichen Zustimmung begonnen hat (FAGG). Widerrufsbelehrung
      und Muster-Widerrufsformular findest du in den
      <a href="${agbUrl}" style="color:#B38E45;">AGB</a>. Es gilt die zum Bestellzeitpunkt
      gültige AGB-Fassung.
    </p>
  </div>

  <div style="padding:8px 24px 28px;">
    <p style="font-size:12px; color:#9A9894; margin:18px 0 0; border-top:1px solid #ECE8E1; padding-top:14px;">
      Bewahre diese E-Mail als Vertragsbestätigung auf. Fragen? Antworte einfach auf diese
      Mail oder schreib an <a href="mailto:${PROVIDER.email}" style="color:#B38E45;">${PROVIDER.email}</a>.<br/>
      <a href="${datenschutzUrl}" style="color:#9A9894;">Datenschutz</a> ·
      <a href="${impressumUrl}" style="color:#9A9894;">Impressum</a>
    </p>
  </div>
</div>`.trim();

  return { subject, html };
}

/**
 * Lädt alle Daten zu einer Purchase, baut die Bestätigung und versendet sie —
 * idempotent und statusverfolgt. Wird vom Webhook und vom Retry-Endpoint genutzt.
 *
 * - Bereits gesendet (confirmation_sent_at gesetzt) → no-op, ok:true.
 * - Erfolg → confirmation_sent_at = now, attempts++.
 * - Fehler → attempts++, confirmation_last_error gesetzt, ok:false.
 *
 * Wirft NIE (sendEmailSafe wirft nicht); Rückgabe für Logging/Retry.
 */
export async function sendOrderConfirmationForPurchase(
  admin: SupabaseClient,
  purchaseId: string,
  opts?: { appUrl?: string; force?: boolean },
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const appUrl = opts?.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://coachcheck.humatrix.cc';

  const { data: purchase, error: pErr } = await admin
    .from('purchases')
    .select('id, user_id, product_id, assessment_id, amount_cents, currency, paid_at, created_at, order_number, confirmation_sent_at, confirmation_attempts, metadata, status')
    .eq('id', purchaseId)
    .single();

  if (pErr || !purchase) return { ok: false, error: 'purchase not found' };
  if (purchase.status !== 'paid') return { ok: false, skipped: true, error: 'not paid' };
  if (purchase.confirmation_sent_at && !opts?.force) return { ok: true, skipped: true };
  if (!purchase.assessment_id) return { ok: false, error: 'no assessment linked yet' };

  const [{ data: product }, { data: profile }, { data: consents }] = await Promise.all([
    admin.from('products').select('name_de').eq('id', purchase.product_id).single(),
    admin.from('profiles').select('full_name').eq('id', purchase.user_id).single(),
    admin.from('consent_records')
      .select('version, accepted_at, consent_type')
      .eq('user_id', purchase.user_id)
      .eq('source', 'checkout-consent')
      .order('accepted_at', { ascending: false })
      .limit(8),
  ]);

  const meta = (purchase.metadata ?? {}) as { stripe_customer_email?: string | null };
  const email = meta.stripe_customer_email ?? null;
  if (!email) {
    await admin.from('purchases')
      .update({
        confirmation_attempts: (purchase.confirmation_attempts ?? 0) + 1,
        confirmation_last_error: 'no recipient email on purchase',
      })
      .eq('id', purchase.id);
    return { ok: false, error: 'no recipient email' };
  }

  const widerruf = (consents ?? []).find((c) => c.consent_type === 'widerruf_verzicht')
    ?? (consents ?? [])[0] ?? null;

  const { subject, html } = buildOrderConfirmationEmail({
    firstName: profile?.full_name?.split(' ')[0] ?? 'Trainer',
    productName: product?.name_de ?? 'Dein Paket',
    orderNumber: purchase.order_number ? `CC-${purchase.order_number}` : `CC-${String(purchase.id).slice(0, 8).toUpperCase()}`,
    purchaseId: purchase.id,
    purchasedAt: new Date(purchase.paid_at ?? purchase.created_at ?? Date.now()),
    amountCents: purchase.amount_cents ?? 0,
    currency: purchase.currency ?? 'eur',
    consentVersion: widerruf?.version ?? null,
    consentAcceptedAt: widerruf?.accepted_at ? new Date(widerruf.accepted_at) : null,
    appUrl,
    assessmentId: purchase.assessment_id,
  });

  const res = await sendEmailSafe({ to: email, subject, html, category: 'order-confirmation' });

  if (res.ok) {
    await admin.from('purchases')
      .update({
        confirmation_sent_at: new Date().toISOString(),
        confirmation_attempts: (purchase.confirmation_attempts ?? 0) + 1,
        confirmation_last_error: null,
      })
      .eq('id', purchase.id);
    return { ok: true };
  }

  await admin.from('purchases')
    .update({
      confirmation_attempts: (purchase.confirmation_attempts ?? 0) + 1,
      confirmation_last_error: res.error ?? 'send failed',
    })
    .eq('id', purchase.id);
  return { ok: false, error: res.error ?? 'send failed' };
}
