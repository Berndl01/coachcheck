import type { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { sendEmailSafe } from '@/lib/email/resend';
import { PROVIDER, AGB_VERSION } from '@/lib/legal/provider';
import {
  WIDERRUF_CONSENT_TEXT,
  buildContractSnapshot,
  flattenConsentText,
  type ContractSnapshot,
} from '@/lib/legal/withdrawal';

/**
 * Bestell- und Vertragsbestätigung (FAGG, digitale Inhalte).
 *
 * Diese Mail ist der dauerhafte Datenträger nach dem Kauf. Sie enthält die
 * vollständigen Vertragsdaten, die § 4 FAGG-Vertragsbedingungen (Hauptmerkmale,
 * Bereitstellung, Gewährleistung, Funktionalität/Kompatibilität, Nutzung/
 * Haftung), den exakten Wortlaut der vier Zustimmungen, die VOLLSTÄNDIGE
 * Widerrufsbelehrung und das Muster-Widerrufsformular direkt im Text (nicht nur
 * als Link) sowie eine prominente Online-Widerrufsfunktion. Zusätzlich wird das
 * vollständige Vertragsdokument als unveränderbares PDF angehängt (Inhaltshash
 * wird auf der Purchase gespeichert).
 *
 * Gerendert wird AUS dem unveränderbaren Vertrags-Snapshot, der beim Kauf
 * gespeichert wurde. So entspricht die Mail exakt der zum Bestellzeitpunkt
 * geltenden Fassung — auch wenn AGB-Texte später geändert werden.
 *
 * WICHTIG: Ob diese Bestätigung die rechtliche Schwelle (z. B. Erlöschen des
 * Widerrufsrechts) erfüllt, ist eine anwaltliche Bewertung — nicht von diesem
 * Code zugesichert. Der Code stellt den Mechanismus bereit (vollständiger
 * Inhalt + zuverlässiger, protokollierter, transaktional freigeschalteter
 * Versand), nicht das Rechtsurteil.
 */

// Re-Export für Bestandscode/Tests, die den Wortlaut hier importieren.
export { WIDERRUF_CONSENT_TEXT };

const EUR = (cents: number, currency: string) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: (currency || 'eur').toUpperCase() })
    .format((cents ?? 0) / 100);

const DT = (iso: string | Date) =>
  new Intl.DateTimeFormat('de-AT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Vienna',
  }).format(typeof iso === 'string' ? new Date(iso) : iso) + ' Uhr (MEZ/MESZ)';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escapter, zeilenerhaltender Klartextblock (für Belehrung/Formular). */
function pre(text: string): string {
  return `<div style="white-space:pre-wrap; font-size:13px; line-height:1.55; color:#3A3835; background:#FAF8F4; border:1px solid #ECE8E1; border-radius:6px; padding:14px 16px; margin:0 0 4px;">${esc(text)}</div>`;
}

/** Einzelner §-4-Bedingungsblock (fett-Label + Absatz). */
function term(label: string, body: string): string {
  return `<p style="font-size:13.5px; margin:0 0 10px;"><strong>${esc(label)}:</strong> ${esc(body)}</p>`;
}

/**
 * Baut die vollständige Bestell-/Vertragsbestätigung aus dem Snapshot.
 */
