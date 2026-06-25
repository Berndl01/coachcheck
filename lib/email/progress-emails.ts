import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmailSafe } from '@/lib/email/resend';
import { PROVIDER } from '@/lib/legal/provider';

/**
 * Fortschritts- und Erinnerungs-Mails (Resend, gebrandet, mit Unsubscribe).
 *
 * Vier Anlässe:
 *  1) Resume-Nudge   — angefangenes, nicht beendetes Assessment (Käufer).
 *  2) Rater-Reminder — eingeladener Fremdbild-Geber hat noch nicht geantwortet.
 *  3) Trainer-Info   — erste Fremdeinschätzung ist da (1 von …).
 *  4) Trainer-Trigger— genug Fremdeinschätzungen → 360°-Report erzeugbar.
 *
 * Zeitbasierte Fälle (1+2) laufen über den Cron-Endpoint, ereignisbasierte
 * Fälle (3+4) feuern beim Abschluss einer Fremdbild-Einladung. Versand ist
 * idempotent/statusverfolgt (Tracking-Spalten aus Migration 32) bzw.
 * meilenstein-basiert (genau bei 1 und bei FREMDBILD_MIN).
 */

export const FREMDBILD_MIN = 3;            // Minimum für eine sinnvolle 360°-Auswertung
const RATER_REMINDER_AFTER_H = 48;         // erst nach 48 h erinnern
const RATER_MAX_REMINDERS = 2;             // höchstens 2 Erinnerungen
const RESUME_AFTER_H = 48;                 // Resume-Nudge nach 48 h Inaktivität
const BATCH = 50;

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'https://coachcheck.humatrix.cc';
const hoursAgoISO = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Gemeinsamer Marken-Rahmen (Humatrix-Kopf + Fuß), damit alle Mails gleich wirken. */
function shell(inner: string, footerNote?: string): string {
  return `
<div style="font-family:-apple-system,'Segoe UI',sans-serif; max-width:560px; margin:0 auto; color:#1B1C1E; line-height:1.55;">
  <div style="padding:28px 0 16px; border-bottom:1px solid #DBD8D1;">
    <div style="font-family:monospace; font-size:11px; letter-spacing:4px; color:#1B1C1E;">HUMATRIX</div>
  </div>
  <div style="padding:28px 0;">${inner}</div>
  <div style="padding:14px 0 28px; border-top:1px solid #ECE8E1; color:#9A9894; font-size:12px;">
    ${footerNote ? `${footerNote}<br/>` : ''}
    Humatrix · The Mind Club Company · Made in Tyrol, Austria
  </div>
</div>`.trim();
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block; background:#1B1C1E; color:#F4F1EC; text-decoration:none; padding:12px 22px; border-radius:999px; font-weight:600; font-size:15px;">${label}</a>`;

const kicker = (t: string) =>
  `<div style="font-family:monospace; font-size:11px; letter-spacing:2px; color:#B38E45; text-transform:uppercase; margin-bottom:12px;">${t}</div>`;

const h1 = (t: string) =>
  `<h1 style="font-size:26px; font-weight:300; letter-spacing:-0.5px; line-height:1.2; margin:0 0 16px;">${t}</h1>`;

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildResumeReminderEmail(p: {
  firstName: string; productName: string; progressPct: number; assessmentId: string;
}): { subject: string; html: string } {
  const url = `${appUrl()}/assessment/${p.assessmentId}`;
  const progress = p.progressPct > 0
    ? `Du bist schon bei <strong>${p.progressPct}%</strong> — der Rest geht schnell.`
    : `Du hast es noch vor dir — und es dauert weniger lang, als du denkst.`;
  const inner = `
    ${kicker('Dein Assessment wartet')}
    ${h1(`${esc(p.firstName)}, dein ${esc(p.productName)} ist nur halb fertig.`)}
    <p style="font-size:16px; margin:0 0 14px;">${progress}</p>
    <p style="font-size:16px; margin:0 0 24px;">Deine bisherigen Antworten sind gespeichert. Mach einfach dort weiter, wo du aufgehört hast.</p>
    <p style="margin:0 0 8px;">${btn(url, 'Weitermachen →')}</p>`;
  return {
    subject: `Mach weiter: ${p.productName} ist fast fertig`,
    html: shell(inner, 'Du bekommst diese Erinnerung, weil du ein Assessment begonnen hast.'),
  };
}

export function buildRaterReminderEmail(p: {
  trainerName: string; sport: string | null; token: string;
}): { subject: string; html: string } {
  const link = `${appUrl()}/einschaetzung/${p.token}`;
  const unsub = `${appUrl()}/einschaetzung/${p.token}?unsubscribe=1`;
  const first = esc(p.trainerName.split(' ')[0] || p.trainerName);
  const inner = `
    ${kicker('Kurze Erinnerung')}
    ${h1(`${esc(p.trainerName)} wartet noch auf deine Sicht.`)}
    <p style="font-size:16px; margin:0 0 14px;">
      Vor Kurzem hat dich ${first} um eine ehrliche Einschätzung als Trainer${p.sport ? ` (${esc(p.sport)})` : ''} gebeten.
      Deine Antwort fehlt noch — und sie zählt.
    </p>
    <p style="font-size:15px; margin:0 0 22px; color:#3A3835;">
      Es dauert nur wenige Minuten und wird <strong>anonymisiert</strong> ausgewertet. ${first} sieht nie einzelne Antworten.
    </p>
    <p style="margin:0 0 8px;">${btn(link, 'Jetzt einschätzen →')}</p>`;
  return {
    subject: `Erinnerung: ${p.trainerName} bittet dich um deine Einschätzung`,
    html: shell(inner, `Du möchtest keine Erinnerung mehr? <a href="${unsub}" style="color:#9A9894;">Hier abmelden</a>.`),
  };
}

export function buildTrainerProgressEmail(p: {
  firstName: string; kind: 'first' | 'threshold'; responseCount: number; assessmentId: string;
}): { subject: string; html: string } {
  const url = `${appUrl()}/assessment/${p.assessmentId}/result`;
  if (p.kind === 'first') {
    const inner = `
      ${kicker('Es geht los')}
      ${h1(`${esc(p.firstName)}, die erste Einschätzung ist da.`)}
      <p style="font-size:16px; margin:0 0 14px;">
        Gerade ist die <strong>erste</strong> Fremdeinschätzung für dein 360°-Profil eingegangen.
        Sobald mindestens ${FREMDBILD_MIN} zusammenkommen, kannst du deinen 360°-Report erzeugen.
      </p>
      <p style="font-size:15px; margin:0 0 22px; color:#767471;">Aktuell: ${p.responseCount} von mindestens ${FREMDBILD_MIN}.</p>
      <p style="margin:0 0 8px;">${btn(url, 'Status ansehen →')}</p>`;
    return { subject: `Die erste 360°-Einschätzung ist da`, html: shell(inner) };
  }
  const inner = `
    ${kicker('Bereit')}
    ${h1(`${esc(p.firstName)}, genug Einschätzungen für deinen 360°-Report.`)}
    <p style="font-size:16px; margin:0 0 14px;">
      Es sind jetzt <strong>${p.responseCount}</strong> Fremdeinschätzungen da — genug für eine
      aussagekräftige 360°-Auswertung. Du kannst deinen Report jederzeit erzeugen.
    </p>
    <p style="margin:0 0 8px;">${btn(url, '360°-Report erzeugen →')}</p>`;
  return { subject: `Genug Einschätzungen — dein 360°-Report ist bereit`, html: shell(inner) };
}

// ---------------------------------------------------------------------------
// Sender (zeitbasiert, über Cron)
// ---------------------------------------------------------------------------

export async function sendResumeReminders(admin: SupabaseClient): Promise<{ attempted: number; sent: number }> {
  const cutoff = hoursAgoISO(RESUME_AFTER_H);
  // Echte Inaktivität: last_activity_at wird bei jeder Antwort gebumpt und beim
  // Anlegen auf den Kaufzeitpunkt gesetzt. So wird niemand erinnert, der gerade
  // erst weitergearbeitet hat — und „gekauft, nie gestartet" wird trotzdem nach
  // 48 h erfasst (last_activity_at = created_at).
  const { data: rows } = await admin
    .from('assessments')
    .select('id, progress_pct, user_id, product:product_id(name_de)')
    .in('status', ['pending', 'in_progress'])
    .not('purchase_id', 'is', null)
    .eq('resume_reminder_count', 0)
    .lt('last_activity_at', cutoff)
    .limit(BATCH);

  let sent = 0;
  for (const r of (rows ?? []) as any[]) {
    const { data: profile } = await admin
      .from('profiles').select('full_name, email').eq('id', r.user_id).single();
    const email = (profile as any)?.email;
    if (!email) continue;
    const { subject, html } = buildResumeReminderEmail({
      firstName: (profile as any)?.full_name?.split(' ')[0] ?? 'Trainer',
      productName: r.product?.name_de ?? 'Dein Assessment',
      progressPct: r.progress_pct ?? 0,
      assessmentId: r.id,
    });
    const res = await sendEmailSafe({ to: email, subject, html, category: 'resume-reminder' });
    if (res.ok) {
      await admin.from('assessments')
        .update({ resume_reminder_at: new Date().toISOString(), resume_reminder_count: 1 })
        .eq('id', r.id);
      sent += 1;
    }
  }
  return { attempted: (rows ?? []).length, sent };
}

export async function sendRaterReminders(admin: SupabaseClient): Promise<{ attempted: number; sent: number }> {
  const createdCutoff = hoursAgoISO(RATER_REMINDER_AFTER_H);
  const reminderCutoff = hoursAgoISO(RATER_REMINDER_AFTER_H);
  const nowIso = new Date().toISOString();

  const { data: rows, error: rowsError } = await admin
    .from('invitations')
    .select('id, token, invited_email, invitation_type, last_reminder_at, reminder_count, parent_assessment_id')
    .eq('status', 'pending')
    .eq('invitation_type', 'fremdbild')
    .is('unsubscribed_at', null)
    .gt('expires_at', nowIso)
    .lt('created_at', createdCutoff)
    .lt('reminder_count', RATER_MAX_REMINDERS)
    .limit(BATCH);

  if (rowsError) {
    // Vorher verschluckte ein kaputtes Embed (profile:user_id(...), KEIN FK
    // assessments→profiles) den Fehler still → (rows ?? []) = [] → es wurden NIE
    // Rater-Erinnerungen versendet. Jetzt wird der Fehler sichtbar protokolliert.
    console.error('[rater-reminders] invitation lookup failed', {
      code: rowsError.code,
      message: rowsError.message,
    });
  }

  // Trainerprofile gesammelt nachladen (kein FK assessments→profiles, deshalb kein
  // Embed): parent_assessment_id → assessments.user_id → profiles. Zwei Batch-Abfragen
  // statt eines nicht auflösbaren Embeds oder N+1.
  const raterRows = (rows ?? []) as any[];
  const assessmentIds = Array.from(
    new Set(raterRows.map((r) => r.parent_assessment_id).filter(Boolean)),
  );
  const userByAssessment = new Map<string, string>();
  if (assessmentIds.length) {
    const { data: assessmentsRows } = await admin
      .from('assessments')
      .select('id, user_id')
      .in('id', assessmentIds);
    for (const a of (assessmentsRows ?? []) as any[]) {
      if (a.user_id) userByAssessment.set(a.id, a.user_id);
    }
  }
  const userIds = Array.from(new Set(Array.from(userByAssessment.values())));
  const profileByUser = new Map<string, { full_name: string | null; sport: string | null }>();
  if (userIds.length) {
    const { data: profileRows } = await admin
      .from('profiles')
      .select('id, full_name, sport')
      .in('id', userIds);
    for (const p of (profileRows ?? []) as any[]) {
      profileByUser.set(p.id, { full_name: p.full_name ?? null, sport: p.sport ?? null });
    }
  }

  let sent = 0;
  for (const r of raterRows) {
    // Nicht öfter als alle RATER_REMINDER_AFTER_H Stunden erinnern.
    if (r.last_reminder_at && r.last_reminder_at > reminderCutoff) continue;
    const email = r.invited_email;
    if (!email) continue;
    const raterUserId = userByAssessment.get(r.parent_assessment_id);
    const raterProfile = raterUserId ? profileByUser.get(raterUserId) : undefined;
    const trainerName = raterProfile?.full_name ?? 'Ein Trainer';
    const sport = raterProfile?.sport ?? null;
    const { subject, html } = buildRaterReminderEmail({ trainerName, sport, token: r.token });
    const res = await sendEmailSafe({
      to: email, subject, html,
      // List-Unsubscribe-Header → echter One-Click-POST-Endpoint (RFC 8058).
      // Der sichtbare „Hier abmelden"-Link in der Mail bleibt die GET-Seite.
      unsubscribeUrl: `${appUrl()}/api/unsubscribe?token=${r.token}`,
      category: 'rater-reminder',
    });
    if (res.ok) {
      await admin.from('invitations')
        .update({ last_reminder_at: new Date().toISOString(), reminder_count: (r.reminder_count ?? 0) + 1 })
        .eq('id', r.id);
      sent += 1;
    }
  }
  return { attempted: (rows ?? []).length, sent };
}

// ---------------------------------------------------------------------------
// Sender (ereignisbasiert, beim Abschluss einer Fremdbild-Einladung)
// ---------------------------------------------------------------------------

/**
 * Benachrichtigt den Trainer beim Eingang einer Fremdeinschätzung — genau an
 * zwei Meilensteinen: bei der ersten Antwort und beim Erreichen von
 * FREMDBILD_MIN. So bekommt der Trainer Sichtbarkeit ohne Spam.
 */
export async function notifyTrainerOnFremdbildResponse(
  admin: SupabaseClient,
  parentAssessmentId: string,
): Promise<{ sent: boolean; milestone?: 'first' | 'threshold' }> {
  const { count } = await admin
    .from('invitations')
    .select('id', { count: 'exact', head: true })
    .eq('parent_assessment_id', parentAssessmentId)
    .eq('invitation_type', 'fremdbild')
    .eq('status', 'completed');

  const completed = count ?? 0;
  if (completed < 1) return { sent: false };

  const nowIso = new Date().toISOString();

  // Idempotent + race-sicher über atomare Claims auf den notified_at-Spalten.
  // Schwellen-Logik mit >= (statt ==), damit kein Meilenstein „übersprungen"
  // wird, wenn zwei Antworten fast gleichzeitig eintreffen und der gezählte
  // Wert die Schwelle in einem Schritt überspringt.
  //
  //  - Ab FREMDBILD_MIN: Threshold-Mail (höchster Meilenstein). first wird
  //    dabei mitmarkiert, damit keine verspätete „erste"-Mail mehr feuert.
  //  - Sonst (1 <= completed < MIN): einmalig die „erste"-Mail.
  let kind: 'first' | 'threshold';
  let won = false;

  if (completed >= FREMDBILD_MIN) {
    kind = 'threshold';
    const { data: claimed } = await admin
      .from('assessments')
      .update({ threshold_notified_at: nowIso })
      .eq('id', parentAssessmentId)
      .is('threshold_notified_at', null)
      .select('id');
    won = (claimed?.length ?? 0) > 0;
    if (won) {
      // Verspätete „erste"-Mail unterdrücken (best effort, nur falls noch offen).
      await admin
        .from('assessments')
        .update({ first_response_notified_at: nowIso })
        .eq('id', parentAssessmentId)
        .is('first_response_notified_at', null);
    }
  } else {
    kind = 'first';
    const { data: claimed } = await admin
      .from('assessments')
      .update({ first_response_notified_at: nowIso })
      .eq('id', parentAssessmentId)
      .is('first_response_notified_at', null)
      .select('id');
    won = (claimed?.length ?? 0) > 0;
  }

  if (!won) return { sent: false };

  const { data: assessment } = await admin
    .from('assessments')
    .select('id, user_id')
    .eq('id', parentAssessmentId)
    .single();
  if (!assessment) return { sent: false };

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email')
    .eq('id', (assessment as any).user_id)
    .single();

  const email = (profile as any)?.email;
  if (!email) return { sent: false };

  const { subject, html } = buildTrainerProgressEmail({
    firstName: (profile as any)?.full_name?.split(' ')[0] ?? 'Trainer',
    kind,
    responseCount: completed,
    assessmentId: parentAssessmentId,
  });
  const res = await sendEmailSafe({ to: email, subject, html, category: `trainer-progress-${kind}` });
  return { sent: res.ok, milestone: kind };
}
