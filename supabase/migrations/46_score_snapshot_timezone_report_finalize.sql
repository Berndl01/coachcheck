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
  v_report_id uuid;
begin
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

  update public.report_jobs
     set status = 'ready', report_id = v_report_id
   where id = p_job_id;

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
  raise notice 'Migration 46 OK (Snapshot-Spalten + Profilzeitzone + atomare Report-Finalisierung).';
end $$;
