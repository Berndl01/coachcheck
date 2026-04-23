-- ============================================================
-- MIGRATION 09 — NIVEAU & ALTERSKLASSE
-- ============================================================
-- Damit Reports und Deep-Dive-Texte den passenden Ton treffen
-- (Amateur-Hobby ≠ Profi-Vollzeit), speichern wir:
-- - das Niveau, auf dem der Trainer arbeitet
-- - die Altersklasse seiner Spieler
-- - den Vereins-/Team-Kontext
-- ============================================================

alter table public.profiles
  add column if not exists training_level text check (training_level in (
    'amateur_hobby',        -- Freizeit, Spaß im Vordergrund
    'amateur_ambitioniert', -- Ambitionierter Verein, Liga-Ebene
    'semi_profi',           -- Nachwuchs-Leistungssport, höhere Amateurliga, NLZ
    'profi'                 -- Vollzeit-Trainer im Profibereich
  )),
  add column if not exists age_group text check (age_group in (
    'kids_u12',
    'jugend_u16',
    'jugend_u18',
    'erwachsene',
    'gemischt'
  )),
  add column if not exists club_type text check (club_type in (
    'dorfverein',
    'stadtverein',
    'leistungszentrum',
    'akademie',
    'sonstige'
  ));

comment on column public.profiles.training_level is 'Niveau-Einordnung: bestimmt Ton und Beispiele in Reports.';
comment on column public.profiles.age_group is 'Altersklasse der Spieler — beeinflusst Szenen und Reife-Erwartungen.';
