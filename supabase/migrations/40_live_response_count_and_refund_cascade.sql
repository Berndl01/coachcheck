-- ============================================================
-- MIGRATION 40 — LIVE-ANTWORTZÄHLER + REFUND-KASKADE + PULSE-READ-LOCKDOWN
-- ============================================================
--
-- Behebt v3.42-Blocker:
--   (A) Antwortzahl eines OFFENEN Pulse-Cycles blieb immer 0, weil
--       response_count erst beim Schließen aktualisiert wurde. Der Trainer
--       konnte nicht erkennen, ob die Anonymitätsschwelle (>= 5) erreicht ist.
--       → Sichere Aggregatfunktion, die NUR count(distinct respondent_token)
--         liefert und in pulse_cycles.response_count schreibt. Nur service_role.
--   (B) Refund-Berechtigung für NORMALE Einladungen (Fremdbild/TeamCheck) +
--       Share-Link konsistent in Bestandsdaten nachziehen (der Webhook macht
--       das ab jetzt live; hier werden bereits erstattete Käufe nachgezogen).
--   (C) Defense-in-Depth: Nach Refund/Archivierung darf der Eigentümer
--       Pulse-Snapshots und Tokens auch NICHT mehr per direktem REST-Read sehen.
--       SELECT-Policies auf pulse_cycles/pulse_invitations verlangen jetzt einen
--       bezahlten Kauf + nicht-archivierte Saison.
--
-- Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- (A1) Reine Zählfunktion — count(distinct respondent_token).
--      Gibt KEINE Einzelantworten zurück. Nur service_role.
-- ------------------------------------------------------------
create or replace function public.get_pulse_cycle_response_count(cycle_uuid uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(distinct pr.respondent_token)::int
  from public.pulse_responses pr
  where pr.pulse_cycle_id = cycle_uuid;
$$;

revoke execute on function public.get_pulse_cycle_response_count(uuid) from public;
revoke execute on function public.get_pulse_cycle_response_count(uuid) from anon;
revoke execute on function public.get_pulse_cycle_response_count(uuid) from authenticated;
grant  execute on function public.get_pulse_cycle_response_count(uuid) to service_role;

-- ------------------------------------------------------------
-- (A2) Zähler in pulse_cycles.response_count aktualisieren und neuen Wert
--      zurückgeben. Wird nach jedem vollständigen Pulse-Submit serverseitig
--      aufgerufen → Trainer sieht den Stand live (1 → 5 → …). Nur service_role.
-- ------------------------------------------------------------
create or replace function public.refresh_pulse_cycle_response_count(cycle_uuid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  select count(distinct pr.respondent_token)::int
    into n
  from public.pulse_responses pr
  where pr.pulse_cycle_id = cycle_uuid;

  update public.pulse_cycles
     set response_count = n
   where id = cycle_uuid;

  return coalesce(n, 0);
end;
$$;

revoke execute on function public.refresh_pulse_cycle_response_count(uuid) from public;
revoke execute on function public.refresh_pulse_cycle_response_count(uuid) from anon;
revoke execute on function public.refresh_pulse_cycle_response_count(uuid) from authenticated;
grant  execute on function public.refresh_pulse_cycle_response_count(uuid) to service_role;

-- Bestehende offene Cycles einmalig auf den korrekten Live-Stand bringen.
update public.pulse_cycles pc
   set response_count = sub.n
  from (
    select pr.pulse_cycle_id, count(distinct pr.respondent_token)::int as n
    from public.pulse_responses pr
    group by pr.pulse_cycle_id
  ) sub
 where pc.id = sub.pulse_cycle_id
   and pc.status = 'open'
   and pc.response_count is distinct from sub.n;

-- ------------------------------------------------------------
-- (B) Refund-Kaskade für BEREITS erstattete Käufe nachziehen:
--     normale Einladungen deaktivieren + Share-Link sperren.
--     (Der Webhook erledigt das ab jetzt live für neue Refunds.)
-- ------------------------------------------------------------
update public.invitations inv
   set status = 'expired'
 where inv.status not in ('completed', 'expired')
   and exists (
     select 1
     from public.purchases p
     where p.assessment_id = inv.parent_assessment_id
       and p.status = 'refunded'
   );

update public.assessments a
   set share_enabled = false,
       share_token   = null
 where a.share_enabled = true
   and exists (
     select 1
     from public.purchases p
     where p.assessment_id = a.id
       and p.status = 'refunded'
   );

-- ------------------------------------------------------------
-- (C) Pulse-Read-Lockdown: SELECT auf Snapshots/Tokens nur bei bezahltem Kauf
--     und nicht-archivierter Saison. Blockiert direkten REST-Read nach Refund.
--     Server-Routen nutzen service_role und umgehen RLS weiterhin bewusst.
-- ------------------------------------------------------------
drop policy if exists "pulse_cycles_owner_select" on public.pulse_cycles;
create policy "pulse_cycles_owner_select" on public.pulse_cycles
  for select using (
    exists (
      select 1
      from public.seasons s
      join public.purchases p on p.id = s.purchase_id
      where s.id = pulse_cycles.season_id
        and s.user_id = auth.uid()
        and s.status <> 'archived'
        and p.status = 'paid'
    )
  );

drop policy if exists "pulse_invitations_owner_select" on public.pulse_invitations;
create policy "pulse_invitations_owner_select" on public.pulse_invitations
  for select to authenticated using (
    exists (
      select 1
      from public.seasons s
      join public.purchases p on p.id = s.purchase_id
      where s.id = pulse_invitations.season_id
        and s.user_id = auth.uid()
        and s.status <> 'archived'
        and p.status = 'paid'
    )
  );

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
declare
  v_auth_can boolean;
begin
  -- Zählfunktionen existieren und sind NICHT für authenticated ausführbar.
  select has_function_privilege('authenticated', 'public.get_pulse_cycle_response_count(uuid)', 'EXECUTE')
    into v_auth_can;
  if v_auth_can then
    raise exception 'get_pulse_cycle_response_count darf fuer authenticated nicht ausfuehrbar sein';
  end if;

  select has_function_privilege('authenticated', 'public.refresh_pulse_cycle_response_count(uuid)', 'EXECUTE')
    into v_auth_can;
  if v_auth_can then
    raise exception 'refresh_pulse_cycle_response_count darf fuer authenticated nicht ausfuehrbar sein';
  end if;

  if not exists (select 1 from pg_policies where tablename='pulse_cycles' and policyname='pulse_cycles_owner_select') then
    raise exception 'pulse_cycles_owner_select fehlt';
  end if;
  if not exists (select 1 from pg_policies where tablename='pulse_invitations' and policyname='pulse_invitations_owner_select') then
    raise exception 'pulse_invitations_owner_select fehlt';
  end if;

  raise notice 'Migration 40 OK (Live-Zaehler + Refund-Backfill + Pulse-Read-Lockdown).';
end $$;
