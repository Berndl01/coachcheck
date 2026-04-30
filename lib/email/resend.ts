import { Resend } from 'resend';

export function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not set');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * FROM-Adresse. Wird aus ENV gelesen.
 *
 * WICHTIG für Zustellbarkeit:
 * - Domain muss in Resend verifiziert sein (SPF + DKIM + DMARC)
 * - Format: "Name <email@domain>" — sonst landen Mails häufiger im Spam
 *
 * Production: RESEND_FROM_EMAIL="Humatrix Coach <noreply@humatrix.cc>"
 * Fallback (nur Dev): "Humatrix Coach <onboarding@resend.dev>"
 *   ⚠ Bei Resend-Test-Domain kann nur an Account-Owner-Email gesendet werden.
 *   ⚠ Mails von resend.dev landen bei externen Empfängern fast immer im Spam.
 */
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Humatrix Coach <onboarding@resend.dev>';

/**
 * Reply-To: hier landen Antworten. Niemals auf noreply@ —
 * sonst wirken Mails maschinell und landen häufiger im Spam.
 */
export const REPLY_TO = process.env.RESEND_REPLY_TO ?? 'office@humatrix.cc';

/**
 * Erkennt ob Resend konfiguriert und einsatzbereit ist.
 */
export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Konvertiert HTML in plain text.
 * Plain-Text-Part ist der wichtigste Anti-Spam-Faktor:
 * Mails ohne text/plain bekommen bei Gmail/Outlook deutlich höheren Spam-Score.
 */
export function htmlToText(html: string): string {
  return html
    // Block-Elemente in Newlines umwandeln BEVOR Tags entfernt werden
    .replace(/<\/(p|div|h[1-6]|li|tr|br)\s*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(ol|ul|table)\s*>/gi, '\n\n')
    // Links: "Text (URL)" Format
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    // Alle restlichen Tags entfernen
    .replace(/<[^>]+>/g, '')
    // HTML-Entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&[a-z]+;/gi, '')
    // Whitespace normalisieren
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Sendet eine Mail mit voller Anti-Spam-Härtung.
 *
 * Eingebaut:
 * - text/plain Multipart (wichtigster Anti-Spam-Faktor)
 * - Reply-To (damit Antworten ankommen)
 * - List-Unsubscribe + List-Unsubscribe-Post (Gmail/Yahoo Pflicht seit Feb 2024)
 * - Tags für Resend-Analytics
 *
 * Returns ok: true/false, plus optional id/error für Logging.
 * Wirft NIE — fehlgeschlagene Mails blockieren nie die Hauptlogik.
 */
export async function sendEmailSafe(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;            // Optional — sonst aus HTML generiert
  replyTo?: string;         // Override default
  unsubscribeUrl?: string;  // Optional — sonst nur mailto:-Variante
  category?: string;        // Für Logging / Resend-Tags
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!emailEnabled()) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', params.to);
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }

  // Plain text generieren wenn nicht übergeben
  const textBody = params.text ?? htmlToText(params.html);

  // List-Unsubscribe — Gmail-Pflichtfeld für seriöse Sender
  const unsubMailto = `mailto:${REPLY_TO}?subject=Unsubscribe`;
  const unsubHeader = params.unsubscribeUrl
    ? `<${params.unsubscribeUrl}>, <${unsubMailto}>`
    : `<${unsubMailto}>`;

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: textBody,
      replyTo: params.replyTo ?? REPLY_TO,
      headers: {
        'List-Unsubscribe': unsubHeader,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': params.category ?? 'transactional',
      },
      tags: params.category ? [{ name: 'category', value: params.category }] : undefined,
    });

    if (result.error) {
      console.error('[email] Resend API error:', result.error, 'to:', params.to);
      return { ok: false, error: String(result.error.message ?? result.error) };
    }
    console.log(`[email] sent to ${params.to} · ${params.category ?? 'tx'} · id=${result.data?.id}`);
    return { ok: true, id: result.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email] Send failed for', params.to, ':', msg);
    return { ok: false, error: msg };
  }
}
