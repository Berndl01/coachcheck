-- ============================================================
-- MIGRATION 25 — STRESS / DRUCK / KOMMUNIKATION (Premiumprodukt-Tiefe)
-- ============================================================
-- Hebt die Premium-Report-Tiers (Tier 2 Selbsttest + Tier 3 360° Spiegel)
-- inhaltlich an. Schnelltest (Tier 1) und TeamCheck (Tier 4) bleiben
-- bewusst unangetastet.
--
-- Neue Items (claim-sicher — Entwicklungs-/Coachinghinweise, KEINE klinische
-- Einordnung), getaggt für Tier [2,3]:
--   · Modul E — Submodul 'belastung' (eigene Belastung/Erholung des Trainers):
--     6 Items (state + likert + 1 Wichtig/Gelebt-Paar).
--   · Modul E — 'druck' Außendruck (Verein/Eltern/Umfeld): 1 Szenario + 1 Likert.
--   · Modul B — schwierige Kommunikation: 2 Szenarien (Bank-Botschaft,
--     Konflikt zweier Leistungsträger) + 1 Likert (Niederlagen-Ansprache).
--   → 11 neue Items. Selbsttest/360° Self-Pool: 92 → 103.
--
-- Invariante „beworben = geliefert":
--   get_items_for_assessment liefert für Tier 2/3 nun 103 Items. Diese Migration
--   zieht die Produkt-Metadaten nach (item_count 92→103, Dauer 25→28 bzw. 360°
--   45→48). Die drei hartkodierten Startseiten-Zahlen (Hero/How-it-works/Stats)
--   sind in derselben Auslieferung (v3_27) auf 103/100+ aktualisiert. Das Intro
--   ist dynamisch (items.length) und passt sich automatisch an.
--
-- Idempotent: on conflict (code) do nothing; Produkt-Updates guarded.
-- Achsen identisch zu Migration 03/15.
-- ============================================================

insert into public.items (code, module_code, submodule, format, text_de, options, axis_weights, package_tiers, reverse_scored) values

-- =========================================================
-- MODUL E — EIGENE BELASTUNG / ERHOLUNG DES TRAINERS (neu: 'belastung')
-- Entwicklungs-Wahrnehmung, claim-sicher (keine klinische Einordnung).
-- =========================================================

('E_be_01', 'E', 'belastung', 'state',
  'In den letzten 14 Tagen konnte ich nach intensiven Tagen wieder abschalten.',
  null,
  '{"stabilisierung_aktivierung": -0.4, "reflexion_direktheit": 0.3}'::jsonb,
  ARRAY[2,3], false),

('E_be_02', 'E', 'belastung', 'state',
  'In den letzten 14 Tagen habe ich früh gemerkt, wenn meine eigene Belastung zu hoch wurde.',
  null,
  '{"reflexion_direktheit": 0.6}'::jsonb,
  ARRAY[2,3], false),

('E_be_03', 'E', 'belastung', 'likert_5',
  'Ich plane bewusst Erholungsfenster für mich selbst ein, nicht nur für das Team.',
  null,
  '{"stabilisierung_aktivierung": -0.4, "struktur_intuition": 0.2}'::jsonb,
  ARRAY[2,3], false),

('E_be_04', 'E', 'belastung', 'likert_5',
  'Ich habe Menschen, mit denen ich Belastung offen besprechen kann.',
  null,
  '{"leistung_beziehung": -0.3}'::jsonb,
  ARRAY[2,3], false),

('E_be_05', 'E', 'belastung', 'gap_wichtig',
  'Wie wichtig ist dir deine eigene Regeneration als Teil deiner Führungsqualität?',
  null,
  '{"stabilisierung_aktivierung": -0.3}'::jsonb,
  ARRAY[2,3], false),

('E_be_06', 'E', 'belastung', 'gap_gelebt',
  'Wie konsequent lebst du deine eigene Regeneration aktuell?',
  null,
  '{"stabilisierung_aktivierung": -0.3}'::jsonb,
  ARRAY[2,3], false),

-- =========================================================
-- MODUL E — AUSSENDRUCK (Verein / Eltern / Umfeld)
-- =========================================================

('E_dr_13', 'E', 'druck', 'szenario',
  'Von außen — Vorstand, Eltern oder Umfeld — wächst der Druck auf deine Aufstellung. Was ist deine dominante Reaktion?',
  '[
    {"key": "A", "text": "Ich trenne klar: sportliche Entscheidung bleibt meine, die Erwartung nehme ich sachlich auf.",
     "weights": {"reflexion_direktheit": 0.5, "autoritaet_beteiligung": 0.3}},
    {"key": "B", "text": "Ich suche das direkte Gespräch und erkläre meine Linie transparent.",
     "weights": {"autoritaet_beteiligung": -0.4, "reflexion_direktheit": 0.4}},
    {"key": "C", "text": "Ich ziehe eine klare Grenze und halte das Umfeld bewusst auf Abstand.",
     "weights": {"autoritaet_beteiligung": 0.6, "standardisierung_anpassung": 0.3}},
    {"key": "D", "text": "Ich wäge ab und beziehe einzelne Erwartungen in meine Entscheidung mit ein.",
     "weights": {"standardisierung_anpassung": -0.5, "leistung_beziehung": -0.3}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3], false),

