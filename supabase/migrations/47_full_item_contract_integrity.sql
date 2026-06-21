-- ============================================================
-- MIGRATION 47 — VOLLSTÄNDIGER ITEM-VERTRAG AUCH DATENBANKSEITIG (P0.2-Parität)
-- ============================================================
--
-- Erweitert public.coachcheck_release_integrity() um genau die Prüfungen, die
-- die App (checkItemsAgainstContract) und die Readiness bereits anwenden:
--   (5) eindeutige Item-Codes,
--   (6) vorhandener Fragetext,
--   (7) nur unterstützte Formate,
--   (8) vollständige Auswahloptionen (key + text) + eindeutige Optionsschlüssel.
--
-- Damit kann die Readiness nicht 200 melden, während die DB einen unvollständigen
-- Itempool hält. Hebt schema_version am Ende auf 47 (Readiness verlangt das).
--
-- Additiv & idempotent.
-- ============================================================

create or replace function public.coachcheck_release_integrity()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  problems text[] := array[]::text[];
  expected_modules text[] := array['A','B','C','D','E','F','G'];
  present_modules text[];
  missing_modules text[];
  poleless_ids int[];
  rec record;
  served int;
  archetype_total int;
  archetype_incomplete int;
  -- (P0.2) neue Prüfvariablen
  dup_codes text[];
  notext_ids int[];
  bad_formats text[];
  choice_bad_ids int[];
  dup_key_ids int[];
  supported_formats text[] := array[
    'likert_5','state','gap_wichtig','gap_gelebt',
    'spannungsfeld','forced_choice','szenario','dilemma','ranking'
  ];
  choice_formats text[] := array['forced_choice','szenario','dilemma','ranking'];
  axis_keys text[] := array[
    'struktur_intuition','autoritaet_beteiligung','leistung_beziehung',
    'stabilisierung_aktivierung','reflexion_direktheit','standardisierung_anpassung'
  ];
