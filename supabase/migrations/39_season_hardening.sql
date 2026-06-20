-- ============================================================
-- MIGRATION 39 — SAISON-HÄRTUNG (Korrektur der v3_41-Regressionen)
-- ============================================================
--
-- (A) Pulse-Aggregations-RPCs wieder ausschließlich für service_role. Migration 38
--     hatte sie versehentlich wieder an authenticated freigegeben — damit hätte ein
--     registrierter Nutzer mit bekannter cycle_id Team-Aggregate direkt abrufen
--     können. Aufgerufen werden sie nur serverseitig (Close-Route via service_role).
-- (B) Bestandsdaten: Saisons OHNE purchase_id (kostenlos aus älteren Versionen)
--     archivieren → kein Zugriff mehr.
-- (C) Neue Saisons MÜSSEN eine purchase_id haben (Insert-Trigger; ein hartes
--     NOT NULL ist wegen der archivierten Alt-Zeilen nicht möglich).
-- (D) Höchstens EIN offener Pulse-Zyklus pro Saison (Unique-Index).
--
-- Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- (A) RPC-Ausführung nur noch service_role
-- ------------------------------------------------------------
revoke execute on function public.compute_pulse_snapshot(uuid) from public;
revoke execute on function public.compute_pulse_snapshot(uuid) from anon;
revoke execute on function public.compute_pulse_snapshot(uuid) from authenticated;
grant  execute on function public.compute_pulse_snapshot(uuid) to service_role;

revoke execute on function public.detect_pulse_trends(uuid, uuid) from public;
revoke execute on function public.detect_pulse_trends(uuid, uuid) from anon;
revoke execute on function public.detect_pulse_trends(uuid, uuid) from authenticated;
grant  execute on function public.detect_pulse_trends(uuid, uuid) to service_role;

-- ------------------------------------------------------------
-- (B) Alt-Saisons ohne Kauf sperren (archivieren)
-- ------------------------------------------------------------
update public.seasons
   set status = 'archived', updated_at = now()
 where purchase_id is null
   and status <> 'archived';

-- Zugehörige offene Pulse-Einladungen/Zyklen dieser Saisons stilllegen.
update public.pulse_invitations pi
   set status = 'revoked'
 where pi.status <> 'revoked'
   and exists (select 1 from public.seasons s where s.id = pi.season_id and s.purchase_id is null);

update public.pulse_cycles pc
   set status = 'archived'
 where pc.status = 'open'
   and exists (select 1 from public.seasons s where s.id = pc.season_id and s.purchase_id is null);

-- ------------------------------------------------------------
-- (C) Neue Saisons brauchen zwingend eine purchase_id
-- ------------------------------------------------------------
create or replace function public.enforce_season_purchase()
returns trigger
language plpgsql
as $$
begin
  if new.purchase_id is null then
    raise exception 'Saison erfordert einen gueltigen Kauf (purchase_id darf nicht null sein).';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_season_purchase on public.seasons;
create trigger trg_enforce_season_purchase
  before insert on public.seasons
  for each row execute function public.enforce_season_purchase();

-- ------------------------------------------------------------
-- (D) Höchstens ein offener Zyklus pro Saison
-- ------------------------------------------------------------
-- PREFLIGHT/SELF-REPAIR: Falls in einer bestehenden Datenbank bereits mehr als
-- ein offener Cycle pro Saison existiert, würde der folgende Unique-Index beim
-- Aufbau abbrechen und damit die GESAMTE Migration fehlschlagen lassen.
-- Daher räumen wir vorher kontrolliert auf: pro Saison bleibt genau der Cycle
-- mit der höchsten cycle_number offen, alle älteren offenen Cycles werden auf
-- 'archived' gesetzt (ohne Snapshot — sie hatten ohnehin keine Auswertung).
-- Idempotent: lässt bereits saubere Datenbanken unverändert.
with ranked as (
  select
    id,
    row_number() over (
      partition by season_id
      order by cycle_number desc, created_at desc, id desc
    ) as rn
  from public.pulse_cycles
  where status = 'open'
)
update public.pulse_cycles c
set status = 'archived'
from ranked r
where c.id = r.id
  and r.rn > 1;

create unique index if not exists pulse_cycles_one_open_per_season
  on public.pulse_cycles (season_id)
  where status = 'open';

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
declare
  v_can_auth boolean;
begin
  -- authenticated darf compute_pulse_snapshot NICHT mehr ausführen
  select has_function_privilege('authenticated', 'public.compute_pulse_snapshot(uuid)', 'EXECUTE')
    into v_can_auth;
  if v_can_auth then
    raise exception 'compute_pulse_snapshot ist fuer authenticated noch ausfuehrbar';
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_enforce_season_purchase') then
    raise exception 'trg_enforce_season_purchase fehlt';
  end if;
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='pulse_cycles_one_open_per_season'
  ) then
    raise exception 'pulse_cycles_one_open_per_season fehlt';
  end if;
  raise notice 'Migration 39 OK (RPC-Lockdown + Saison-Bereinigung + Ein-offener-Cycle).';
end $$;