export function buildOrderConfirmationEmail(p: {
  firstName: string;
  appUrl: string;
  assessmentId: string;
  snapshot: ContractSnapshot;
}): { subject: string; html: string } {
  const s = p.snapshot;
  const agbUrl = `${p.appUrl}/legal/agb`;
  const datenschutzUrl = `${p.appUrl}/legal/datenschutz`;
  const impressumUrl = `${p.appUrl}/legal/impressum`;
  const startUrl = `${p.appUrl}/assessment/${p.assessmentId}`;
  const widerrufUrl = `${p.appUrl}/widerruf?ref=${encodeURIComponent(s.order.orderNumber)}`;

  const row = (label: string, value: string) =>
    `<tr>
       <td style="padding:6px 0; color:#767471; font-size:13px; vertical-align:top; width:42%;">${label}</td>
       <td style="padding:6px 0; color:#1A1917; font-size:14px; vertical-align:top;">${value}</td>
     </tr>`;

  const widerrufConsent = s.consents.find((c) => c.type === 'widerruf_verzicht') ?? null;
  const consentLine = widerrufConsent?.acceptedAt
    ? `${DT(widerrufConsent.acceptedAt)}${s.consentVersion ? ` · Fassung ${s.consentVersion}` : ''}`
    : (s.consentVersion ? `Fassung ${s.consentVersion}` : '—');

  // Alle vier dokumentierten Zustimmungen mit Wortlaut + Zeitstempel.
  const consentRows = s.consents.map((c) => `
    <tr>
      <td style="padding:8px 0; border-top:1px solid #ECE8E1; vertical-align:top;">
        <div style="font-size:13.5px; color:#1A1917;"><strong>${esc(c.label)}</strong></div>
        <div style="font-size:12.5px; color:#5F5D59; margin:2px 0 4px;">${esc(c.text)}</div>
        <div style="font-size:11px; color:#9A9894;">${c.acceptedAt ? `Angeklickt am ${DT(c.acceptedAt)}` : 'ohne Zeitstempel'}${s.consentVersion ? ` · Fassung ${s.consentVersion}` : ''}</div>
      </td>
    </tr>`).join('');

  const subject = `Deine Bestell- und Vertragsbestätigung · ${s.product.name} (${s.order.orderNumber})`;

  const html = `
<div style="font-family:-apple-system,Segoe UI,sans-serif; max-width:600px; margin:0 auto; color:#1A1917; line-height:1.55;">
  <div style="padding:32px 24px 8px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#B38E45; margin-bottom:14px;">
      &#10003; Zahlung erhalten
    </div>
    <h1 style="font-family:Georgia,serif; font-weight:300; font-size:30px; letter-spacing:-0.02em; line-height:1.12; margin:0 0 14px;">
      Sch&ouml;n, dass du da bist, ${esc(p.firstName)}.
    </h1>
    <p style="font-size:16px; margin:0 0 8px;">
      Dein <strong>${esc(s.product.name)}</strong> ist freigeschaltet. Du kannst direkt loslegen &mdash;
      und unten findest du deine vollst&auml;ndige Bestell- und Vertragsbest&auml;tigung zum Aufbewahren.
      Das vollst&auml;ndige Vertragsdokument h&auml;ngt zus&auml;tzlich als PDF an dieser E-Mail.
    </p>
    <p style="margin:18px 0 28px;">
      <a href="${startUrl}" style="display:inline-block; background:#1A1917; color:#F4F1EC; text-decoration:none; padding:13px 22px; border-radius:999px; font-weight:600; font-size:15px;">
        Assessment starten &rarr;
      </a>
    </p>
  </div>

  <div style="background:#F0EEEA; border-radius:6px; padding:22px 22px 8px; margin:0 8px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#767471; margin-bottom:8px;">
      Bestell- und Vertragsbest&auml;tigung
    </div>
    <table style="width:100%; border-collapse:collapse;">
      ${row('Bestellnummer', esc(s.order.orderNumber))}
      ${row('Bestelldatum', DT(s.order.purchasedAt))}
      ${row('Produkt', esc(s.product.name))}
      ${row('Bruttopreis', `${EUR(s.product.priceCents, s.product.currency)} <span style="color:#767471;">&mdash; ${esc(s.vatNote)}</span>`)}
      ${row('Zahlungsart', 'Kreditkarte (&uuml;ber Stripe)')}
      ${row('Vertragsreferenz', esc(s.order.purchaseId))}
    </table>
    <div style="border-top:1px solid #DCD8D1; margin:14px 0 0; padding-top:12px;">
      <div style="font-size:13px; color:#767471; margin-bottom:4px;">Anbieter</div>
      <div style="font-size:14px;">
        ${esc(s.provider.legalName)}<br/>
        ${esc(s.provider.person)}<br/>
        ${esc(s.provider.address)}<br/>
        Tel.: ${esc(s.provider.phone)} &middot; ${esc(s.provider.email)}<br/>
        <a href="${impressumUrl}" style="color:#B38E45;">Impressum</a>
      </div>
    </div>
  </div>

  <div style="padding:22px 24px 8px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#767471; margin-bottom:8px;">
      Leistung &amp; Vertragsbedingungen (&sect; 4 FAGG)
    </div>
    ${term('Hauptmerkmale der Leistung', s.serviceTerms.leistungsbeschreibung)}
    ${term('Bereitstellung', s.serviceTerms.bereitstellung)}
    ${term('Gew&auml;hrleistung', s.serviceTerms.gewaehrleistung)}
    ${term('Funktionalit&auml;t, Kompatibilit&auml;t &amp; Interoperabilit&auml;t', s.serviceTerms.funktionalitaet)}
    ${term('Nutzung, Verf&uuml;gbarkeit &amp; Haftung', s.serviceTerms.nutzungHaftung)}
    <p style="font-size:12px; color:#767471; margin:4px 0 0;">
      Ma&szlig;gebliche AGB-Fassung: Stand ${esc(s.agbVersion)} (im angeh&auml;ngten PDF enthalten) &mdash;
      <a href="${agbUrl}" style="color:#B38E45;">aktuelle AGB ansehen</a>.
    </p>
  </div>

  <div style="padding:8px 24px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#767471; margin-bottom:8px;">
      Dokumentierte Zustimmungen
    </div>
    <table style="width:100%; border-collapse:collapse;">
      ${consentRows}
    </table>
  </div>

  <div style="padding:14px 24px 8px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#767471; margin-bottom:8px;">
      Widerruf &amp; digitale Leistung
    </div>
    <p style="font-size:14px; margin:0 0 10px;">
      Du hast beim Kauf ausdr&uuml;cklich dem sofortigen Leistungsbeginn zugestimmt. Im Wortlaut:
    </p>
    <blockquote style="margin:0 0 12px; padding:10px 14px; background:#FAF8F4; border-left:3px solid #B38E45; font-size:13.5px; color:#3A3835;">
      &bdquo;${esc(s.widerrufVerzichtText)}&ldquo;
    </blockquote>
    <table style="width:100%; border-collapse:collapse;">
      ${row('Zustimmung dokumentiert', consentLine)}
    </table>
  </div>

  <div style="padding:8px 24px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#767471; margin-bottom:8px;">
      Widerrufsbelehrung (vollst&auml;ndig)
    </div>
    ${pre(s.widerrufsbelehrung)}
  </div>

  <div style="padding:8px 24px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#767471; margin-bottom:8px;">
      Muster-Widerrufsformular
    </div>
    ${pre(s.musterWiderrufsformular)}
    <p style="margin:14px 0 4px;">
      <a href="${widerrufUrl}" style="display:inline-block; background:#7A1F1F; color:#F4F1EC; text-decoration:none; padding:12px 20px; border-radius:999px; font-weight:600; font-size:14px;">
        Vertrag online widerrufen &rarr;
      </a>
    </p>
    <p style="font-size:12px; color:#767471; margin:8px 0 0;">
      Du kannst auch formlos per E-Mail an
      <a href="mailto:${esc(s.provider.email)}" style="color:#B38E45;">${esc(s.provider.email)}</a> widerrufen.
      Hinweis: Bei digitalen Inhalten erlischt das 14-t&auml;gige Widerrufsrecht, sobald die Ausf&uuml;hrung
      mit deiner ausdr&uuml;cklichen Zustimmung begonnen hat (FAGG).
    </p>
  </div>

  <div style="padding:8px 24px 28px;">
    <p style="font-size:12px; color:#9A9894; margin:18px 0 0; border-top:1px solid #ECE8E1; padding-top:14px;">
      Bewahre diese E-Mail samt PDF als Vertragsbest&auml;tigung auf. Fragen? Antworte einfach auf diese
      Mail oder schreib an <a href="mailto:${esc(s.provider.email)}" style="color:#B38E45;">${esc(s.provider.email)}</a>.<br/>
      <a href="${datenschutzUrl}" style="color:#9A9894;">Datenschutz</a> &middot;
      <a href="${impressumUrl}" style="color:#9A9894;">Impressum</a>
    </p>
  </div>
</div>`.trim();

  return { subject, html };
}

