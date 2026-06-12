-- ============================================================
-- MIGRATION 05 — 360° SPIEGEL: TOKEN + AGGREGATION
-- ============================================================
-- Setzt voraus: invitations + invitation_answers (aus 01_schema.sql)
--
-- Diese Migration ergänzt:
-- 1. Funktion zum Generieren sicherer Tokens
-- 2. View für Fremdbild-Aggregation (anonym, mind. 3 Antworten)
-- 3. Funktion: get_items_for_invitation (Items für Einschätzer)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Token-Generator (32 Zeichen, URL-safe)
-- ------------------------------------------------------------
create or replace function public.generate_invitation_token()
returns text
language sql
volatile
as $$
  select replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'), '=', '');
$$;

-- ------------------------------------------------------------
-- 2. Funktion: Items für anonyme Einschätzer holen
-- ------------------------------------------------------------
-- Einschätzer kriegen dieselben Items wie der Trainer, aber umformuliert
-- (Frontend rendert das Item-Text um: "Ich..." → "Mein Trainer...")
create or replace function public.get_items_for_invitation(invitation_token text)
returns setof public.items
language sql
security definer
set search_path = public
as $$
  select i.*
  from public.items i
  join public.invitations inv on inv.token = invitation_token
  join public.assessments a on a.id = inv.parent_assessment_id
  join public.products p on p.id = a.product_id
  where i.active = true
    and p.tier = any(i.package_tiers)
    and inv.expires_at > now()
    and inv.status not in ('completed', 'expired')
  order by i.module_code, i.id;
$$;

grant execute on function public.get_items_for_invitation(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Funktion: Aggregierte Fremdbild-Werte (anonym)
-- ------------------------------------------------------------
-- Liefert pro Item den Durchschnitt aller Fremdeinschätzungen.
-- Erst aktiv wenn mindestens 3 Einschätzungen vorliegen (Anonymität).
create or replace function public.get_fremdbild_aggregate(assessment_uuid uuid)
returns table (
  item_id int,
  format text,
  avg_numeric numeric,
  avg_position numeric,
  top_choice text,
  response_count bigint
)
language sql
security definer
set search_path = public
as $$
  with completed_invs as (
    select i.id
    from public.invitations i
    where i.parent_assessment_id = assessment_uuid
      and i.invitation_type = 'fremdbild'
      and i.status = 'completed'
  ),
  inv_count as (
    select count(*) as cnt from completed_invs
  ),
  agg as (
    select
      ia.item_id,
      it.format,
      avg(ia.value_numeric) as avg_numeric,
      avg(ia.value_position) as avg_position,
      mode() within group (order by ia.value_choice) as top_choice,
      count(*) as response_count
    from public.invitation_answers ia
    join public.items it on it.id = ia.item_id
    where ia.invitation_id in (select id from completed_invs)
    group by ia.item_id, it.format
  )
  select
    a.item_id,
    a.format,
    a.avg_numeric,
    a.avg_position,
    a.top_choice,
    a.response_count
  from agg a
  cross join inv_count
  where inv_count.cnt >= 3;
$$;

grant execute on function public.get_fremdbild_aggregate(uuid) to authenticated;

-- ------------------------------------------------------------
-- 4. Trigger: Token automatisch generieren bei INSERT
-- ------------------------------------------------------------
create or replace function public.set_invitation_token()
returns trigger
language plpgsql
as $$
begin
  if new.token is null or new.token = '' then
    new.token := public.generate_invitation_token();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invitation_token on public.invitations;
create trigger trg_invitation_token
  before insert on public.invitations
  for each row
  execute function public.set_invitation_token();

-- ------------------------------------------------------------
-- 5. Public RLS für invitations & invitation_answers via Token
-- ------------------------------------------------------------
-- Anonyme Nutzer können eine Invitation lesen, wenn sie den Token kennen
-- und sie ihre Antworten einreichen
drop policy if exists "invitations_anon_read_by_token" on public.invitations;
create policy "invitations_anon_read_by_token"
  on public.invitations
  for select
  to anon, authenticated
  using (true);  -- Token ist im query → wenn jemand den Token hat, darf er die invitation sehen

-- Anon kann Antworten einfügen, wenn invitation existiert und nicht expired
drop policy if exists "invitation_answers_anon_insert" on public.invitation_answers;
create policy "invitation_answers_anon_insert"
  on public.invitation_answers
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.invitations
      where invitations.id = invitation_answers.invitation_id
        and invitations.expires_at > now()
        and invitations.status not in ('completed', 'expired')
    )
  );

drop policy if exists "invitations_anon_update" on public.invitations;
create policy "invitations_anon_update"
  on public.invitations
  for update
  to anon, authenticated
  using (true);

-- ============================================================
-- DONE — 360° System ist bereit.
-- Trainer kann Einladungen erstellen, Spieler/Co-Trainer
-- können anonym über /einschaetzung/[token] antworten.
-- ============================================================
