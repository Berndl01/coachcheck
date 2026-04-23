-- ============================================================
-- MIGRATION 08 — PREMIUM INTELLIGENCE LAYER
-- ============================================================
-- Erweitert das Schema um Kontext-Felder, die für die hochwertige
-- Interpretations-Schicht notwendig sind:
-- - Saisonphase
-- - Team-Reife
-- - Konfliktlage
-- - Altersstruktur
-- ============================================================

-- 1. Saison-Kontext am Assessment selbst
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
  add column if not exists context_notes text;

-- 2. Reifeachsen-Spalte für die zweite Auswertungs-Schicht
-- (Führungsreife jenseits des Stils)
alter table public.assessments
  add column if not exists maturity_scores jsonb;
  -- struktur: { "selbstregulation": 0..1, "perspektivflexibilitaet": ..., "konfliktreife": ..., "druckreife": ..., "verantwortungsklarheit": ..., "integrationsfaehigkeit": ... }

-- 3. Erweiterter Reports-Metadata-Wrapper für Schicht-2-Texte
-- (kein neues Feld nötig — wir nutzen das vorhandene metadata jsonb)

comment on column public.assessments.context_season_phase is 'In welcher Saisonphase wird das Assessment gemacht? Beeinflusst die Interpretations-Schicht.';
comment on column public.assessments.context_team_maturity is 'Wie reif/erfahren ist das Team? Für Coach-to-Team-Fit-Analyse.';
comment on column public.assessments.maturity_scores is 'Sechs Reifeachsen, getrennt vom Stil. Wird beim Finalize berechnet.';

-- ============================================================
-- DONE — Schema bereit für Premium Intelligence Layer
-- ============================================================
