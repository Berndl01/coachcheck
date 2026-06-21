-- ============================================================
-- MIGRATION 46 — SCORE-SNAPSHOT + PROFILZEITZONE + ATOMARE REPORT-FINALISIERUNG
-- ============================================================
--
--   (A) profiles.timezone — pro Nutzer wählbare Zeitzone (Default per App
--       Europe/Vienna). Behebt den Datumssprung um Mitternacht bei Check-ins
--       sauber pro Nutzer statt global.
--
--   (B) Unveränderbarer Ergebnis-Snapshot auf assessments:
--         - scoring_version / itempool_version (welche Gewichte/Pool galten),
--         - result_snapshot jsonb (eingefrorene Achsen, Modul-Signale,
--           Entwicklungsindikatoren, Archetypen, Profil-Einordnung,
--           Antwortqualität, erwartete Item-IDs, Abschlusszeitpunkt),
--         - snapshot_finalized_at.
--       Ergebnisansicht, Report und PDF lesen danach diesen Snapshot — alte
--       Assessments werden NIE mit neuen Itemgewichten neu gerechnet.
--
--   (C) finalize_report_atomic(): Report-Zeile einfügen + Assessment auf
--       'report_ready' + Report-Job auf 'ready' (mit report_id) in EINER
--       Transaktion. Verhindert inkonsistente Zwischenzustände (Report-Zeile
--       ohne Statuswechsel oder umgekehrt). Nur service_role.
--
-- Additiv & idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- (A) Profilzeitzone.
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists timezone text;

-- ------------------------------------------------------------
-- (B) Snapshot-Spalten.
-- ------------------------------------------------------------
alter table public.assessments
  add column if not exists scoring_version int;
alter table public.assessments
  add column if not exists itempool_version int;
alter table public.assessments
  add column if not exists result_snapshot jsonb;
alter table public.assessments
  add column if not exists snapshot_finalized_at timestamptz;

-- ------------------------------------------------------------
-- (C) Atomare Report-Finalisierung.
-- ------------------------------------------------------------
create or replace function public.finalize_report_atomic(
  p_assessment_id     uuid,
  p_job_id            uuid,
  p_storage_path      text,
  p_file_size_bytes   int,
  p_pages             int,
  p_generation_model  text,
  p_prompt_version    text,
  p_prompt_tokens     int,
  p_completion_tokens int,
  p_ai_fallback       boolean,
  p_metadata          jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_id        uuid;
  v_job_assessment   uuid;
  v_job_status       text;
  v_assessment_state text;
  v_rows             int;
begin
  -- (P0.7) VORBEDINGUNGEN unter Zeilensperre prüfen, BEVOR irgendetwas
  -- geschrieben wird. Jede Abweichung wirft → die GESAMTE Transaktion bricht ab
  -- (kein Report ohne gültigen Statuswechsel, kein Statuswechsel ohne gültigen
  -- Ausgangszustand).

  -- (1) Report-Job muss existieren, zum Assessment gehören und 'processing' sein.
  select assessment_id, status
    into v_job_assessment, v_job_status
    from public.report_jobs
   where id = p_job_id
   for update;

  if v_job_assessment is null then
    raise exception 'finalize_report_atomic: report job % nicht gefunden', p_job_id;
  end if;
  if v_job_assessment <> p_assessment_id then
    raise exception 'finalize_report_atomic: job % gehört nicht zu assessment %', p_job_id, p_assessment_id;
  end if;
  if v_job_status <> 'processing' then
    raise exception 'finalize_report_atomic: job % nicht processing (ist %)', p_job_id, v_job_status;
  end if;

  -- (2) Assessment muss existieren und abgeschlossen sein. 'report_ready' bleibt
  -- zulässig (idempotenter Admin-Regenerate über einen NEUEN processing-Job).
  select status
    into v_assessment_state
    from public.assessments
   where id = p_assessment_id
   for update;

  if v_assessment_state is null then
    raise exception 'finalize_report_atomic: assessment % nicht gefunden', p_assessment_id;
  end if;
  if v_assessment_state not in ('completed', 'report_ready') then
    raise exception 'finalize_report_atomic: assessment % nicht abgeschlossen (ist %)', p_assessment_id, v_assessment_state;
  end if;

  -- (3) Schreiben — jede Mutation muss genau eine Zeile treffen.
  insert into public.reports (
    assessment_id, storage_path, file_size_bytes, pages,
    generation_model, prompt_version, prompt_tokens, completion_tokens,
    ai_fallback, metadata
  ) values (
    p_assessment_id, p_storage_path, p_file_size_bytes, p_pages,
    p_generation_model, p_prompt_version, p_prompt_tokens, p_completion_tokens,
    coalesce(p_ai_fallback, false), coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_report_id;

  update public.assessments
     set status = 'report_ready'
   where id = p_assessment_id;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'finalize_report_atomic: erwartete genau 1 assessment-Zeile, traf %', v_rows;
  end if;

  update public.report_jobs
     set status = 'ready', report_id = v_report_id
   where id = p_job_id
     and status = 'processing';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'finalize_report_atomic: erwartete genau 1 job-Zeile, traf %', v_rows;
  end if;

  return v_report_id;
end;
$$;

revoke execute on function public.finalize_report_atomic(
  uuid, uuid, text, int, int, text, text, int, int, boolean, jsonb
) from public;
revoke execute on function public.finalize_report_atomic(
  uuid, uuid, text, int, int, text, text, int, int, boolean, jsonb
) from anon;
revoke execute on function public.finalize_report_atomic(
  uuid, uuid, text, int, int, text, text, int, int, boolean, jsonb
) from authenticated;
grant execute on function public.finalize_report_atomic(
  uuid, uuid, text, int, int, text, text, int, int, boolean, jsonb
) to service_role;

-- ------------------------------------------------------------
-- (D) Release-Vertrag jetzt — und erst jetzt — auf schema_version = 46 heben.
--     Migration 45 hat 45 gesetzt; nach DIESER Migration sind die Snapshot-
--     Spalten + die gehärtete Report-RPC vorhanden, also ist „46" ehrlich.
--     Die Live-Readiness vergleicht diesen Wert mit RELEASE_SCHEMA_VERSION (46)
--     und meldet eine nur-bis-45-migrierte DB als NICHT bereit (fail-closed).
-- ------------------------------------------------------------
update public.release_contract
   set schema_version = 46,
       updated_at     = now()
 where id = true;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='assessments' and column_name='result_snapshot'
  ) then
    raise exception 'assessments.result_snapshot fehlt';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='timezone'
  ) then
    raise exception 'profiles.timezone fehlt';
  end if;
  if to_regprocedure('public.finalize_report_atomic(uuid,uuid,text,int,int,text,text,int,int,boolean,jsonb)') is null then
    raise exception 'finalize_report_atomic() wurde nicht angelegt';
  end if;
  if not exists (
    select 1 from public.release_contract where id = true and schema_version = 46
  ) then
    raise exception 'release_contract.schema_version wurde nicht auf 46 gehoben';
  end if;
  raise notice 'Migration 46 OK (Snapshot-Spalten + Profilzeitzone + atomare Report-Finalisierung + schema_version=46).';
end $$;
