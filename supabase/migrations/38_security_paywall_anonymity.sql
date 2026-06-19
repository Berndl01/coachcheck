-- ============================================================
-- MIGRATION 38 — SICHERHEIT & DATENSCHUTZ (Saison/Pulse/Invitations)
-- ============================================================
--
-- Schließt mehrere echte Berechtigungs-/Datenschutzlücken:
--   (A) Saison-Monitor (Tier 5) war ohne Kauf nutzbar → seasons an bezahlten
--       Tier-5-Kauf binden + direkte Browser-Schreibrechte entfernen.
--   (B) Pulse-Aggregate wurden schon ab 1 Antwort sichtbar → Anonymitäts-
--       schwelle (>= 5) in der DB erzwingen.
--   (C) Trainer (Owner) konnte einzelne Pulse-Antworten direkt lesen → SELECT-
--       Policy auf pulse_responses entfernen (nur noch Aggregat via RPC).
--   (D) Spieler-Einladungen mit E-Mail (sollen anonym sein) → DB-Check.
--
-- Server-Routen schreiben via service_role (umgehen RLS); die UI nutzt
-- ausschließlich diese Routen. Owner behalten Lesezugriff. Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- (A1) seasons an einen bezahlten Tier-5-Kauf binden
-- ------------------------------------------------------------
alter table public.seasons
  add column if not exists purchase_id uuid references public.purchases(id) on delete restrict;

-- Genau eine Saison pro Kauf.
create unique index if not exists seasons_purchase_unique
  on public.seasons (purchase_id) where purchase_id is not null;

-- ------------------------------------------------------------
-- (A2) Direkte Browser-Schreibrechte entfernen — nur noch Lesezugriff.
--      Schreiben passiert serverseitig (service_role) nach Kauf-/Tier-Prüfung.
-- ------------------------------------------------------------
drop policy if exists "seasons_owner_all" on public.seasons;
drop policy if exists "seasons_owner_select" on public.seasons;
create policy "seasons_owner_select" on public.seasons
  for select using (auth.uid() = user_id);

drop policy if exists "pulse_cycles_owner" on public.pulse_cycles;
drop policy if exists "pulse_cycles_owner_select" on public.pulse_cycles;
create policy "pulse_cycles_owner_select" on public.pulse_cycles
  for select using (
    exists (select 1 from public.seasons s where s.id = pulse_cycles.season_id and s.user_id = auth.uid())
  );

drop policy if exists "pulse_invitations_owner" on public.pulse_invitations;
drop policy if exists "pulse_invitations_owner_select" on public.pulse_invitations;
create policy "pulse_invitations_owner_select" on public.pulse_invitations
  for select to authenticated using (
    exists (select 1 from public.seasons s where s.id = pulse_invitations.season_id and s.user_id = auth.uid())
  );

-- Breiter anonymer Lesezugriff auf ALLE Einladungen war zu offen → entfernen.
-- Token-Lookup für die öffentliche Pulse-Seite läuft serverseitig (service_role).
drop policy if exists "pulse_invitations_anon_read" on public.pulse_invitations;

-- ------------------------------------------------------------
-- (C) Owner darf einzelne Pulse-Antworten NICHT direkt lesen (Anonymität).
--     Aggregate kommen ausschließlich über compute_pulse_snapshot (>= 5).
--     Anonymes Einfügen durch Teilnehmer bleibt erhalten.
-- ------------------------------------------------------------
drop policy if exists "pulse_responses_owner_select" on public.pulse_responses;

-- ------------------------------------------------------------
-- (B) Anonymitätsschwelle in compute_pulse_snapshot: erst ab 5 Teilnehmern
--     werden Dimensionswerte ausgegeben. Darunter: leere Werte + Flag.
-- ------------------------------------------------------------
create or replace function public.compute_pulse_snapshot(cycle_uuid uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with answered as (
    select pr.respondent_token
    from public.pulse_responses pr
    where pr.pulse_cycle_id = cycle_uuid
    group by pr.respondent_token
  ),
  cnt as (select count(*)::int as n from answered),
  by_dim as (
    select pi.dimension,
      avg(case when pi.reverse_scored then 6 - pr.value_numeric else pr.value_numeric end) as avg_val
    from public.pulse_responses pr
    join public.pulse_items pi on pi.id = pr.pulse_item_id
    where pr.pulse_cycle_id = cycle_uuid
    group by pi.dimension
  )
  select jsonb_build_object(
    'response_count', (select n from cnt),
    'below_threshold', (select n from cnt) < 5,
    'dimensions',
      case when (select n from cnt) >= 5
        then coalesce((select jsonb_object_agg(by_dim.dimension, round(by_dim.avg_val, 2)) from by_dim), '{}'::jsonb)
        else '{}'::jsonb
      end
  );
$$;

grant execute on function public.compute_pulse_snapshot(uuid) to authenticated;

-- ------------------------------------------------------------
-- (B2) Trendvergleich nur, wenn BEIDE Zyklen >= 5 Antworten haben.
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
  threshold numeric := 0.4;
begin
  select snapshot into current_snap from public.pulse_cycles where id = cycle_uuid;
  if current_snap is null or current_snap->'dimensions' is null then return '[]'::jsonb; end if;
  -- Anonymitätsschwelle: aktueller Zyklus muss >= 5 Antworten haben.
  if coalesce((current_snap->>'response_count')::int, 0) < 5 then return '[]'::jsonb; end if;

  select snapshot into prev_snap
  from public.pulse_cycles
  where season_id = season_uuid and id != cycle_uuid and status = 'closed' and snapshot is not null
  order by cycle_number desc
  limit 1;

  if prev_snap is null then return '[]'::jsonb; end if;
  -- ... und der Vergleichszyklus ebenfalls.
  if coalesce((prev_snap->>'response_count')::int, 0) < 5 then return '[]'::jsonb; end if;

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

-- ------------------------------------------------------------
-- (D) Spieler-Einladungen dürfen KEINE E-Mail tragen (anonymer TeamCheck).
--     NOT VALID: blockiert neue Verstöße, ohne Altbestand zu prüfen.
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'invitations_spieler_no_email'
  ) then
    alter table public.invitations
      add constraint invitations_spieler_no_email
      check (invitation_type <> 'spieler' or invited_email is null) not valid;
  end if;
end $$;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='seasons' and column_name='purchase_id') then
    raise exception 'seasons.purchase_id fehlt';
  end if;
  if exists (select 1 from pg_policies where tablename='seasons' and policyname='seasons_owner_all') then
    raise exception 'seasons_owner_all haette entfernt werden muessen';
  end if;
  if exists (select 1 from pg_policies where tablename='pulse_responses' and policyname='pulse_responses_owner_select') then
    raise exception 'pulse_responses_owner_select haette entfernt werden muessen';
  end if;
  if not exists (select 1 from pg_constraint where conname='invitations_spieler_no_email') then
    raise exception 'invitations_spieler_no_email fehlt';
  end if;
  raise notice 'Migration 38 OK (Saison-Paywall + Pulse-Schwelle + RLS-Lockdown + Invitation-Check).';
end $$;
