-- ============================================================
-- MIGRATION 32 — FORTSCHRITTS- & ERINNERUNGS-MAILS: TRACKING
-- ============================================================
--
-- Damit Erinnerungen nicht doppelt rausgehen und der Cron-Lauf gezielt nur
-- offene Fälle greift, bekommen invitations und assessments Tracking-Spalten.
-- Versand selbst läuft über Resend (sendEmailSafe), idempotent & statusverfolgt.
-- ============================================================

-- Rater-Erinnerungen (Fremdbild/360°): wann zuletzt erinnert, wie oft.
alter table public.invitations
  add column if not exists last_reminder_at timestamptz,
  add column if not exists reminder_count   integer not null default 0;

-- „Mach weiter"-Erinnerung für angefangene, nicht beendete Assessments.
alter table public.assessments
  add column if not exists resume_reminder_at    timestamptz,
  add column if not exists resume_reminder_count integer not null default 0;

-- Cron-Query 1: offene Fremdbild-Einladungen, nicht abgemeldet, nicht abgelaufen.
create index if not exists invitations_reminder_pending_idx
  on public.invitations (created_at)
  where status = 'pending' and unsubscribed_at is null;

-- Cron-Query 2: angefangene, unfertige Assessments ohne gesendete Erinnerung.
create index if not exists assessments_resume_pending_idx
  on public.assessments (created_at)
  where status in ('pending', 'in_progress') and resume_reminder_count = 0;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='invitations' and column_name='reminder_count'
  ) then
    raise exception 'invitations.reminder_count fehlt';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='assessments' and column_name='resume_reminder_count'
  ) then
    raise exception 'assessments.resume_reminder_count fehlt';
  end if;
  raise notice 'Fortschritts-/Erinnerungs-Tracking OK (invitations + assessments).';
end $$;
