-- ============================================================
-- MIGRATION 11 — PRODUCT METADATA HONESTY-FIX
-- Korrigiert Item-Counts und Seitenzahlen auf tatsächlich
-- gelieferte Werte (vorher: Marketing-Versprechen ohne Deckung).
-- Gesehen 30.04.2026: real seeded 19/64/51 Items vs.
-- beworben 22/92/70 Items, sowie "24 Seiten" für 360°-Spiegel
-- bei tatsächlich 14 Seiten.
-- ============================================================

-- Schnelltest (Tier 1): 19 Items real, 7 PDF-Seiten
update public.products
set
  item_count = 19,
  features = '[
    "19 Items · 6 Minuten",
    "Hybrid: Skalen + Forced Choice",
    "Typ-Tendenz aus 12 Archetypen",
    "3 Stärken · 3 Risiken",
    "Sofort-Ergebnis online · 7-Seiten-Report"
  ]'::jsonb,
  duration_min = 6
where slug = 'schnelltest';

-- Selbsttest (Tier 2): 64 Items real, 11 PDF-Seiten
update public.products
set
  item_count = 64,
  features = '[
    "64 Premium-Items · 20 Min",
    "6 Analyse- & Coaching-Module",
    "Haupttyp + Sekundärtyp",
    "Druckprofil & Entscheidungslogik",
    "Blind Spots & Entwicklungshebel · 11-Seiten-Report"
  ]'::jsonb,
  duration_min = 20
where slug = 'selbsttest';

-- 360° Spiegel (Tier 3): 64 Items real, 14 PDF-Seiten
update public.products
set
  item_count = 64,
  features = '[
    "Selbsttest + 5 Fremdeinschätzungen",
    "Identity vs. Behavior Gap",
    "Diskrepanz- & Streuungsanalyse",
    "Funktionale Signatur",
    "Premium-Report · 14 Seiten"
  ]'::jsonb,
  duration_min = 35
where slug = 'spiegel_360';

-- TeamCheck (Tier 4): 51 Trainer-Items real, 16-18 PDF-Seiten
update public.products
set
  item_count = 51,
  features = '[
    "Trainer: 51 Items · 20 Min",
    "Spieler: 12 Items · 8 Min · anonymisiert ab 5 Antworten",
    "Coach-Impact-Report",
    "Teamklima & Untergruppen-Analyse",
    "14-Tage-Maßnahmenplan · 16-18 Seiten"
  ]'::jsonb,
  duration_min = 20
where slug = 'teamcheck';

-- Saison & Beratung (Tier 5): unverändert (custom)
