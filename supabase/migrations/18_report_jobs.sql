-- =====================================================================
-- 18_report_jobs.sql  —  Idempotente Report-Erzeugung (P0)
-- =====================================================================
-- Problem (Audit P0 #1/#2):
--   * finalize/route.ts setzt status='report_ready', BEVOR ein PDF existiert.
--   * report/route.ts hat KEINE Idempotenz-Klammer: Mehrfachklick = mehrere
--     teure KI-/PDF-/E-Mail-Läufe + doppelte reports-Zeilen.
--
-- Lösung dieser Migration:
--   * Eine report_jobs-Tabelle als atomare Lock-/Status-Schicht.
--   * Partial-Unique-Index: pro Assessment maximal EIN aktiver Job
--     (queued|processing). Ein konkurrierender zweiter Lauf scheitert beim
--     INSERT mit 23505 — derselbe 23505-Mechanismus wie im Stripe-Webhook.
--   * assessments.status bleibt im bestehenden CHECK-Enum
--     (pending|in_progress|completed|report_ready|archived). Die feinere
--     Job-Granularität (queued|processing|ready|failed) lebt in report_jobs,
--     damit keine riskante Constraint-Migration auf der von der ganzen UI
--     gelesenen status-Spalte nötig ist.
--
-- Idempotent & gefahrlos mehrfach ausführbar.
-- =====================================================================

create table if not exists public.report_jobs (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'queued'
                check (status in ('queued', 'processing', 'ready', 'failed')),
  report_id     uuid references public.reports(id) on delete set null,
  attempt_count int  not null default 1,
  locked_at     timestamptz,
  error_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Pro Assessment höchstens EIN aktiver Job → atomare Lock-Klammer.
create unique index if not exists report_jobs_one_active_per_assessment
  on public.report_jobs (assessment_id)
  where status in ('queued', 'processing');

create index if not exists report_jobs_assessment_idx
  on public.report_jobs (assessment_id);

-- updated_at automatisch pflegen
create or replace function public.touch_report_jobs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_report_jobs_updated_at on public.report_jobs;
create trigger trg_report_jobs_updated_at
  before update on public.report_jobs
  for each row execute function public.touch_report_jobs_updated_at();

-- ---------------------------------------------------------------------
-- RLS: Nutzer sehen nur eigene Jobs (lesend). Schreiben/Locken läuft
-- ausschließlich über den Service-Role-Key in der Report-Route.
-- ---------------------------------------------------------------------
alter table public.report_jobs enable row level security;

drop policy if exists report_jobs_select_own on public.report_jobs;
create policy report_jobs_select_own
  on public.report_jobs for select
  using (auth.uid() = user_id);

-- INSERT/UPDATE: keine Policy für normale Nutzer → nur Service-Role.
