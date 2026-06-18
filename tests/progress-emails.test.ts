import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildResumeReminderEmail,
  buildRaterReminderEmail,
  buildTrainerProgressEmail,
  FREMDBILD_MIN,
} from '../lib/email/progress-emails';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

describe('Resume-Nudge (angefangenes Assessment)', () => {
  const m = buildResumeReminderEmail({ firstName: 'Sam', productName: '360°-Spiegel', progressPct: 42, assessmentId: 'a1' });
  it('zeigt Fortschritt, Produkt und Weiter-Link', () => {
    expect(m.html).toContain('42%');
    expect(m.html).toContain('360°-Spiegel');
    expect(m.html).toMatch(/Weitermachen/);
    expect(m.html).toContain('/assessment/a1');
    expect(m.subject).toMatch(/Mach weiter/);
  });
});

describe('Rater-Reminder (Fremdbild-Geber)', () => {
  const m = buildRaterReminderEmail({ trainerName: 'Mara Vogt', sport: 'fussball', token: 'tok123' });
  it('nennt Trainer, Anonymität, Einschätz-Link und Abmeldung', () => {
    expect(m.html).toContain('Mara Vogt');
    expect(m.html).toMatch(/anonymisiert/);
    expect(m.html).toMatch(/Jetzt einschätzen/);
    expect(m.html).toContain('/einschaetzung/tok123');
    expect(m.html).toContain('?unsubscribe=1');
  });
  it('escaped Trainernamen (kein XSS in der Mail)', () => {
    const x = buildRaterReminderEmail({ trainerName: '<script>x</script>', sport: null, token: 't' });
    expect(x.html).not.toContain('<script>x</script>');
    expect(x.html).toContain('&lt;script&gt;');
  });
});

describe('Trainer-Fortschritt (360°)', () => {
  it('erste Antwort nennt 1 von MIN', () => {
    const m = buildTrainerProgressEmail({ firstName: 'Sam', kind: 'first', responseCount: 1, assessmentId: 'a1' });
    expect(m.html).toMatch(/erste/i);
    expect(m.html).toContain(String(FREMDBILD_MIN));
    expect(m.html).toContain('/assessment/a1/result');
  });
  it('Schwelle erreicht → Report erzeugbar', () => {
    const m = buildTrainerProgressEmail({ firstName: 'Sam', kind: 'threshold', responseCount: FREMDBILD_MIN, assessmentId: 'a1' });
    expect(m.subject).toMatch(/bereit/i);
    expect(m.html).toMatch(/erzeugen/);
  });
});

describe('Verdrahtung', () => {
  it('Complete-Route benachrichtigt den Trainer (nur Fremdbild)', () => {
    const c = read('app', 'api', 'invitations', '[token]', 'complete', 'route.ts');
    expect(c).toMatch(/notifyTrainerOnFremdbildResponse/);
    expect(c).toMatch(/invitation_type === 'fremdbild'/);
  });
  it('Reminder-Cron ist per CRON_SECRET geschützt', () => {
    const r = read('app', 'api', 'internal', 'reminders', 'route.ts');
    expect(r).toMatch(/CRON_SECRET/);
    expect(r).toMatch(/sendRaterReminders/);
    expect(r).toMatch(/sendResumeReminders/);
  });
  it('Migration 32 ergänzt Reminder-/Resume-Tracking', () => {
    const m = read('supabase', 'migrations', '32_progress_reminder_tracking.sql');
    expect(m).toMatch(/reminder_count/);
    expect(m).toMatch(/resume_reminder_count/);
  });
  it('vercel.json plant beide Cron-Läufe', () => {
    const v = JSON.parse(read('vercel.json'));
    const paths = (v.crons ?? []).map((c: any) => c.path);
    expect(paths).toContain('/api/internal/reminders');
    expect(paths).toContain('/api/internal/confirmation-retry');
  });
});
