import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailSafe } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }
  const { invitation_id } = body;
  if (!invitation_id) {
    return NextResponse.json({ error: 'invitation_id erforderlich' }, { status: 400 });
  }

  // Load invitation with parent assessment
  const { data: invitation } = await supabase
    .from('invitations')
    .select('id, token, invited_email, invitation_type, expires_at, parent_assessment_id, assessment:parent_assessment_id(user_id)')
    .eq('id', invitation_id)
    .single();

  if (!invitation) {
    return NextResponse.json({ error: 'Einladung nicht gefunden' }, { status: 404 });
  }

  // Validate ownership
  if ((invitation.assessment as any)?.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  if (!invitation.invited_email) {
    return NextResponse.json({ error: 'Keine E-Mail-Adresse hinterlegt' }, { status: 400 });
  }

  // Get profile for trainer name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, sport')
    .eq('id', user.id)
    .single();

  const trainerName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Ein Trainer';
  const sport = profile?.sport ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coachcheck.humatrix.cc';
  const link = `${appUrl}/einschaetzung/${invitation.token}`;
  // Token-basierte Unsubscribe-URL: bricht den Versand für diesen einen Empfänger ab
  const unsubscribeUrl = `${appUrl}/einschaetzung/${invitation.token}?unsubscribe=1`;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      error: 'E-Mail-Versand nicht konfiguriert (RESEND_API_KEY fehlt)'
    }, { status: 500 });
  }

  const html = `
    <div style="font-family: -apple-system, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #1B1C1E;">
      <div style="padding: 32px 0; border-bottom: 1px solid #DBD8D1;">
        <div style="font-family: monospace; font-size: 11px; letter-spacing: 4px; color: #1B1C1E;">HUMATRIX</div>
      </div>
      <div style="padding: 32px 0;">
        <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #B38E45; text-transform: uppercase; margin-bottom: 12px;">
          360° Spiegel · Anonyme Einschätzung
        </div>
        <h1 style="font-size: 28px; font-weight: 300; letter-spacing: -0.5px; line-height: 1.2; margin: 0 0 16px 0;">
          ${escapeHtml(trainerName)} bittet dich um deine Sicht.
        </h1>
        <p style="font-size: 15px; line-height: 1.55; color: #767471; margin-bottom: 18px;">
          ${escapeHtml(trainerName)} macht gerade ein Premium-Trainer-Assessment auf <strong>Humatrix Coach</strong>${sport ? ` (${escapeHtml(sport)})` : ''}
          und möchte verstehen, wie du ${escapeHtml(trainerName.split(' ')[0])} als Trainer wirklich erlebst.
        </p>
        <p style="font-size: 15px; line-height: 1.55; color: #767471; margin-bottom: 28px;">
          Deine Einschätzung ist <strong style="color: #1B1C1E;">100% anonym</strong>. ${escapeHtml(trainerName.split(' ')[0])} sieht nie, wer was geantwortet hat —
          nur den aggregierten Vergleich zwischen Selbstbild und Fremdbild aus dem Team. Es dauert ca. 10 Minuten.
        </p>
        <a href="${link}" style="display: inline-block; padding: 14px 28px; background: #1B1C1E; color: #FAFAF8; text-decoration: none; border-radius: 999px; font-weight: 600; font-size: 14px;">
          Jetzt Einschätzung abgeben →
        </a>
        <p style="font-size: 12px; color: #9A9793; margin-top: 32px;">
          Der Link ist 14 Tage gültig. Du kannst jederzeit pausieren und später weitermachen.<br>
          Falls der Button nicht funktioniert: <a href="${link}" style="color: #B38E45;">${link}</a>
        </p>
      </div>
      <div style="padding: 20px 0; border-top: 1px solid #DBD8D1; font-size: 11px; color: #9A9793; letter-spacing: 1px; text-transform: uppercase;">
        Humatrix · The Mind Club Company · Made in Tyrol, Austria<br>
        Diese E-Mail wurde im Auftrag von ${escapeHtml(trainerName)} versendet.
      </div>
    </div>
  `;

  const result = await sendEmailSafe({
    to: invitation.invited_email,
    subject: `${trainerName} bittet dich um eine ehrliche Einschätzung`,
    html,
    replyTo: user.email ?? undefined,  // Antwort geht zurück an den Trainer
    unsubscribeUrl,
    category: 'invitation-360',
  });

  if (!result.ok) {
    return NextResponse.json({
      error: `E-Mail-Versand fehlgeschlagen: ${result.error ?? 'unknown'}`
    }, { status: 500 });
  }

  // Update status
  const admin = createAdminClient();
  await admin
    .from('invitations')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', invitation_id);

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