begin
  -- (1) Module vollständig.
  select array_agg(distinct upper(module_code)) into present_modules
  from public.items where active = true;
  select array_agg(m) into missing_modules
  from unnest(expected_modules) m
  where not (m = any(coalesce(present_modules, array[]::text[])));
  if coalesce(array_length(missing_modules,1),0) > 0 then
    problems := problems || ('Fehlende Module im Itempool: ' || array_to_string(missing_modules, ', '));
  end if;

  -- (2) Spannungsfeld-Pole vollständig.
  select array_agg(i.id order by i.id) into poleless_ids
  from public.items i
  where i.active = true
    and i.format = 'spannungsfeld'
    and (
      i.options is null
      or jsonb_typeof(i.options) <> 'array'
      or jsonb_array_length(i.options) = 0
      or coalesce(btrim(i.options->0->>'left'), '') = ''
      or coalesce(btrim(i.options->0->>'right'), '') = ''
    );
  if coalesce(array_length(poleless_ids,1),0) > 0 then
    problems := problems || ('Spannungsfeld-Items ohne vollstaendige Pole: ' ||
      array_to_string(poleless_ids, ', '));
  end if;

  -- (3) Itemzahl je Produkt mit item_count.
  for rec in
    select id, slug, tier, item_count from public.products where item_count is not null
  loop
    select count(*) into served
    from public.product_items pi
    join public.items i on i.id = pi.item_id
    where pi.product_id = rec.id and i.active = true;
    if served <> rec.item_count then
      problems := problems || ('Itemzahl-Drift Produkt ' || rec.slug ||
        ' (Tier ' || rec.tier || '): beworben ' || rec.item_count ||
        ', ausgeliefert ' || served);
    end if;
  end loop;

  -- (4) Archetypen: mindestens 12 mit vollstaendigem 6-Achsen-Profil.
  select count(*) into archetype_total from public.archetypes;
  if archetype_total < 12 then
    problems := problems || ('Zu wenige Archetypen: ' || archetype_total || ' (erwartet >= 12)');
  end if;

  select count(*) into archetype_incomplete
  from public.archetypes a
  where exists (
    select 1 from unnest(axis_keys) k
    where jsonb_typeof(coalesce(a.axis_profile->k, 'null'::jsonb)) <> 'number'
  );
  if archetype_incomplete > 0 then
    problems := problems || (archetype_incomplete ||
      ' Archetyp(en) mit unvollstaendigem Achsenprofil');
  end if;

  -- (5) Eindeutige Item-Codes (P0.2).
  select array_agg(code) into dup_codes
  from (
    select code from public.items
    where active = true and coalesce(btrim(code), '') <> ''
    group by code having count(*) > 1
  ) t;
  if coalesce(array_length(dup_codes,1),0) > 0 then
    problems := problems || ('Doppelte Item-Codes: ' || array_to_string(dup_codes, ', '));
  end if;

  -- (6) Fragetext vorhanden (P0.2).
  select array_agg(i.id order by i.id) into notext_ids
  from public.items i
  where i.active = true and coalesce(btrim(i.text_de), '') = '';
  if coalesce(array_length(notext_ids,1),0) > 0 then
    problems := problems || ('Items ohne Fragetext: ' || array_to_string(notext_ids, ', '));
  end if;

  -- (7) Nur unterstützte Formate (P0.2).
  select array_agg(distinct i.format) into bad_formats
  from public.items i
  where i.active = true and not (i.format = any(supported_formats));
  if coalesce(array_length(bad_formats,1),0) > 0 then
    problems := problems || ('Nicht unterstuetzte Formate: ' || array_to_string(bad_formats, ', '));
  end if;

  -- (8a) Auswahlitems: vollständige Optionen (key + text), mind. 2 (P0.2).
  select array_agg(i.id order by i.id) into choice_bad_ids
  from public.items i
  where i.active = true
    and i.format = any(choice_formats)
    and (
      i.options is null
      or jsonb_typeof(i.options) <> 'array'
      or jsonb_array_length(i.options) < 2
      or exists (
        select 1 from jsonb_array_elements(i.options) o
        where coalesce(btrim(o->>'key'), '') = '' or coalesce(btrim(o->>'text'), '') = ''
      )
    );
  if coalesce(array_length(choice_bad_ids,1),0) > 0 then
    problems := problems || ('Auswahlitems mit unvollstaendigen Optionen: ' ||
      array_to_string(choice_bad_ids, ', '));
  end if;

  -- (8b) Auswahlitems: eindeutige Optionsschlüssel (P0.2).
  select array_agg(i.id order by i.id) into dup_key_ids
  from public.items i
  where i.active = true
    and i.format = any(choice_formats)
    and jsonb_typeof(i.options) = 'array'
    and (
      select count(*) <> count(distinct (o->>'key'))
      from jsonb_array_elements(i.options) o
    );
  if coalesce(array_length(dup_key_ids,1),0) > 0 then
    problems := problems || ('Auswahlitems mit doppelten Optionsschluesseln: ' ||
      array_to_string(dup_key_ids, ', '));
  end if;

  return jsonb_build_object(
    'ok', (coalesce(array_length(problems,1),0) = 0),
    'problems', to_jsonb(problems),
    'checked_at', now()
  );
end;
$$;

revoke execute on function public.coachcheck_release_integrity() from public;
revoke execute on function public.coachcheck_release_integrity() from anon;
revoke execute on function public.coachcheck_release_integrity() from authenticated;
grant execute on function public.coachcheck_release_integrity() to service_role;

-- schema_version auf 47 heben — die Readiness verlangt diese Version (Code-Konstante).
update public.release_contract
   set schema_version = 47,
       updated_at     = now()
 where id = true;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if to_regprocedure('public.coachcheck_release_integrity()') is null then
    raise exception 'coachcheck_release_integrity() fehlt nach Migration 47';
  end if;
  if not exists (
    select 1 from public.release_contract where id = true and schema_version = 47
  ) then
    raise exception 'release_contract.schema_version wurde nicht auf 47 gehoben';
  end if;
  raise notice 'Migration 47 OK (vollstaendiger Item-Vertrag DB-seitig + schema_version=47).';
end $$;
