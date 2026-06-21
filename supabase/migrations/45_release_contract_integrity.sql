-- ============================================================
-- MIGRATION 45 — RELEASE-VERTRAG + INTEGRITÄTSSTATUS
-- ============================================================
--
-- Macht den Release-Vertrag in der DB explizit und fügt eine serverseitige
-- Integritätsfunktion hinzu, die die Readiness-API / der Preflight aufruft.
--
--   (A) Tabelle public.release_contract: eine Zeile mit Schema-/Scoring-/
--       Itempool-Version. Quelle für Stempel im Ergebnis-Snapshot (Migration 46).
--   (B) Funktion public.coachcheck_release_integrity(): prüft serverseitig
--         - alle sieben Module (A–G) im Itempool vorhanden,
--         - jedes Spannungsfeld-Item trägt linken UND rechten Pol,
--         - je Produkt mit item_count: ausgelieferte Coach-Items == item_count
--           (Advertised = Delivered — dieselbe Invariante wie Migration 26,
--           aber zur LAUFZEIT abfragbar statt nur zur Migrationszeit),
--         - mindestens zwölf Archetypen mit vollständigem 6-Achsen-Profil.
--       Gibt jsonb { ok: boolean, problems: text[], checked_at } zurück.
--
-- Additiv & idempotent. Verändert KEINE App-Logik.
-- ============================================================

-- ------------------------------------------------------------
-- (A) Release-Vertrag als Einzeiler-Tabelle.
-- ------------------------------------------------------------
create table if not exists public.release_contract (
  id              boolean primary key default true check (id),  -- erzwingt genau eine Zeile
  schema_version  int not null,
  scoring_version int not null,
  itempool_version int not null,
  updated_at      timestamptz not null default now()
);

insert into public.release_contract (id, schema_version, scoring_version, itempool_version)
values (true, 46, 1, 25)
on conflict (id) do update
  set schema_version   = excluded.schema_version,
      scoring_version  = excluded.scoring_version,
      itempool_version = excluded.itempool_version,
      updated_at       = now();

alter table public.release_contract enable row level security;
-- Nur lesbar für service_role (Server-Pfad). Kein anon/authenticated-Zugriff nötig.
drop policy if exists "release_contract_no_client" on public.release_contract;
create policy "release_contract_no_client" on public.release_contract
  for select using (false);

-- ------------------------------------------------------------
-- (B) Serverseitige Integritätsfunktion.
--     SECURITY DEFINER, nur für service_role ausführbar.
-- ------------------------------------------------------------
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

  -- (3) Advertised = Delivered je Produkt.
  for rec in
    select id, tier, slug, item_count
    from public.products
    where item_count is not null
  loop
    select count(*) into served
    from public.items i
    where i.active = true
      and i.player_item = false
      and rec.tier = any(i.package_tiers);
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
grant  execute on function public.coachcheck_release_integrity() to service_role;

-- ============================================================
-- VERIFIKATION (self-check, idempotent)
-- ============================================================
do $$
declare
  v_ok boolean;
  v_result jsonb;
begin
  if to_regprocedure('public.coachcheck_release_integrity()') is null then
    raise exception 'coachcheck_release_integrity() wurde nicht angelegt';
  end if;
  if not exists (select 1 from public.release_contract where id = true) then
    raise exception 'release_contract-Zeile fehlt';
  end if;

  -- Funktion muss aufrufbar sein und ok=true liefern, wenn der Pool stimmt.
  select public.coachcheck_release_integrity() into v_result;
  v_ok := (v_result->>'ok')::boolean;
  if not v_ok then
    raise warning 'Release-Integritaet meldet Probleme: %', v_result->'problems';
  else
    raise notice 'Migration 45 OK (Release-Vertrag + Integritaetsfunktion, Integritaet gruen).';
  end if;
end $$;