/** Die vier Pflicht-Zustimmungstypen, die zu jedem Kauf gehören müssen. */
const REQUIRED_CONSENTS = ['agb', 'datenschutz', 'ki_verarbeitung', 'widerruf_verzicht'] as const;

type ConsentRow = {
  version: string | null;
  accepted_at: string | null;
  consent_type: string;
  consent_text: string | null;
  checkout_attempt_id: string | null;
};

/**
 * Prüft, ob die zu diesem Kauf gehörenden Consents vollständig und belastbar
 * sind, BEVOR freigeschaltet wird (Review #3):
 *   - genau die vier Pflichttypen vorhanden,
 *   - alle mit accepted_at,
 *   - alle mit gespeichertem consent_text,
 *   - Version passt zur Purchase (sofern dort gesetzt).
 * Strikt nur, wenn der Kauf eine checkout_attempt_id trägt (alle Neukäufe).
 * Altbestellungen ohne ID werden best effort behandelt (kein Block).
 */
function validateConsents(rows: ConsentRow[], purchaseConsentVersion: string | null): { ok: boolean; reason?: string } {
  const byType = new Map(rows.map((r) => [r.consent_type, r]));
  for (const t of REQUIRED_CONSENTS) {
    const r = byType.get(t);
    if (!r) return { ok: false, reason: `consent fehlt: ${t}` };
    if (!r.accepted_at) return { ok: false, reason: `accepted_at fehlt: ${t}` };
    if (!r.consent_text || !r.consent_text.trim()) return { ok: false, reason: `consent_text fehlt: ${t}` };
    if (purchaseConsentVersion && r.version && r.version !== purchaseConsentVersion) {
      return { ok: false, reason: `version weicht ab: ${t} (${r.version} ≠ ${purchaseConsentVersion})` };
    }
  }
  return { ok: true };
}

