import { NextResponse, type NextRequest } from 'next/server';
import { sendEmailSafe } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges Request-Format' }, { status: 400 });
  }
  const { name, email, phone, club, plan, message } = body ?? {};

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, E-Mail und Nachricht erforderlich' }, { status: 400 });
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 });
  }

  const recipient = process.env.KONTAKT_EMAIL ?? 'office@humatrix.cc';

  // ============== ADMIN-NOTIFICATION ==============
  const adminHtml = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1A1917;">
      <h2 style="font-family: Georgia, serif; font-weight: 300; margin: 0 0 16px;">Neue Kontakt-Anfrage</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px 0; color: #767471; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Name</td><td style="padding: 8px 0;"><strong>${escapeHtml(name)}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #767471; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">E-Mail</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        ${phone ? `<tr><td style="padding: 8px 0; color: #767471; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Telefon</td><td style="padding: 8px 0;">${escapeHtml(phone)}</td></tr>` : ''}
        ${club ? `<tr><td style="padding: 8px 0; color: #767471; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Verein</td><td style="padding: 8px 0;">${escapeHtml(club)}</td></tr>` : ''}
        ${plan ? `<tr><td style="padding: 8px 0; color: #767471; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Paket-Interesse</td><td style="padding: 8px 0;"><strong style="color: #B38E45;">${escapeHtml(plan)}</strong></td></tr>` : ''}
      </table>
      <div style="margin-top: 24px; padding: 20px; background: #F0EEEA; border-left: 3px solid #B38E45; border-radius: 4px;">
        <div style="color: #767471; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Nachricht</div>
        <p style="margin: 0; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>
      <p style="margin-top: 24px; font-size: 13px; color: #767471;">Direkt antworten — Reply-To ist auf den Absender gesetzt.</p>
    </div>
  `;

  const adminResult = await sendEmailSafe({
    to: recipient,
    subject: `Kontakt-Anfrage: ${name}${plan ? ` — ${plan}` : ''}`,
    html: adminHtml,
    replyTo: email,
    category: 'contact-form-admin',
  });

  // ============== AUTO-CONFIRMATION AN ABSENDER ==============
  const firstName = name.split(' ')[0];
  const confirmHtml = `
    <div style="font-family: -apple-system, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #1A1917; line-height: 1.55;">
      <div style="padding: 32px 24px 24px;">
        <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #B38E45; margin-bottom: 14px;">
          ✓ Eingegangen
        </div>
        <h1 style="font-family: Georgia, serif; font-weight: 300; font-size: 30px; letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 16px;">
          Danke, ${escapeHtml(firstName)}.
        </h1>
        <p style="font-size: 16px; margin: 0 0 18px;">
          Deine Anfrage ist bei uns angekommen. Wir melden uns innerhalb von 24 Stunden persönlich bei dir.
        </p>
        <div style="background: #F0EEEA; border-left: 3px solid #B38E45; padding: 16px 18px; border-radius: 4px; margin: 0 0 24px;">
          <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #767471; margin-bottom: 8px;">
            Deine Nachricht
          </div>
          <p style="margin: 0; font-size: 14px; white-space: pre-wrap; color: #1A1917;">${escapeHtml(message)}</p>
        </div>
        <p style="font-size: 14px; color: #767471; margin: 0 0 8px;">
          Wenn's dringend ist, erreichst du uns auch direkt unter
          <a href="mailto:office@humatrix.cc" style="color: #B38E45;">office@humatrix.cc</a>.
        </p>
        <p style="font-size: 12px; color: #767471; margin: 28px 0 0; border-top: 1px solid #E6E3DD; padding-top: 16px;">
          Humatrix · The Mind Club Company<br>
          Bernhard Lampl · Ried 80 · 6363 Westendorf · Tirol, Österreich<br>
          coachcheck.humatrix.cc
        </p>
      </div>
    </div>
  `;

  await sendEmailSafe({
    to: email,
    subject: 'Wir haben deine Anfrage erhalten — Humatrix Coach',
    html: confirmHtml,
    category: 'contact-form-confirm',
  });

  if (!adminResult.ok) {
    console.warn('[kontakt] admin email failed:', adminResult.error, '| from:', name, email);
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
