-- =====================================================================
-- 20_response_quality.sql  —  Antwortqualität (#6) + KI-Metadaten (#8)
-- =====================================================================
-- Additiv & idempotent.
-- =====================================================================

-- (1) Antwortqualität pro Assessment (beim Finalisieren berechnet & gespeichert).
alter table public.assessments
  add column if not exists response_quality jsonb;

-- (2) KI-/Prompt-Metadaten am Report für Kosten-/Versions-Tracking (#8).
alter table public.reports
  add column if not exists prompt_version text;
alter table public.reports
  add column if not exists ai_fallback boolean not null default false;
-- prompt_tokens / completion_tokens existieren bereits in 01_schema.sql.
