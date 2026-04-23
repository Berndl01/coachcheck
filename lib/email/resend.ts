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
 * Optionen:
 * - RESEND_FROM_EMAIL="Humatrix Coach <noreply@humatrix.cc>"  (wenn Domain verifiziert)
 * - RESEND_FROM_EMAIL="Humatrix Coach <onboarding@resend.dev>" (Fallback, immer verfügbar)
 *
 * Wenn nicht gesetzt: nutzt die Resend Test-Domain `onboarding@resend.dev`,
 * damit Mails nicht still fehlschlagen.
 *
 * Wichtig: Bei `onboarding@resend.dev` kann Resend nur an die Account-Owner-Email
 * senden (Beschränkung der Test-Domain). Sobald du `humatrix.cc` verifiziert hast,
 * setze `RESEND_FROM_EMAIL` auf die richtige Adresse.
 */
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'Humatrix Coach <onboarding@resend.dev>';

/**
 * Erkennt ob Resend konfiguriert und einsatzbereit ist.
 */
export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Sendet eine Mail mit robuster Fehlerbehandlung.
 * Returns true bei Erfolg, false bei Fehler — loggt immer, wirft NIE.
 * So blockieren fehlgeschlagene Mails nicht die Hauptlogik.
 */
export async function sendEmailSafe(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!emailEnabled()) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', params.to);
    return false;
  }
  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (result.error) {
      console.error('[email] Resend API error:', result.error);
      return false;
    }
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email] Send failed for', params.to, ':', msg);
    return false;
  }
}
