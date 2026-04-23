import { NextResponse, type NextRequest } from 'next/server';
import { sendEmailSafe } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, phone, club, plan, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, E-Mail und Nachricht erforderlich' }, { status: 400 });
  }

  // Basic email format check
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 });
  }

  const recipient = process.env.KONTAKT_EMAIL ?? 'office@humatrix.cc';

  const htmlContent = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="font-family: Georgia, serif; font-weight: 300;">Neue Kontakt-Anfrage</h2>
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
    </div>
  `;

  const sent = await sendEmailSafe({
    to: recipient,
    subject: `Kontakt-Anfrage: ${name}${plan ? ` — ${plan}` : ''}`,
    html: htmlContent,
  });

  // Even if email fails, store or acknowledge — for now, return success
  // (TODO: fallback — Supabase-Tabelle `contact_messages` anlegen)
  if (!sent) {
    // Log so nothing gets lost silently
    console.warn('[kontakt] email failed but form accepted:', { name, email });
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
