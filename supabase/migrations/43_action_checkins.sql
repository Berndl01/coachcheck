-- ============================================================
-- MIGRATION 43 — AKTIONSBEREICH: TÄGLICHE CHECK-INS (Bestcase §12)
-- ============================================================
--
-- Schließt die 7-Tage-Schleife: pro Tag genau ein Check-in zum aktiven Fokus
-- („heute dran gewesen"). Daraus entstehen Fortschritt (X von Ziel-Tagen),
-- Streak und schließlich der Abschluss des Fokus.
--
-- Ein vorhandener Check-in-Datensatz für einen Tag = an diesem Tag erledigt.
-- (Kein bool-Flag nötig; Abwesenheit = nicht erledigt.) Optionale kurze Notiz.
--
-- RLS: Eigentümer liest nur; geschrieben wird ausschließlich über service_role
-- aus /api/action/[planId].
--
-- Idempotent.
-- ============================================================

create table if not exists public.action_checkins (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.action_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Der Kalendertag des Check-ins (genau einer pro Plan und Tag).
  checkin_date date not null,
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now(),
  unique (plan_id, checkin_date)
);

create index if not exists idx_action_checkins_plan
  on public.action_checkins(plan_id, checkin_date desc);

alter table public.action_checkins enable row level security;

drop policy if exists "action_checkins_owner_select" on public.action_checkins;
create policy "action_checkins_owner_select" on public.action_checkins
  for select to authenticated using (auth.uid() = user_id);

-- BEWUSST keine INSERT/UPDATE/DELETE-Policy für authenticated:
-- Schreiben erfolgt nur über service_role aus /api/action/[planId].

grant select on public.action_checkins to authenticated;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'action_checkins'
  ) then
    raise exception 'action_checkins fehlt';
  end if;

  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'action_checkins' and c.contype = 'u'
  ) then
    raise exception 'Unique(plan_id, checkin_date) fehlt';
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'action_checkins' and policyname = 'action_checkins_owner_select'
  ) then
    raise exception 'action_checkins_owner_select fehlt';
  end if;

  if exists (
    select 1 from pg_policies
    where tablename = 'action_checkins' and cmd in ('INSERT', 'UPDATE', 'DELETE')
  ) then
    raise exception 'action_checkins darf keine Schreib-Policy haben (nur service_role schreibt)';
  end if;

  raise notice 'Migration 43 OK (Aktionsbereich: action_checkins).';
end $$;
