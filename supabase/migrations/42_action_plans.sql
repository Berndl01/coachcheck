-- ============================================================
-- MIGRATION 42 — AKTIONSBEREICH: AKTIONSPLÄNE (Bestcase §11/§12/§24)
-- ============================================================
--
-- Der Schritt von „verstehen" zu „umsetzen": Der nächste sinnvolle Schritt aus
-- dem Ergebnis wird zu einem trackbaren 7-Tage-Fokus, sichtbar auf dem Dashboard.
--
-- Slice 1 (diese Migration): die Plan-Tabelle selbst. Die tägliche Check-in-
-- Schleife (action_checkins) folgt in einer eigenen Migration, sobald sie
-- verdrahtet wird — jede Migration trägt nur ausgelieferte Funktion.
--
-- RLS: Eigentümer darf LESEN; geschrieben wird ausschließlich über service_role
-- aus den Aktions-Routen (konsistent zum Hardening-Muster).
--
-- Idempotent.
-- ============================================================

create table if not exists public.action_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  -- Kurze Überschrift des Fokus (z. B. der Profil-Hebel).
  title text not null check (char_length(title) between 1 and 160),
  -- Der konkrete Schritt für die nächsten Tage.
  action text not null check (char_length(action) between 1 and 600),
  -- Herkunft des Schritts (interner Anker, z. B. 'signature_lever').
  source text check (source is null or char_length(source) <= 60),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  target_days smallint not null default 7 check (target_days between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_action_plans_user
  on public.action_plans(user_id, status);
create index if not exists idx_action_plans_assessment
  on public.action_plans(assessment_id);

-- Höchstens EIN aktiver Fokus pro (Nutzer, Assessment).
create unique index if not exists ux_action_plans_one_active
  on public.action_plans(user_id, assessment_id)
  where status = 'active';

alter table public.action_plans enable row level security;

drop policy if exists "action_plans_owner_select" on public.action_plans;
create policy "action_plans_owner_select" on public.action_plans
  for select to authenticated using (auth.uid() = user_id);

-- BEWUSST keine INSERT/UPDATE/DELETE-Policy für authenticated:
-- Schreiben erfolgt nur über service_role aus den /api/.../action-Routen.

grant select on public.action_plans to authenticated;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'action_plans'
  ) then
    raise exception 'action_plans fehlt';
  end if;

  if not exists (
    select 1 from pg_indexes
    where tablename = 'action_plans' and indexname = 'ux_action_plans_one_active'
  ) then
    raise exception 'Partial-Unique-Index ux_action_plans_one_active fehlt';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'action_plans' and policyname = 'action_plans_owner_select'
  ) then
    raise exception 'action_plans_owner_select fehlt';
  end if;

  if exists (
    select 1 from pg_policies
    where tablename = 'action_plans' and cmd in ('INSERT', 'UPDATE', 'DELETE')
  ) then
    raise exception 'action_plans darf keine Schreib-Policy haben (nur service_role schreibt)';
  end if;

  raise notice 'Migration 42 OK (Aktionsbereich: action_plans).';
end $$;
