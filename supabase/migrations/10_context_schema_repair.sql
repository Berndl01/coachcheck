-- ============================================================
-- MIGRATION 10 — CONTEXT SCHEMA REPAIR / POSTGREST CACHE RELOAD
-- ============================================================
-- Sichert die Premium-Kontextfelder auch dann ab, wenn Migration 08
-- auf der Live-Datenbank nur teilweise oder noch nicht ausgeführt wurde.
-- Der abschließende pg_notify leert den Supabase/PostgREST Schema-Cache.
-- ============================================================

alter table public.assessments
  add column if not exists context_season_phase text check (context_season_phase in (
    'vorbereitung', 'fruehe_saison', 'erfolgslauf', 'formkrise',
    'kaderumbruch', 'trainerwechsel', 'saisonendphase', 'aufstiegsdruck', 'abstiegsdruck'
  )),
  add column if not exists context_team_maturity text check (context_team_maturity in (
    'jung_unerfahren', 'gemischt', 'reif_etabliert', 'umbruch'
  )),
  add column if not exists context_conflict_state text check (context_conflict_state in (
    'stabil', 'leichte_spannungen', 'spuerbare_spannungen', 'akuter_konflikt'
  )),
  add column if not exists context_age_range text,
  add column if not exists context_notes text,
  add column if not exists maturity_scores jsonb;

comment on column public.assessments.context_season_phase is 'Aktuelle Saisonphase des Assessments für die Premium-Interpretation.';
comment on column public.assessments.context_team_maturity is 'Team-Reife/Reifegrad für Coach-to-Team-Fit.';
comment on column public.assessments.context_conflict_state is 'Aktuelle Konfliktlage im Team.';
comment on column public.assessments.context_age_range is 'Optionale Altersstruktur oder Altersangabe.';
comment on column public.assessments.context_notes is 'Optionale Notiz des Trainers zum aktuellen Kontext.';
comment on column public.assessments.maturity_scores is 'Sechs Reifeachsen, getrennt vom Führungsstil.';

select pg_notify('pgrst', 'reload schema');
