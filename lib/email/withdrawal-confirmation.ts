/**
 * Geteilter Baustein für die Widerrufs-Eingangsbestätigung.
 *
 * Wird sowohl von der Online-Widerrufsroute (`app/api/widerruf/route.ts`) als
 * auch vom Retry-Cron (`app/api/internal/withdrawal-retry/route.ts`) verwendet,
 * damit der Kunde bei jedem Versand exakt denselben, vollständigen Inhalt erhält.
 *
 * Der Regelungsentwurf zum Online-Widerruf verlangt eine Eingangsbestätigung,
 * die Inhalt, Datum und Uhrzeit der Widerrufserklärung wiedergibt. Deshalb baut
 * `buildWithdrawalDeclaration()` den vollständigen Erklärungstext (feste
 * Widerrufsformel + Vertragsangaben + optionaler Freitext) zusammen; dieser Text
 * wird in `withdrawals.declaration_full` gespeichert UND in der E-Mail
 * wiedergegeben.
 */
import { PROVIDER, providerAddressLine } from '@/lib/legal/provider';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type WithdrawalDeclarationInput = {
  fullName: string;
  email: string;
  orderRef?: string | null;
  productHint?: string | null;
  /** Optionaler Freitext des Kunden ("Anmerkung"). */
  note?: string | null;
  /** Bereits formatierter Eingangszeitpunkt (z. B. "18.06.2026, 14:32 Uhr"). */
  receivedAtLabel: string;
};

/** Die feste, im Entwurf empfohlene Widerrufsformel. */
export const WIDERRUF_FORMEL =
  'Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die nachfolgend genannte digitale Leistung.';

/**
 * Baut den vollständigen Inhalt der Widerrufserklärung als Klartext.
 * Dieser Text ist die beweisrelevante Wiedergabe (Inhalt der Erklärung) und
 * wird unverändert gespeichert und in der Bestätigung gezeigt.
 */
export function buildWithdrawalDeclaration(input: WithdrawalDeclarationInput): string {
  const lines: string[] = [];
  lines.push(WIDERRUF_FORMEL);
  lines.push('');
  lines.push(`Name: ${input.fullName}`);
  lines.push(`E-Mail: ${input.email}`);
  if (input.orderRef && input.orderRef.trim()) lines.push(`Bestellnummer: ${input.orderRef.trim()}`);
  if (input.productHint && input.productHint.trim()) lines.push(`Produkt: ${input.productHint.trim()}`);
  lines.push(`Eingang der Erklärung: ${input.receivedAtLabel}`);
  if (input.note && input.note.trim()) {
    lines.push('');
    lines.push('Anmerkung des Kunden:');
    lines.push(input.note.trim());
  }
  return lines.join('\n');
}

/**
 * Rendert die vollständige Kunden-Eingangsbestätigung (dauerhafter Datenträger).
 * Enthält den vollständigen Erklärungsinhalt (Pflicht), Eingangszeitpunkt und
 * Vorgangsnummer.
 */
export function renderWithdrawalConfirmationEmail(input: {
  ref: string;
  firstName: string;
  fullName: string;
  email: string;
  orderRef?: string | null;
  productHint?: string | null;
  note?: string | null;
  receivedAtLabel: string;
}): { subject: string; html: string; declarationText: string } {
  const declarationText = buildWithdrawalDeclaration({
    fullName: input.fullName,
    email: input.email,
    orderRef: input.orderRef,
    productHint: input.productHint,
    note: input.note,
    receivedAtLabel: input.receivedAtLabel,
  });

  const html = `
<div style="font-family:-apple-system,'Segoe UI',sans-serif; max-width:560px; margin:0 auto; color:#1A1917; line-height:1.55;">
  <div style="padding:32px 24px 24px;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#7A1F1F; margin-bottom:14px;">
      &#10003; Widerruf eingegangen
    </div>
    <h1 style="font-family:Georgia,serif; font-weight:300; font-size:28px; letter-spacing:-0.02em; line-height:1.15; margin:0 0 16px;">
      Wir haben deinen Widerruf erhalten, ${escapeHtml(input.firstName)}.
    </h1>
    <p style="font-size:16px; margin:0 0 18px;">
      Hiermit best&auml;tigen wir den Eingang deiner Widerrufserkl&auml;rung. Den vollst&auml;ndigen Inhalt
      deiner Erkl&auml;rung haben wir unten zu deiner Dokumentation festgehalten. Wir pr&uuml;fen sie und
      melden uns zeitnah bei dir. Bewahre diese E-Mail als Eingangsbest&auml;tigung auf.
    </p>
    <div style="background:#F0EEEA; border-left:3px solid #7A1F1F; padding:16px 18px; border-radius:4px; margin:0 0 18px;">
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:5px 0; color:#767471; width:42%;">Eingangszeitpunkt</td><td style="padding:5px 0;">${escapeHtml(input.receivedAtLabel)}</td></tr>
        <tr><td style="padding:5px 0; color:#767471;">Vorgangsnummer</td><td style="padding:5px 0;">${escapeHtml(input.ref)}</td></tr>
        ${input.orderRef ? `<tr><td style="padding:5px 0; color:#767471;">Deine Bestellnummer</td><td style="padding:5px 0;">${escapeHtml(input.orderRef)}</td></tr>` : ''}
        ${input.productHint ? `<tr><td style="padding:5px 0; color:#767471;">Produkt</td><td style="padding:5px 0;">${escapeHtml(input.productHint)}</td></tr>` : ''}
        <tr><td style="padding:5px 0; color:#767471;">Name</td><td style="padding:5px 0;">${escapeHtml(input.fullName)}</td></tr>
      </table>
    </div>
    <div style="border:1px solid #E6E3DD; border-radius:4px; padding:16px 18px; margin:0 0 22px;">
      <div style="color:#767471; font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Inhalt deiner Widerrufserkl&auml;rung</div>
      <p style="margin:0; white-space:pre-wrap; font-size:14px; line-height:1.55;">${escapeHtml(declarationText)}</p>
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

  return {
    subject: `Eingangsbestätigung deines Widerrufs · ${input.ref}`,
    html,
    declarationText,
  };
}
