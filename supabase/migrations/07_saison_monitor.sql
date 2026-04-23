-- ============================================================
-- MIGRATION 07 — SAISON-MONITOR (Tier 5)
-- ============================================================
--
-- Konzept:
-- Pro gekauftem Saison-Paket gibt es einen "season"-Datensatz.
-- Jeden Monat wird ein "pulse_cycle" gestartet (manuell oder geplant).
-- Spieler antworten auf 5-7 schnelle Items per Token-Link.
-- Snapshots werden gespeichert → Trends über Zeit erkennbar.
-- Frühwarnungen entstehen automatisch wenn Werte abfallen.
-- ============================================================

-- ------------------------------------------------------------
-- 1. SEASONS — eine pro gekauftem Saison-Paket
-- ------------------------------------------------------------
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  name text not null default 'Saison',
  sport text,
  team_size_estimate int,
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  pulse_interval_days int not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_seasons_user on public.seasons(user_id);
create index if not exists idx_seasons_status on public.seasons(status);

-- ------------------------------------------------------------
-- 2. PULSE CYCLES — eine pro Monat / Pulse-Runde
-- ------------------------------------------------------------
create table if not exists public.pulse_cycles (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  cycle_number int not null,
  started_at timestamptz not null default now(),
  closes_at timestamptz not null default (now() + interval '14 days'),
  closed_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed', 'expired', 'archived')),
  -- Aggregated snapshot (gefüllt beim Schließen)
  snapshot jsonb,
  response_count int default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_pulse_cycles_season on public.pulse_cycles(season_id);
create index if not exists idx_pulse_cycles_status on public.pulse_cycles(status);

-- ------------------------------------------------------------
-- 3. PULSE ITEMS — kompakter Item-Pool für monatliche Checks
-- ------------------------------------------------------------
-- Diese Items werden NICHT in der normalen items-Tabelle abgelegt,
-- sondern in einer eigenen, weil sie ein anderes Format haben:
-- alle likert_5, kürzere Texte, gleicher Pool jeden Monat.
-- ------------------------------------------------------------
create table if not exists public.pulse_items (
  id serial primary key,
  code text unique not null,
  dimension text not null check (dimension in ('coach_impact', 'psy_safety', 'team_klima', 'belastung', 'wir_gefuehl', 'fokus')),
  text_de text not null,
  reverse_scored boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

-- Seed: 8 prägnante Pulse-Items
insert into public.pulse_items (code, dimension, text_de, reverse_scored) values
  ('P_ci_01', 'coach_impact', 'Mein Trainer hat mich diese Woche gesehen.', false),
  ('P_ci_02', 'coach_impact', 'Die Kommunikation war diese Woche klar.', false),
  ('P_ps_01', 'psy_safety', 'Ich konnte ehrlich sagen was ich denke.', false),
  ('P_tk_01', 'team_klima', 'Die Stimmung im Team war gut.', false),
  ('P_be_01', 'belastung', 'Der Druck war diese Woche zu hoch.', true),
  ('P_wg_01', 'wir_gefuehl', 'Ich fühlte mich als Teil des Teams.', false),
  ('P_fk_01', 'fokus', 'Wir hatten klaren Fokus auf das Wesentliche.', false),
  ('P_ci_03', 'coach_impact', 'Ich habe mich vom Trainer wertgeschätzt gefühlt.', false)
on conflict (code) do nothing;

-- ------------------------------------------------------------
-- 4. PULSE RESPONSES — Antworten der Spieler pro Cycle
-- ------------------------------------------------------------
create table if not exists public.pulse_responses (
  id uuid primary key default gen_random_uuid(),
  pulse_cycle_id uuid not null references public.pulse_cycles(id) on delete cascade,
  pulse_item_id int not null references public.pulse_items(id),
  value_numeric int not null check (value_numeric between 1 and 5),
  -- token allows player to revise; player identity stays anonymous
  respondent_token text not null,
  created_at timestamptz not null default now(),
  unique(pulse_cycle_id, pulse_item_id, respondent_token)
);

create index if not exists idx_pulse_responses_cycle on public.pulse_responses(pulse_cycle_id);
create index if not exists idx_pulse_responses_token on public.pulse_responses(respondent_token);

-- ------------------------------------------------------------
-- 5. PULSE INVITATIONS — Spieler-Token für aktive Cycles
-- ------------------------------------------------------------
create table if not exists public.pulse_invitations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  token text unique not null,
  label text,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now()
);

create index if not exists idx_pulse_invitations_season on public.pulse_invitations(season_id);
create index if not exists idx_pulse_invitations_token on public.pulse_invitations(token);

-- Auto-token via trigger
create or replace function public.set_pulse_invitation_token()
returns trigger language plpgsql as $$
begin
  if new.token is null or new.token = '' then
    new.token := replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'), '=', '');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pulse_invitation_token on public.pulse_invitations;
create trigger trg_pulse_invitation_token
  before insert on public.pulse_invitations
  for each row execute function public.set_pulse_invitation_token();

-- ------------------------------------------------------------
-- 6. RLS POLICIES
-- ------------------------------------------------------------
alter table public.seasons enable row level security;
alter table public.pulse_cycles enable row level security;
alter table public.pulse_items enable row level security;
alter table public.pulse_responses enable row level security;
alter table public.pulse_invitations enable row level security;

-- Seasons: nur Owner
drop policy if exists "seasons_owner_all" on public.seasons;
create policy "seasons_owner_all" on public.seasons
  for all using (auth.uid() = user_id);

-- Pulse cycles: Owner über Season
drop policy if exists "pulse_cycles_owner" on public.pulse_cycles;
create policy "pulse_cycles_owner" on public.pulse_cycles
  for all using (exists (select 1 from public.seasons s where s.id = pulse_cycles.season_id and s.user_id = auth.uid()));

-- Pulse items: öffentlich lesbar (Stammdaten)
drop policy if exists "pulse_items_read" on public.pulse_items;
create policy "pulse_items_read" on public.pulse_items
  for select using (active = true);

-- Pulse responses: Owner über Season + anonyme Token-User dürfen einfügen
drop policy if exists "pulse_responses_owner_select" on public.pulse_responses;
create policy "pulse_responses_owner_select" on public.pulse_responses
  for select using (
    exists (
      select 1 from public.pulse_cycles pc
      join public.seasons s on s.id = pc.season_id
      where pc.id = pulse_responses.pulse_cycle_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "pulse_responses_anon_insert" on public.pulse_responses;
create policy "pulse_responses_anon_insert" on public.pulse_responses
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.pulse_cycles pc
      where pc.id = pulse_responses.pulse_cycle_id and pc.status = 'open'
    )
  );

-- Pulse invitations: Owner alles, anonyme Token-Lookup erlaubt
drop policy if exists "pulse_invitations_owner" on public.pulse_invitations;
create policy "pulse_invitations_owner" on public.pulse_invitations
  for all to authenticated
  using (exists (select 1 from public.seasons s where s.id = pulse_invitations.season_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.seasons s where s.id = pulse_invitations.season_id and s.user_id = auth.uid()));

drop policy if exists "pulse_invitations_anon_read" on public.pulse_invitations;
create policy "pulse_invitations_anon_read" on public.pulse_invitations
  for select to anon, authenticated using (true);

-- ------------------------------------------------------------
-- 7. AGGREGATION FUNCTION — Snapshot pro Cycle
-- ------------------------------------------------------------
create or replace function public.compute_pulse_snapshot(cycle_uuid uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with answered as (
    select pr.respondent_token from public.pulse_responses pr where pr.pulse_cycle_id = cycle_uuid group by pr.respondent_token
  ),
  by_dim as (
    select pi.dimension,
      avg(case when pi.reverse_scored then 6 - pr.value_numeric else pr.value_numeric end) as avg_val,
      count(distinct pr.respondent_token) as n_tokens
    from public.pulse_responses pr
    join public.pulse_items pi on pi.id = pr.pulse_item_id
    where pr.pulse_cycle_id = cycle_uuid
    group by pi.dimension
  )
  select jsonb_build_object(
    'response_count', (select count(*) from answered),
    'dimensions', coalesce(jsonb_object_agg(by_dim.dimension, round(by_dim.avg_val, 2)), '{}'::jsonb)
  )
  from by_dim;
$$;

grant execute on function public.compute_pulse_snapshot(uuid) to authenticated;

-- ------------------------------------------------------------
-- 8. TREND DETECTION — vergleicht aktuellen Cycle mit Vorgänger
-- ------------------------------------------------------------
create or replace function public.detect_pulse_trends(season_uuid uuid, cycle_uuid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_snap jsonb;
  prev_snap jsonb;
  result jsonb := '[]'::jsonb;
  dim text;
  cur_val numeric;
  prev_val numeric;
  delta numeric;
  threshold numeric := 0.4; -- Veränderung um 0.4 Punkte (Likert) = relevant
begin
  -- Get current cycle snapshot
  select snapshot into current_snap from public.pulse_cycles where id = cycle_uuid;
  if current_snap is null or current_snap->'dimensions' is null then return '[]'::jsonb; end if;

  -- Get previous closed cycle for same season
  select snapshot into prev_snap
  from public.pulse_cycles
  where season_id = season_uuid and id != cycle_uuid and status = 'closed' and snapshot is not null
  order by cycle_number desc
  limit 1;

  if prev_snap is null then return '[]'::jsonb; end if;

  for dim in select jsonb_object_keys(current_snap->'dimensions')
  loop
    cur_val := (current_snap->'dimensions'->>dim)::numeric;
    prev_val := (prev_snap->'dimensions'->>dim)::numeric;
    if cur_val is null or prev_val is null then continue; end if;
    delta := cur_val - prev_val;
    if abs(delta) >= threshold then
      result := result || jsonb_build_object(
        'dimension', dim,
        'previous', prev_val,
        'current', cur_val,
        'delta', round(delta, 2),
        'severity', case when abs(delta) >= 0.7 then 'kritisch' when abs(delta) >= 0.5 then 'hoch' else 'moderat' end,
        'direction', case when delta > 0 then 'aufwärts' else 'abwärts' end
      );
    end if;
  end loop;

  return result;
end;
$$;

grant execute on function public.detect_pulse_trends(uuid, uuid) to authenticated;

-- ============================================================
-- DONE — Phase 7 Schema bereit.
-- 5 neue Tabellen + 8 Pulse-Items + 2 RPCs für Snapshot/Trends
-- ============================================================
