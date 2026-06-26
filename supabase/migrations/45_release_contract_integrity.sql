-- =====================================================================
-- 45_release_contract_integrity.sql
-- =====================================================================
-- Verankert den Release-Vertrag IN der Datenbank, damit Live-DB und Code
-- gegeneinander prüfbar sind (Readiness-API + Preflight).
--
--   (1) schema_meta          — eine Zeile mit Schema-/Scoring-/Itempool-Version.
--   (2) check_release_contract() — gibt je Prüfpunkt eine Zeile
--       (check_name, ok, detail) zurück. Die App/Preflight bewertet „ok=false"
--       als nicht freigabefähig (Fragebogen darf nicht öffnen).
--
-- Geprüft wird, OHNE Scoring-Gewichte zu leaken:
--   · Itemzahl je Tier == Vertrag (27 / 103 / 103 / 77)
--   · alle sieben Module (A–G) im jeweiligen Tier-Pool vorhanden
--   · Archetypen-Anzahl == 12
--   · jedes aktive Spannungsfeld-Item trägt linken UND rechten Pol
--   · kein aktives Item mit unbekanntem Format / leerem Text
--   · Produkt-Metadaten item_count == real ausgelieferte Itemzahl
--
-- Idempotent: create table if not exists, create or replace function,
-- to_regprocedure-Guard im Selbsttest.
-- =====================================================================

-- ---------------------------------------------------------------------
-- (1) Schema-Meta
-- ---------------------------------------------------------------------
create table if not exists public.schema_meta (
  id boolean primary key default true,           -- erzwingt genau eine Zeile
  schema_version int not null,
  scoring_version text not null,
  itempool_version text not null,
  updated_at timestamptz not null default now(),
  constraint schema_meta_singleton check (id = true)
);

insert into public.schema_meta (id, schema_version, scoring_version, itempool_version)
values (true, 46, '2.0.0', '2025-06-A')
on conflict (id) do update
set schema_version = excluded.schema_version,
    scoring_version = excluded.scoring_version,
    itempool_version = excluded.itempool_version,
    updated_at = now();

-- ---------------------------------------------------------------------
-- (2) Vertragsprüfung
-- ---------------------------------------------------------------------
-- Erwartete Itemzahlen je Tier als VALUES-Liste (Single Source in lib/release-contract.ts;
-- hier gespiegelt für die DB-Prüfung). Tier 5 hat keinen Fragebogen → ausgenommen.
create or replace function public.check_release_contract()
returns table (check_name text, ok boolean, detail text)
language plpgsql
security definer
set search_path = public
as $$
declare
  expected jsonb := '{"1":27,"2":103,"3":103,"4":77}'::jsonb;
  t int;
  want int;
  got int;
  arche_count int;
  bad_poles int;
  bad_format int;
  empty_text int;
  module_codes text[] := array['A','B','C','D','E','F','G'];
  mc text;
  present int;
  meta_count int;
begin
  -- (a) Itemzahl je Tier
  for t in select (jsonb_object_keys(expected))::int loop
    want := (expected ->> t::text)::int;
    select count(*) into got
    from public.items i
    where i.active = true
      and coalesce(i.player_item, false) = false
      and t = any(i.package_tiers);
    return query select
      format('item_count_tier_%s', t),
      (got = want),
      format('Tier %s: erwartet %s, real %s', t, want, got);
  end loop;

  -- (b) Alle sieben Module je Tier vorhanden (im selbst-ausgefüllten Pool)
  for t in select (jsonb_object_keys(expected))::int loop
    foreach mc in array module_codes loop
      select count(*) into present
      from public.items i
      where i.active = true
        and coalesce(i.player_item, false) = false
        and t = any(i.package_tiers)
        and i.module_code = mc;
      return query select
        format('module_present_tier_%s_%s', t, mc),
        (present > 0),
        format('Tier %s Modul %s: %s Items', t, mc, present);
    end loop;
  end loop;

  -- (c) Archetypen-Anzahl == 12
  select count(*) into arche_count from public.archetypes;
  return query select
    'archetype_count',
    (arche_count = 12),
    format('Archetypen: erwartet 12, real %s', arche_count);

  -- (d) Spannungsfeld-Pole vollständig (linker UND rechter Pol je aktivem Item)
  select count(*) into bad_poles
  from public.items i
  where i.active = true
    and i.format = 'spannungsfeld'
    and (
      i.options is null
      or jsonb_array_length(i.options) = 0
      or coalesce(nullif(trim(i.options->0->>'left'),  ''), '') = ''
      or coalesce(nullif(trim(i.options->0->>'right'), ''), '') = ''
    );
  return query select
    'spannungsfeld_poles_complete',
    (bad_poles = 0),
    format('Spannungsfeld-Items ohne vollständige Pole: %s', bad_poles);

  -- (e) Kein aktives Item mit unbekanntem Format
  select count(*) into bad_format
  from public.items i
  where i.active = true
    and i.format not in (
      'likert_5','likert_7','forced_choice','szenario','dilemma',
      'spannungsfeld','gap_wichtig','gap_gelebt','ranking','state'
    );
  return query select
    'item_formats_known',
    (bad_format = 0),
    format('Aktive Items mit unbekanntem Format: %s', bad_format);

  -- (f) Kein aktives Item ohne Fragetext
  select count(*) into empty_text
  from public.items i
  where i.active = true
    and coalesce(nullif(trim(i.text_de), ''), '') = '';
  return query select
    'item_texts_present',
    (empty_text = 0),
    format('Aktive Items ohne Fragetext: %s', empty_text);

  -- (g) Produkt-Metadaten item_count == real ausgelieferte Itemzahl (beworben = geliefert)
  for t in select (jsonb_object_keys(expected))::int loop
    select count(*) into got
    from public.items i
    where i.active = true
      and coalesce(i.player_item, false) = false
      and t = any(i.package_tiers);
    select p.item_count into meta_count
    from public.products p
    where p.tier = t and p.active = true
    limit 1;
    return query select
      format('product_metadata_matches_tier_%s', t),
      (meta_count is not null and meta_count = got),
      format('Tier %s: products.item_count=%s, real=%s', t, coalesce(meta_count, -1), got);
  end loop;
end;
$$;

grant execute on function public.check_release_contract() to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Selbsttest
-- ---------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.check_release_contract()') is null then
    raise exception 'check_release_contract() fehlt';
  end if;
  if not exists (select 1 from public.schema_meta where id = true) then
    raise exception 'schema_meta Zeile fehlt';
  end if;
end $$;