/**
 * Lädt alle Daten zu einer Purchase, friert den Vertrags-Snapshot ein, erzeugt
 * das Vertrags-PDF (Inhaltshash gespeichert), baut die Bestätigung und versendet
 * sie — idempotent und statusverfolgt. Wird vom Webhook und vom Retry-Endpoint
 * genutzt.
 *
 * - Bereits gesendet (confirmation_sent_at gesetzt) → no-op, ok:true.
 * - Consent wird über checkout_attempt_id exakt diesem Kauf zugeordnet
 *   (Fallback: neueste Einträge des Users, nur für Altbestellungen ohne ID) und
 *   VOR Versand/Freischaltung auf Vollständigkeit geprüft.
 * - Snapshot wird beim ersten erfolgreichen Lauf auf der Purchase eingefroren
 *   und das Vertrags-PDF aus genau diesem Snapshot gerendert + gehasht.
 * - Erfolg → finalize_order_confirmation() setzt confirmation_sent_at UND
 *   schaltet das gesperrte Assessment ATOMAR (eine Transaktion) auf 'pending'
 *   frei. Entweder beides oder keines.
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
    .select('id, user_id, product_id, assessment_id, amount_cents, currency, paid_at, created_at, order_number, confirmation_sent_at, confirmation_attempts, metadata, status, checkout_attempt_id, consent_version, contract_snapshot')
    .eq('id', purchaseId)
    .single();

  if (pErr || !purchase) return { ok: false, error: 'purchase not found' };
  if (purchase.status !== 'paid') return { ok: false, skipped: true, error: 'not paid' };
  if (purchase.confirmation_sent_at && !opts?.force) return { ok: true, skipped: true };
  if (!purchase.assessment_id) return { ok: false, error: 'no assessment linked yet' };

  // Consent EXAKT diesem Kauf zuordnen (checkout_attempt_id). Fallback nur für
  // Altbestellungen ohne ID: neueste checkout-consent-Einträge des Users.
  const consentQuery = admin
    .from('consent_records')
    .select('version, accepted_at, consent_type, consent_text, checkout_attempt_id')
    .eq('user_id', purchase.user_id)
    .eq('source', 'checkout-consent');
  const consentRes = purchase.checkout_attempt_id
    ? await consentQuery.eq('checkout_attempt_id', purchase.checkout_attempt_id).order('accepted_at', { ascending: false })
    : await consentQuery.order('accepted_at', { ascending: false }).limit(8);

  const [{ data: product }, { data: profile }] = await Promise.all([
    admin.from('products').select('name_de').eq('id', purchase.product_id).single(),
    admin.from('profiles').select('full_name').eq('id', purchase.user_id).single(),
  ]);
  const consents = (consentRes.data ?? []) as ConsentRow[];

  // (Review #3) Vor Versand UND Freischaltung prüfen — strikt bei Neukäufen.
  if (purchase.checkout_attempt_id) {
    const v = validateConsents(consents, purchase.consent_version);
    if (!v.ok) {
      await admin.from('purchases')
        .update({
          confirmation_attempts: (purchase.confirmation_attempts ?? 0) + 1,
          confirmation_last_error: `consent unvollständig: ${v.reason}`,
        })
        .eq('id', purchase.id);
      return { ok: false, error: `consent invalid: ${v.reason}` };
    }
  }

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

  const orderNumber = purchase.order_number
    ? `CC-${purchase.order_number}`
    : `CC-${String(purchase.id).slice(0, 8).toUpperCase()}`;

  // Snapshot einfrieren (falls noch nicht geschehen) — die zum Bestellzeitpunkt
  // geltenden Texte/Daten werden dauerhaft fixiert. Der GESPEICHERTE Wortlaut
  // jeder Zustimmung wird mitgegeben (nicht die aktuelle Code-Konstante).
  const snapshot: ContractSnapshot =
    (purchase.contract_snapshot as ContractSnapshot | null) ??
    buildContractSnapshot({
      productName: product?.name_de ?? 'Dein Paket',
      priceCents: purchase.amount_cents ?? 0,
      currency: purchase.currency ?? 'eur',
      orderNumber,
      purchaseId: purchase.id,
      purchasedAt: new Date(purchase.paid_at ?? purchase.created_at ?? Date.now()),
      consentVersion: purchase.consent_version ?? null,
      consents: consents.map((c) => ({
        type: c.consent_type,
        acceptedAt: c.accepted_at ?? null,
        text: c.consent_text ?? null,
      })),
    });

  if (!purchase.contract_snapshot) {
    await admin.from('purchases')
      .update({
        contract_snapshot: snapshot,
        agb_version: AGB_VERSION,
        consent_version: snapshot.consentVersion,
        consent_text_snapshot: flattenConsentText(snapshot),
      })
      .eq('id', purchase.id);
  }

  // Vertrags-PDF aus genau diesem Snapshot rendern (dauerhafter Datenträger).
  // Best effort: scheitert das Rendern, geht die Bestätigung OHNE Anhang raus —
  // die Pflichtangaben stehen ohnehin vollständig im Mailtext. Der Inhaltshash
  // wird (falls erzeugt) auf der Purchase gespeichert.
  let attachments: Array<{ filename: string; content: Buffer }> | undefined;
  try {
    const { renderContractDocument } = await import('@/lib/pdf/contract-document');
    const pdf = await renderContractDocument(snapshot);
    const sha256 = createHash('sha256').update(pdf).digest('hex');
    attachments = [{ filename: `Vertragsbestaetigung_${orderNumber}.pdf`, content: pdf }];
    await admin.from('purchases')
      .update({ contract_pdf_sha256: sha256, contract_pdf_generated_at: new Date().toISOString() })
      .eq('id', purchase.id);
  } catch (err) {
    console.warn('[order-confirmation] contract PDF render failed (sending without attachment):', err instanceof Error ? err.message : err);
  }

  const { subject, html } = buildOrderConfirmationEmail({
    firstName: profile?.full_name?.split(' ')[0] ?? 'Trainer',
    appUrl,
    assessmentId: purchase.assessment_id,
    snapshot,
  });

  const res = await sendEmailSafe({ to: email, subject, html, category: 'order-confirmation', attachments });

  if (res.ok) {
    // Leistungsbeginn erst JETZT: Versandmarker setzen UND das gesperrte
    // Assessment ATOMAR freischalten (eine Transaktion in der DB-Funktion).
    const { error: finErr } = await admin.rpc('finalize_order_confirmation', {
      p_purchase_id: purchase.id,
      p_assessment_id: purchase.assessment_id,
    });
    if (finErr) {
      // E-Mail ist raus, aber Finalisierung scheiterte → protokollieren, damit
      // der Retry (Selbstheilung) nachzieht. confirmation_sent_at bleibt leer.
      await admin.from('purchases')
        .update({ confirmation_last_error: `finalize_order_confirmation fehlgeschlagen: ${finErr.message}` })
        .eq('id', purchase.id);
      return { ok: false, error: 'finalize failed' };
    }
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