('E_dr_14', 'E', 'druck', 'likert_5',
  'Ich kann Druck von außen (Verein, Eltern, Umfeld) klar vom sportlichen Kern trennen.',
  null,
  '{"reflexion_direktheit": 0.5, "autoritaet_beteiligung": 0.2}'::jsonb,
  ARRAY[2,3], false),

-- =========================================================
-- MODUL B — SCHWIERIGE KOMMUNIKATION (High-Stakes)
-- =========================================================

('B_ko_15', 'B', 'kommunikation', 'szenario',
  'Du musst einem verdienten Stammspieler erklären, dass er vorerst auf die Bank rückt. Wie kommunizierst du das?',
  '[
    {"key": "A", "text": "Klare Begründung, Weg zurück aufzeigen, Reviewtermin vereinbaren.",
     "weights": {"struktur_intuition": 0.4, "reflexion_direktheit": 0.4}},
    {"key": "B", "text": "Wertschätzung zuerst, dann die Entscheidung — Beziehung trägt die Botschaft.",
     "weights": {"leistung_beziehung": -0.6}},
    {"key": "C", "text": "Kurz und unmissverständlich — die Leistung entscheidet, das ist Profigeschäft.",
     "weights": {"autoritaet_beteiligung": 0.6, "leistung_beziehung": 0.5}},
    {"key": "D", "text": "Ich binde ihn in eine neue, sichtbare Rolle ein, statt nur zu degradieren.",
     "weights": {"standardisierung_anpassung": -0.5, "stabilisierung_aktivierung": -0.3}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3], false),

('B_ko_16', 'B', 'kommunikation', 'szenario',
  'Zwischen zwei Leistungsträgern schwelt ein Konflikt, der das Teamklima belastet. Was tust du zuerst?',
  '[
    {"key": "A", "text": "Einzelgespräche führen, dann moderiert zusammenbringen.",
     "weights": {"reflexion_direktheit": 0.5, "autoritaet_beteiligung": -0.3}},
    {"key": "B", "text": "Klare Ansage an beide: Teaminteresse steht über Einzelbefindlichkeiten.",
     "weights": {"autoritaet_beteiligung": 0.6, "leistung_beziehung": 0.3}},
    {"key": "C", "text": "Ich beobachte erst, ob sich das im Wettkampf von selbst regelt.",
     "weights": {"stabilisierung_aktivierung": -0.4, "reflexion_direktheit": -0.3}},
    {"key": "D", "text": "Ich gebe dem Team einen gemeinsamen Bezugspunkt, der größer ist als der Konflikt.",
     "weights": {"struktur_intuition": 0.3, "leistung_beziehung": -0.3}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3], false),

('B_ko_17', 'B', 'kommunikation', 'likert_5',
  'Nach einer Niederlage finde ich die richtige Balance zwischen Klartext und Aufbau.',
  null,
  '{"reflexion_direktheit": 0.4, "leistung_beziehung": -0.2}'::jsonb,
  ARRAY[2,3], false)

on conflict (code) do nothing;

-- ============================================================
-- PRODUKT-METADATEN nachziehen (Invariante „beworben = geliefert").
-- Guarded/idempotent.
-- ============================================================

-- Selbsttest (Tier 2): 92 → 103 Items, ~28 Min.
update public.products
set
  item_count = 103,
  duration_min = 28,
  features = '[
    "103 Premium-Items · ~28 Minuten",
    "7 Analyse- & Coaching-Module inkl. eigener Belastung & Außendruck",
    "Haupttyp + Sekundärtyp aus 12 Archetypen",
    "Druckprofil, Entscheidungslogik & schwierige Kommunikation",
    "Blind Spots, Paradoxien & 14/30/90-Programm"
  ]'::jsonb
where slug = 'selbsttest' and item_count is distinct from 103;

-- 360° (Tier 3): Selbst-Pool 92 → 103, ~48 Min.
update public.products
set
  item_count = 103,
  duration_min = 48,
  features = '[
    "Selbsttest (103 Items) + 5 Fremdeinschätzungen",
    "Identity vs. Behavior Gap",
    "Diskrepanz- & Streuungsanalyse",
    "Funktionale Signatur",
    "Ausführlicher Premium-Report"
  ]'::jsonb
where slug = 'spiegel_360' and item_count is distinct from 103;
