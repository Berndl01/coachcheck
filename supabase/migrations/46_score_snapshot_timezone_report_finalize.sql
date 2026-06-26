-- =====================================================================
-- 46_score_snapshot_timezone_report_finalize.sql
-- =====================================================================
-- Drei zusammenhängende Härtungen:
--
--   (1) assessments.result_snapshot (jsonb) — unveränderbarer Ergebnis-Snapshot.
--       Beim Finalisieren wird das vollständige Ergebnis EINMAL eingefroren
--       (Scoring-/Itempool-Version, erwartete Item-IDs, sechs Achsen,
--       Modul-Signale, Entwicklungsindikatoren, Archetypen, Profil-
--       klassifikation, Antwortqualität, Abschlusszeitpunkt). Ergebnis-Ansicht,
--       Report und PDF lesen danach ausschließlich gespeicherte Werte und
--       rechnen ALTE Assessments nie mit aktuellen Itemgewichten neu.
--
--   (2) profiles.timezone — Profilzeitzone (Default Europe/Vienna). Grundlage
--       für tagesgenaue Check-in-Logik unabhängig von der Serverzeit.
--
--   (3) reports.report_kind ('premium' | 'basis') + finalize_report_atomic():
--       Report-Zeile, Assessment-Status und Report-Job werden in EINER
--       Transaktion (Funktionsaufruf) konsistent abgeschlossen. Schlägt die
--       DB fehl, wird nichts committet — die Route löscht dann die bereits
--       hochgeladene PDF wieder. Ein Fallback wird als 'basis' markiert.
--
-- Additiv & idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- (1) Ergebnis-Snapshot
-- ---------------------------------------------------------------------
alter table public.assessments
  add column if not exists result_snapshot jsonb;

-- ---------------------------------------------------------------------
-- (2) Profilzeitzone
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists timezone text not null default 'Europe/Vienna';

-- ---------------------------------------------------------------------
-- (3) report_kind + atomare Finalisierung
-- ---------------------------------------------------------------------
alter table public.reports
  add column if not exists report_kind text not null default 'premium';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reports_report_kind_check'
  ) then
    alter table public.reports
      add constraint reports_report_kind_check
      check (report_kind in ('premium', 'basis'));
  end if;
end $$;

-- Transaktional: Report-Zeile anlegen + Assessment auf report_ready + Job ready.
-- Läuft im Aufrufer-Transaktionskontext; jede Exception rollt ALLE drei
-- Schritte zurück. So gibt es nie eine PDF-im-Storage-aber-keine-DB-Zeile-Lücke,
-- die nicht erkannt würde (die Route löscht die PDF bei Fehler).
create or replace function public.finalize_report_atomic(
  p_assessment_id   uuid,
  p_job_id          uuid,
  p_storage_path    text,
  p_file_size       int,
  p_pages           int,
  p_model           text,
  p_prompt_version  text,
  p_prompt_tokens   int,
  p_completion_tokens int,
  p_ai_fallback     boolean,
  p_report_kind     text,
  p_metadata        jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_id uuid;
begin
  if p_report_kind not in ('premium', 'basis') then
    raise exception 'invalid report_kind: %', p_report_kind;
  end if;

  insert into public.reports (
    assessment_id, storage_path, file_size_bytes, pages,
    generation_model, prompt_version, prompt_tokens, completion_tokens,
    ai_fallback, report_kind, metadata
  ) values (
    p_assessment_id, p_storage_path, p_file_size, p_pages,
    p_model, p_prompt_version, p_prompt_tokens, p_completion_tokens,
    coalesce(p_ai_fallback, false), p_report_kind, coalesce(p_metadata, '{}'::jsonb)
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

grant execute on function public.finalize_report_atomic(
  uuid, uuid, text, int, int, text, text, int, int, boolean, text, jsonb
) to service_role;

-- ---------------------------------------------------------------------
-- Selbsttest
-- ---------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.finalize_report_atomic(uuid, uuid, text, int, int, text, text, int, int, boolean, text, jsonb)') is null then
    raise exception 'finalize_report_atomic() fehlt';
  end if;
  perform 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'assessments' and column_name = 'result_snapshot';
  if not found then raise exception 'assessments.result_snapshot fehlt'; end if;
  perform 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reports' and column_name = 'report_kind';
  if not found then raise exception 'reports.report_kind fehlt'; end if;
end $$;
