-- ============================================================
-- MIGRATION 30 — RPCs LIEFERN KEINE SCORING-METADATEN MEHR (IP-Schutz, DB-Ebene)
-- ============================================================
--
-- BEFUND (v3_32-Audit): get_items_for_assessment / get_items_for_invitation gaben
-- `setof public.items` zurück — also bei einem DIREKTEN RPC-Aufruf den vollen
-- Item-Datensatz inkl. axis_weights, reverse_scored, Optionsgewichte,
-- package_tiers, active, player_item, created_at. Der Client-Sanitizer
-- (sanitizeItemsForClient) entfernte das nur auf der React-Seite — ein direkter
-- Supabase-RPC-Aufruf umging ihn.
--
-- FIX: Beide RPCs geben nur noch ANZEIGE-Felder zurück:
--   id, code, module_code, submodule, format, text_de, options(key/text).
-- Die Scoring-Systematik verlässt den Server damit auch über die RPC nicht mehr.
--
-- Hinweis: Der Rückgabetyp ändert sich → DROP + CREATE (CREATE OR REPLACE kann
-- den Rückgabetyp nicht ändern). Caller nutzen nur id/format/options/Anzeige —
-- verifiziert (assessment-Page, finalize-Vollständigkeit, einschaetzung/teamcheck,
-- invitation-complete: nur id). Scoring liest Items separat serverseitig.
-- ============================================================

-- ------------------------------------------------------------
-- Hilfsfunktion: options auf key/text reduzieren (Gewichte entfernen)
-- ------------------------------------------------------------
create or replace function public.strip_option_weights(opts jsonb)
returns jsonb language sql immutable as $$
  select case
    when opts is null then null
    else (
      select jsonb_agg(jsonb_build_object('key', o->>'key', 'text', o->>'text'))
      from jsonb_array_elements(opts) o
    )
  end;
$$;

-- ------------------------------------------------------------
-- get_items_for_assessment — restriktiv
-- ------------------------------------------------------------
drop function if exists public.get_items_for_assessment(uuid);

create function public.get_items_for_assessment(assessment_uuid uuid)
returns table (
  id integer,
  code text,
  module_code text,
  submodule text,
  format text,
  text_de text,
  options jsonb
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.code, i.module_code, i.submodule, i.format, i.text_de,
         public.strip_option_weights(i.options) as options
  from public.items i
  join public.assessments a on a.id = assessment_uuid
  join public.products p on p.id = a.product_id
  where i.active = true
    and i.player_item = false
    and p.tier = any(i.package_tiers)
    and a.user_id = auth.uid()
  order by i.module_code, i.id;
$$;

grant execute on function public.get_items_for_assessment(uuid) to authenticated;

-- ------------------------------------------------------------
-- get_items_for_invitation — restriktiv (Invitation-Logik erhalten)
-- ------------------------------------------------------------
drop function if exists public.get_items_for_invitation(text);

create function public.get_items_for_invitation(invitation_token text)
returns table (
  id integer,
  code text,
  module_code text,
  submodule text,
  format text,
  text_de text,
  options jsonb
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.code, i.module_code, i.submodule, i.format, i.text_de,
         public.strip_option_weights(i.options) as options
  from public.items i
  join public.invitations inv on inv.token = invitation_token
  join public.assessments a on a.id = inv.parent_assessment_id
  join public.products p on p.id = a.product_id
  where i.active = true
    and p.tier = any(i.package_tiers)
    and inv.expires_at > now()
    and inv.status not in ('completed', 'expired')
    and (
      (inv.invitation_type = 'fremdbild' and i.player_item = false)
      or
      (inv.invitation_type = 'spieler' and i.player_item = true)
    )
  order by i.module_code, i.id;
$$;

grant execute on function public.get_items_for_invitation(text) to anon, authenticated;

-- ============================================================
-- VERIFIKATION: die RPC-Rückgabe darf KEINE Scoring-Spalten enthalten
-- ============================================================
do $$
declare
  bad_cols text;
begin
  select string_agg(p.proname || '.' || a.attname, ', ')
    into bad_cols
  from pg_proc p
  join pg_type t on t.oid = p.prorettype
  join pg_attribute a on a.attrelid = t.typrelid
  where p.proname in ('get_items_for_assessment','get_items_for_invitation')
    and a.attname in ('axis_weights','reverse_scored','package_tiers','active','player_item','created_at');

  if bad_cols is not null then
    raise exception 'RPC liefert weiterhin Scoring-Spalten: %', bad_cols;
  end if;

  raise notice 'RPC-Sanitizing OK: get_items_for_* liefern nur Anzeige-Felder (kein axis_weights/reverse_scored/...).';
end $$;
