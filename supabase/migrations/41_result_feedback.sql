-- ============================================================
-- MIGRATION 41 — TREFFER-FEEDBACK (Bestcase §27)
-- ============================================================
--
-- Erfasst nach dem Ergebnis: „Wie gut erkennst du dich in diesem Profil
-- wieder?" (0–10) plus optional „Welcher Teil war am hilfreichsten?".
--
-- WICHTIG (§27): Dieses Feedback dient ausschließlich der Produktverbesserung
-- und darf den berechneten Score NIE verändern. Deshalb eine eigene Tabelle,
-- vollständig getrennt von assessments/axis_scores. Der Schreibpfad läuft
-- ausschließlich über service_role in der Route (keine INSERT/UPDATE-Policy für
-- authenticated → RLS verweigert direkte Browser-Schreibversuche).
--
-- Idempotent.
-- ============================================================

create table if not exists public.result_feedback (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Wiedererkennung 0–10 (Pflicht).
  recognition smallint not null check (recognition >= 0 and recognition <= 10),
  -- Hilfreichster Abschnitt (optional, Section-Key; Whitelist in der Route).
  most_helpful text check (most_helpful is null or char_length(most_helpful) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Genau ein Feedback pro Assessment (Upsert in der Route).
  unique (assessment_id)
);

create index if not exists idx_result_feedback_assessment
  on public.result_feedback(assessment_id);

alter table public.result_feedback enable row level security;

-- Eigentümer darf sein eigenes Feedback LESEN (Defense-in-Depth; die
-- Ergebnis-Seite lädt es ohnehin serverseitig über service_role).
drop policy if exists "result_feedback_owner_select" on public.result_feedback;
create policy "result_feedback_owner_select" on public.result_feedback
  for select to authenticated using (auth.uid() = user_id);

-- BEWUSST keine INSERT/UPDATE/DELETE-Policy für authenticated:
-- Schreiben erfolgt nur über service_role aus /api/assessment/[id]/feedback.

grant select on public.result_feedback to authenticated;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'result_feedback'
  ) then
    raise exception 'result_feedback fehlt';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'result_feedback' and policyname = 'result_feedback_owner_select'
  ) then
    raise exception 'result_feedback_owner_select fehlt';
  end if;

  -- Es darf KEINE schreibende Policy für authenticated geben.
  if exists (
    select 1 from pg_policies
    where tablename = 'result_feedback' and cmd in ('INSERT', 'UPDATE', 'DELETE')
  ) then
    raise exception 'result_feedback darf keine Schreib-Policy haben (nur service_role schreibt)';
  end if;

  raise notice 'Migration 41 OK (Treffer-Feedback).';
end $$;
