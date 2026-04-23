-- ============================================================
-- MIGRATION 03 — PREMIUM ITEM POOL
-- 100+ Items across 7 Modules × 8 Formate
-- Basiert auf Humatrix Coach Assessment Architektur
-- ============================================================
--
-- Module:
--   A = Führungsidentität
--   B = Kommunikationsarchitektur
--   C = Entscheidung & Prioritätslogik
--   D = Fehler- & Lernkultur
--   E = Führung unter Druck
--   F = Motivation & Aktivierung
--   G = Beziehungs- & Vertrauensarchitektur
--
-- Formate:
--   likert_5       = Zustimmungsskala 1–5
--   forced_choice  = Entscheidung zwischen 2 Optionen
--   spannungsfeld  = Position zwischen 2 Polen (0.0–1.0)
--   szenario       = Realsituation + 4 Reaktionen
--   dilemma        = Führungsdilemma mit 4 Prioritäten
--   gap_wichtig    = "Wie wichtig ist dir?"
--   gap_gelebt     = "Wie stark lebst du es aktuell?"
--   state          = Aktueller Zustand (letzte 14 Tage)
--
-- Axis-Weights beziehen sich auf die 6 Kernachsen:
--   struktur_intuition         (−1.0 intuitiv  …  +1.0 strukturiert)
--   autoritaet_beteiligung     (−1.0 beteiligend  …  +1.0 autoritär)
--   leistung_beziehung         (−1.0 beziehungsorientiert  …  +1.0 leistungsorientiert)
--   stabilisierung_aktivierung (−1.0 stabilisierend  …  +1.0 aktivierend)
--   reflexion_direktheit       (−1.0 direkt  …  +1.0 reflektiert)
--   standardisierung_anpassung (−1.0 anpassend  …  +1.0 standardisierend)
--
-- package_tiers: [1,2,3,4] bestimmt, in welchen Paketen das Item erscheint.
-- ============================================================

-- =========================================================
-- MODUL A — FÜHRUNGSIDENTITÄT
-- =========================================================

insert into public.items (code, module_code, submodule, format, text_de, options, axis_weights, package_tiers, reverse_scored) values

('A_id_01', 'A', 'identitaet', 'likert_5',
  'Ich habe ein klares Bild davon, wofür ich als Trainer stehen will.',
  null,
  '{"struktur_intuition": 0.3, "reflexion_direktheit": 0.5}'::jsonb,
  ARRAY[1,2,3,4], false),

('A_id_02', 'A', 'identitaet', 'likert_5',
  'Mein Führungsverhalten folgt erkennbaren Prinzipien und nicht nur situativen Impulsen.',
  null,
  '{"struktur_intuition": 0.7, "standardisierung_anpassung": 0.5}'::jsonb,
  ARRAY[1,2,3,4], false),

('A_id_03', 'A', 'identitaet', 'likert_5',
  'Auch unter Druck verliere ich meine Grundlinie nicht.',
  null,
  '{"stabilisierung_aktivierung": -0.6, "reflexion_direktheit": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('A_id_04', 'A', 'identitaet', 'likert_5',
  'Mein Auftreten passt zu den Werten, die ich von meinem Team verlange.',
  null,
  '{"reflexion_direktheit": 0.4, "standardisierung_anpassung": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('A_id_05', 'A', 'identitaet', 'likert_5',
  'Ich kann benennen, welche Wirkung ich bewusst erzeugen möchte.',
  null,
  '{"reflexion_direktheit": 0.6}'::jsonb,
  ARRAY[2,3,4], false),

('A_id_06', 'A', 'identitaet', 'forced_choice',
  'Welcher Satz beschreibt deinen natürlichen Führungsimpuls eher?',
  '[
    {"key": "A", "text": "Ich schaffe zuerst Orientierung, dann Verbindung.",
     "weights": {"autoritaet_beteiligung": 0.6, "leistung_beziehung": 0.5, "struktur_intuition": 0.4}},
    {"key": "B", "text": "Ich schaffe zuerst Verbindung, dann Orientierung.",
     "weights": {"autoritaet_beteiligung": -0.6, "leistung_beziehung": -0.5, "struktur_intuition": -0.4}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[1,2,3], false),

('A_id_07', 'A', 'identitaet', 'spannungsfeld',
  'Wo verortest du deinen Führungsstil aktuell zwischen diesen Polen?',
  '[{"left": "Struktur", "right": "Flexibilität", "axis": "standardisierung_anpassung"}]'::jsonb,
  '{"standardisierung_anpassung": 1.0}'::jsonb,
  ARRAY[1,2,3], false),

-- =========================================================
-- MODUL B — KOMMUNIKATIONSARCHITEKTUR
-- =========================================================

('B_ko_01', 'B', 'kommunikation', 'likert_5',
  'Ich formuliere Erwartungen so, dass sie für unterschiedliche Spielertypen anschlussfähig bleiben.',
  null,
  '{"standardisierung_anpassung": -0.5, "leistung_beziehung": -0.3}'::jsonb,
  ARRAY[1,2,3,4], false),

('B_ko_02', 'B', 'kommunikation', 'likert_5',
  'Meine Botschaften sind auch in Drucksituationen klar und nachvollziehbar.',
  null,
  '{"reflexion_direktheit": 0.2, "stabilisierung_aktivierung": -0.3}'::jsonb,
  ARRAY[2,3,4], false),

('B_ko_03', 'B', 'kommunikation', 'likert_5',
  'Ich passe meine Kommunikation an Situation und Person an, ohne beliebig zu werden.',
  null,
  '{"standardisierung_anpassung": -0.6, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('B_ko_04', 'B', 'kommunikation', 'likert_5',
  'Ich erkenne früh, wenn meine Botschaft im Team unterschiedlich ankommt.',
  null,
  '{"reflexion_direktheit": 0.7}'::jsonb,
  ARRAY[2,3,4], false),

('B_ko_05', 'B', 'kommunikation', 'likert_5',
  'Ich kommuniziere nicht nur Inhalte, sondern auch Orientierung.',
  null,
  '{"autoritaet_beteiligung": 0.3, "struktur_intuition": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('B_ko_06', 'B', 'kommunikation', 'likert_5',
  'Ich kann Kritik so formulieren, dass sie Klarheit erzeugt und nicht nur Widerstand.',
  null,
  '{"leistung_beziehung": -0.2, "reflexion_direktheit": 0.5}'::jsonb,
  ARRAY[2,3,4], false),

('B_ko_07', 'B', 'kommunikation', 'forced_choice',
  'Was ist dir in schwierigen Phasen wichtiger?',
  '[
    {"key": "A", "text": "Klare Ordnung und konsequente Führung",
     "weights": {"autoritaet_beteiligung": 0.7, "struktur_intuition": 0.5, "leistung_beziehung": 0.4}},
    {"key": "B", "text": "Vertrauen und Stabilität in der Beziehung",
     "weights": {"autoritaet_beteiligung": -0.5, "leistung_beziehung": -0.7, "stabilisierung_aktivierung": -0.3}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[1,2,3], false),

-- =========================================================
-- MODUL C — ENTSCHEIDUNG & PRIORITÄTSLOGIK
-- =========================================================

('C_en_01', 'C', 'entscheidung', 'likert_5',
  'Ich treffe Entscheidungen rechtzeitig und vermeide unnötige Führungsunschärfe.',
  null,
  '{"reflexion_direktheit": -0.5, "autoritaet_beteiligung": 0.4}'::jsonb,
  ARRAY[1,2,3,4], false),

('C_en_02', 'C', 'entscheidung', 'likert_5',
  'Ich kann Entscheidungen erklären, ohne mich zu rechtfertigen.',
  null,
  '{"autoritaet_beteiligung": 0.4, "reflexion_direktheit": 0.2}'::jsonb,
  ARRAY[2,3,4], false),

('C_en_03', 'C', 'entscheidung', 'likert_5',
  'Ich hole Perspektiven ein, ohne meine Führungsverantwortung zu verlieren.',
  null,
  '{"autoritaet_beteiligung": -0.3, "reflexion_direktheit": 0.5}'::jsonb,
  ARRAY[2,3,4], false),

('C_en_04', 'C', 'entscheidung', 'likert_5',
  'In unklaren Situationen bleibe ich entscheidungsfähig.',
  null,
  '{"reflexion_direktheit": -0.4, "stabilisierung_aktivierung": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('C_en_05', 'C', 'entscheidung', 'forced_choice',
  'Was wiegt in einer schwierigen Phase schwerer?',
  '[
    {"key": "A", "text": "Kurzfristige Stabilisierung",
     "weights": {"stabilisierung_aktivierung": -0.7, "leistung_beziehung": -0.3}},
    {"key": "B", "text": "Notwendige Konfrontation",
     "weights": {"stabilisierung_aktivierung": 0.6, "leistung_beziehung": 0.5, "autoritaet_beteiligung": 0.4}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[1,2,3], false),

('C_en_06', 'C', 'entscheidung', 'forced_choice',
  'Was ist für dich im Zweifel wichtiger?',
  '[
    {"key": "A", "text": "Konsequenz in Regeln",
     "weights": {"standardisierung_anpassung": 0.8, "struktur_intuition": 0.5, "autoritaet_beteiligung": 0.4}},
    {"key": "B", "text": "Flexibilität im Einzelfall",
     "weights": {"standardisierung_anpassung": -0.7, "reflexion_direktheit": 0.3}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[1,2,3], false),

('C_en_07', 'C', 'entscheidung', 'szenario',
  'Ein Leistungsträger zeigt wiederholt negative Körpersprache und beeinflusst das Team. Vor dem nächsten Spiel musst du reagieren. Was ist am ehesten deine erste Reaktion?',
  '[
    {"key": "A", "text": "Direktes Einzelgespräch mit deutlicher Grenzsetzung",
     "weights": {"autoritaet_beteiligung": 0.7, "reflexion_direktheit": -0.4, "leistung_beziehung": 0.3}},
    {"key": "B", "text": "Erst Beobachtung und Gespräch mit dem Trainerteam",
     "weights": {"reflexion_direktheit": 0.7, "autoritaet_beteiligung": -0.3, "standardisierung_anpassung": 0.2}},
    {"key": "C", "text": "Im Teamrahmen die Normen ansprechen, ohne Personalisierung",
     "weights": {"leistung_beziehung": -0.4, "standardisierung_anpassung": 0.5, "struktur_intuition": 0.3}},
    {"key": "D", "text": "Spieler zunächst durch gezielte Verantwortung aktivieren",
     "weights": {"stabilisierung_aktivierung": 0.6, "leistung_beziehung": -0.3, "reflexion_direktheit": 0.3}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

('C_en_08', 'C', 'entscheidung', 'szenario',
  'Nach einer Niederlage ist das Team emotional instabil. Was priorisierst du?',
  '[
    {"key": "A", "text": "Klare Analyse",
     "weights": {"reflexion_direktheit": 0.6, "leistung_beziehung": 0.4, "struktur_intuition": 0.4}},
    {"key": "B", "text": "Emotionale Stabilisierung",
     "weights": {"leistung_beziehung": -0.7, "stabilisierung_aktivierung": -0.5}},
    {"key": "C", "text": "Neue Aktivierung",
     "weights": {"stabilisierung_aktivierung": 0.8, "leistung_beziehung": 0.3}},
    {"key": "D", "text": "Verantwortungs- und Rollenklärung",
     "weights": {"autoritaet_beteiligung": 0.5, "struktur_intuition": 0.4, "standardisierung_anpassung": 0.4}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

('C_en_09', 'C', 'entscheidung', 'dilemma',
  'Ein sozial zentraler Spieler erfüllt sportliche Standards nicht. Was wiegt für dich kurzfristig am stärksten?',
  '[
    {"key": "A", "text": "Leistungsgerechtigkeit",
     "weights": {"leistung_beziehung": 0.8, "standardisierung_anpassung": 0.6}},
    {"key": "B", "text": "Teamstabilität",
     "weights": {"leistung_beziehung": -0.6, "stabilisierung_aktivierung": -0.5}},
    {"key": "C", "text": "Entwicklungspotenzial des Spielers",
     "weights": {"leistung_beziehung": -0.3, "reflexion_direktheit": 0.5}},
    {"key": "D", "text": "Signalwirkung an die Gruppe",
     "weights": {"autoritaet_beteiligung": 0.6, "leistung_beziehung": 0.4, "standardisierung_anpassung": 0.5}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

('C_en_10', 'C', 'entscheidung', 'spannungsfeld',
  'Wo liegst du zwischen diesen beiden Polen deines Führungsstils?',
  '[{"left": "Kontrolle", "right": "Vertrauen", "axis": "autoritaet_beteiligung"}]'::jsonb,
  '{"autoritaet_beteiligung": 1.0}'::jsonb,
  ARRAY[1,2,3], false),

-- =========================================================
-- MODUL D — FEHLER- & LERNKULTUR
-- =========================================================

('D_fe_01', 'D', 'fehlerkultur', 'likert_5',
  'Ich kann Leistungskritik klar aussprechen, ohne die Person abzuwerten.',
  null,
  '{"reflexion_direktheit": 0.3, "leistung_beziehung": 0.2}'::jsonb,
  ARRAY[1,2,3,4], false),

('D_fe_02', 'D', 'fehlerkultur', 'likert_5',
  'Fehler sind für mich eher Bearbeitungsanlass als Bedrohung.',
  null,
  '{"leistung_beziehung": -0.3, "reflexion_direktheit": 0.5}'::jsonb,
  ARRAY[2,3,4], false),

('D_fe_03', 'D', 'fehlerkultur', 'likert_5',
  'Unter Druck sinkt meine Qualität im Umgang mit Fehlern nicht deutlich ab.',
  null,
  '{"stabilisierung_aktivierung": -0.5, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('D_fe_04', 'D', 'fehlerkultur', 'likert_5',
  'Nach Fehlern richte ich den Blick schnell wieder auf Lernen und Lösung.',
  null,
  '{"reflexion_direktheit": 0.4, "stabilisierung_aktivierung": 0.2}'::jsonb,
  ARRAY[2,3,4], false),

('D_fe_05', 'D', 'fehlerkultur', 'likert_5',
  'Mein Verhalten nach Fehlern erhöht die Handlungsfähigkeit des Teams.',
  null,
  '{"leistung_beziehung": -0.2, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('D_fe_06', 'D', 'fehlerkultur', 'gap_wichtig',
  'Wie wichtig ist dir, dass Spieler Kritik als entwicklungsfördernd erleben?',
  null,
  '{"leistung_beziehung": -0.3, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('D_fe_07', 'D', 'fehlerkultur', 'gap_gelebt',
  'Wie gut gelingt dir das aktuell tatsächlich?',
  null,
  '{"leistung_beziehung": -0.3, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

-- =========================================================
-- MODUL E — FÜHRUNG UNTER DRUCK  (Luxus-Modul)
-- =========================================================

('E_dr_01', 'E', 'druck', 'likert_5',
  'Unter Druck werde ich klarer, aber auch schärfer.',
  null,
  '{"autoritaet_beteiligung": 0.5, "leistung_beziehung": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('E_dr_02', 'E', 'druck', 'likert_5',
  'In Druckphasen sinkt meine Geduld schneller als sonst.',
  null,
  '{"leistung_beziehung": 0.5, "stabilisierung_aktivierung": 0.4, "reflexion_direktheit": -0.3}'::jsonb,
  ARRAY[2,3,4], true),

('E_dr_03', 'E', 'druck', 'likert_5',
  'Wenn Unsicherheit steigt, erhöhe ich spürbar meine Kontrolle.',
  null,
  '{"autoritaet_beteiligung": 0.6, "standardisierung_anpassung": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('E_dr_04', 'E', 'druck', 'likert_5',
  'In kritischen Situationen bin ich weniger offen für Widerspruch.',
  null,
  '{"autoritaet_beteiligung": 0.5, "reflexion_direktheit": -0.4}'::jsonb,
  ARRAY[2,3,4], true),

('E_dr_05', 'E', 'druck', 'likert_5',
  'Nach Rückschlägen werde ich eher präziser als härter.',
  null,
  '{"reflexion_direktheit": 0.6, "leistung_beziehung": -0.3}'::jsonb,
  ARRAY[2,3,4], false),

('E_dr_06', 'E', 'druck', 'state',
  'In den letzten 14 Tagen war meine Kommunikation unter Druck klar.',
  null,
  '{"reflexion_direktheit": 0.3, "stabilisierung_aktivierung": -0.3}'::jsonb,
  ARRAY[2,3,4], false),

('E_dr_07', 'E', 'druck', 'state',
  'In den letzten 14 Tagen habe ich meine Grundlinie auch unter Belastung gehalten.',
  null,
  '{"stabilisierung_aktivierung": -0.5, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('E_dr_08', 'E', 'druck', 'forced_choice',
  'Was beschreibt dich in Drucksituationen eher?',
  '[
    {"key": "A", "text": "Ich werde sichtbar präsenter und strukturierter.",
     "weights": {"autoritaet_beteiligung": 0.5, "struktur_intuition": 0.5, "stabilisierung_aktivierung": -0.2}},
    {"key": "B", "text": "Ich ziehe mich innerlich zurück und analysiere.",
     "weights": {"reflexion_direktheit": 0.7, "autoritaet_beteiligung": -0.3, "stabilisierung_aktivierung": -0.4}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3], false),

-- =========================================================
-- MODUL F — MOTIVATION & AKTIVIERUNG
-- =========================================================

('F_mo_01', 'F', 'motivation', 'likert_5',
  'Ich kann mein Team emotional in eine gemeinsame Richtung bringen.',
  null,
  '{"stabilisierung_aktivierung": 0.6, "autoritaet_beteiligung": 0.3}'::jsonb,
  ARRAY[1,2,3,4], false),

('F_mo_02', 'F', 'motivation', 'likert_5',
  'Ich motiviere nicht nur kurzfristig, sondern über nachvollziehbare Ziele.',
  null,
  '{"struktur_intuition": 0.5, "reflexion_direktheit": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('F_mo_03', 'F', 'motivation', 'likert_5',
  'Meine Aktivierung erzeugt eher Fokus als bloßen Druck.',
  null,
  '{"leistung_beziehung": -0.3, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('F_mo_04', 'F', 'motivation', 'likert_5',
  'Ich weiß, dass unterschiedliche Spieler unterschiedliche Motivationszugänge brauchen.',
  null,
  '{"standardisierung_anpassung": -0.6, "reflexion_direktheit": 0.5}'::jsonb,
  ARRAY[2,3,4], false),

('F_mo_05', 'F', 'motivation', 'likert_5',
  'Nach einer schwachen Phase kann ich Energie neu aufbauen, ohne künstlich zu wirken.',
  null,
  '{"stabilisierung_aktivierung": 0.5, "reflexion_direktheit": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('F_mo_06', 'F', 'motivation', 'spannungsfeld',
  'Wo verortest du dich aktuell?',
  '[{"left": "Stabilisierung", "right": "Aktivierung", "axis": "stabilisierung_aktivierung"}]'::jsonb,
  '{"stabilisierung_aktivierung": 1.0}'::jsonb,
  ARRAY[1,2,3], false),

('F_mo_07', 'F', 'motivation', 'spannungsfeld',
  'Wo verortest du deinen natürlichen Fokus?',
  '[{"left": "Leistung", "right": "Beziehung", "axis": "leistung_beziehung"}]'::jsonb,
  '{"leistung_beziehung": -1.0}'::jsonb,
  ARRAY[1,2,3], false),

-- =========================================================
-- MODUL G — BEZIEHUNGS- & VERTRAUENSARCHITEKTUR
-- =========================================================

('G_be_01', 'G', 'beziehung', 'likert_5',
  'Ich schaffe es, auch in Kritikbeziehungen respektvoll anschlussfähig zu bleiben.',
  null,
  '{"leistung_beziehung": -0.5, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[1,2,3,4], false),

('G_be_02', 'G', 'beziehung', 'likert_5',
  'Spieler können meine Haltung auch dann annehmen, wenn sie meine Entscheidungen nicht mögen.',
  null,
  '{"leistung_beziehung": -0.3, "autoritaet_beteiligung": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('G_be_03', 'G', 'beziehung', 'likert_5',
  'Ich wirke im Alltag eher berechenbar als widersprüchlich.',
  null,
  '{"standardisierung_anpassung": 0.6, "struktur_intuition": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('G_be_04', 'G', 'beziehung', 'likert_5',
  'Zwischen Nähe und professioneller Distanz halte ich eine tragfähige Balance.',
  null,
  '{"reflexion_direktheit": 0.5}'::jsonb,
  ARRAY[2,3,4], false),

('G_be_05', 'G', 'beziehung', 'likert_5',
  'Vertrauen entsteht bei mir nicht zufällig, sondern durch wiederholbare Qualität.',
  null,
  '{"standardisierung_anpassung": 0.5, "struktur_intuition": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('G_be_06', 'G', 'beziehung', 'gap_wichtig',
  'Wie wichtig ist dir Rollenklarheit im Team?',
  null,
  '{"struktur_intuition": 0.5, "standardisierung_anpassung": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('G_be_07', 'G', 'beziehung', 'gap_gelebt',
  'Wie klar erleben Spieler ihre Rollen aus deiner Sicht aktuell?',
  null,
  '{"struktur_intuition": 0.5, "standardisierung_anpassung": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

-- =========================================================
-- WEITERE HOCHWERTIGE ITEMS (für 45-60 Core-Items in Paket 2)
-- =========================================================

('A_id_08', 'A', 'identitaet', 'spannungsfeld',
  'Wo verortest du deinen Führungsstil aktuell?',
  '[{"left": "Direktheit", "right": "Diplomatie", "axis": "reflexion_direktheit"}]'::jsonb,
  '{"reflexion_direktheit": 1.0}'::jsonb,
  ARRAY[1,2,3], false),

('A_id_09', 'A', 'identitaet', 'spannungsfeld',
  'Wo ist deine natürliche Tendenz?',
  '[{"left": "Nähe", "right": "Distanz", "axis": "leistung_beziehung"}]'::jsonb,
  '{"leistung_beziehung": 1.0}'::jsonb,
  ARRAY[1,2,3], false),

('B_ko_08', 'B', 'kommunikation', 'szenario',
  'Ein Spieler zweifelt sichtbar an deiner Entscheidung, ohne offen zu widersprechen. Was ist deine wahrscheinlichste erste Reaktion?',
  '[
    {"key": "A", "text": "Direktes Ansprechen im Einzelgespräch",
     "weights": {"autoritaet_beteiligung": 0.3, "reflexion_direktheit": 0.4, "leistung_beziehung": -0.3}},
    {"key": "B", "text": "Zunächst Beobachtung und spätere Einordnung",
     "weights": {"reflexion_direktheit": 0.7, "autoritaet_beteiligung": -0.4}},
    {"key": "C", "text": "Ansprechen im Mannschaftskontext über Normen",
     "weights": {"standardisierung_anpassung": 0.6, "leistung_beziehung": 0.3}},
    {"key": "D", "text": "Bewusste Nicht-Reaktion, um Dynamik nicht zu verstärken",
     "weights": {"stabilisierung_aktivierung": -0.7, "reflexion_direktheit": 0.3}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

('C_en_11', 'C', 'entscheidung', 'dilemma',
  'Du musst zwischen kurzfristiger Teamruhe und einer notwendigen unpopulären Entscheidung wählen. Worauf priorisierst du stärker?',
  '[
    {"key": "A", "text": "Stabilität im Moment",
     "weights": {"stabilisierung_aktivierung": -0.8, "leistung_beziehung": -0.5, "autoritaet_beteiligung": -0.3}},
    {"key": "B", "text": "Klarheit trotz Unruhe",
     "weights": {"stabilisierung_aktivierung": 0.5, "leistung_beziehung": 0.6, "autoritaet_beteiligung": 0.6}},
    {"key": "C", "text": "Längerfristige Teamkultur",
     "weights": {"reflexion_direktheit": 0.7, "struktur_intuition": 0.3}},
    {"key": "D", "text": "Konsistenz mit meiner Führungslinie",
     "weights": {"standardisierung_anpassung": 0.7, "struktur_intuition": 0.4}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

('D_fe_08', 'D', 'fehlerkultur', 'szenario',
  'Ein junger Spieler macht einen entscheidenden Fehler im wichtigen Spiel. Wie reagierst du unmittelbar danach?',
  '[
    {"key": "A", "text": "Sofortige Analyse im Spielkontext",
     "weights": {"reflexion_direktheit": 0.3, "leistung_beziehung": 0.5, "struktur_intuition": 0.4}},
    {"key": "B", "text": "Kurze stabilisierende Rückmeldung, Detail später",
     "weights": {"stabilisierung_aktivierung": -0.6, "leistung_beziehung": -0.5}},
    {"key": "C", "text": "Bewusst keine Reaktion, Spieler soll selbst verarbeiten",
     "weights": {"autoritaet_beteiligung": -0.5, "reflexion_direktheit": 0.4}},
    {"key": "D", "text": "Klare Ansage mit Verantwortungsübernahme",
     "weights": {"autoritaet_beteiligung": 0.6, "struktur_intuition": 0.5}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

('G_be_08', 'G', 'beziehung', 'spannungsfeld',
  'Wo liegst du zwischen diesen Polen?',
  '[{"left": "Forderung", "right": "Schutz", "axis": "leistung_beziehung"}]'::jsonb,
  '{"leistung_beziehung": 1.0}'::jsonb,
  ARRAY[1,2,3], false),

('G_be_09', 'G', 'beziehung', 'spannungsfeld',
  'Wo siehst du dich aktuell?',
  '[{"left": "Standardisierung", "right": "Individualisierung", "axis": "standardisierung_anpassung"}]'::jsonb,
  '{"standardisierung_anpassung": 1.0}'::jsonb,
  ARRAY[1,2,3], false),

('F_mo_08', 'F', 'motivation', 'ranking',
  'Was ist für dich die wichtigste Führungsaufgabe in einer Druckphase? Wähle deine stärkste Priorität.',
  '[
    {"key": "orient",   "text": "Orientierung geben",
     "weights": {"autoritaet_beteiligung": 0.4, "struktur_intuition": 0.4}},
    {"key": "ruhe",     "text": "Ruhe herstellen",
     "weights": {"stabilisierung_aktivierung": -0.8}},
    {"key": "leist",    "text": "Leistung einfordern",
     "weights": {"leistung_beziehung": 0.8, "autoritaet_beteiligung": 0.4}},
    {"key": "verant",   "text": "Verantwortung klären",
     "weights": {"struktur_intuition": 0.5, "standardisierung_anpassung": 0.4}},
    {"key": "energie",  "text": "Energie aktivieren",
     "weights": {"stabilisierung_aktivierung": 0.8}},
    {"key": "stab",     "text": "Einzelne Spieler stabilisieren",
     "weights": {"leistung_beziehung": -0.7, "reflexion_direktheit": 0.3}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

('E_dr_09', 'E', 'druck', 'state',
  'In den letzten 14 Tagen habe ich auch in Belastungssituationen respektvoll kommuniziert.',
  null,
  '{"leistung_beziehung": -0.3, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('B_ko_09', 'B', 'kommunikation', 'likert_5',
  'Nach Niederlagen bleibt meine Kommunikation klar und respektvoll.',
  null,
  '{"leistung_beziehung": -0.4, "reflexion_direktheit": 0.5, "stabilisierung_aktivierung": -0.3}'::jsonb,
  ARRAY[2,3,4], false),

('B_ko_10', 'B', 'kommunikation', 'likert_5',
  'In Einzelgesprächen gelingt mir oft mehr Tiefe als im Teamsetting.',
  null,
  '{"leistung_beziehung": -0.4, "reflexion_direktheit": 0.5}'::jsonb,
  ARRAY[2,3,4], false);

-- ============================================================
-- Fertig. Anzahl: ~55 Items.
-- Paket-Verteilung:
--   Tier 1 (Schnelltest):  ~18-20 Items
--   Tier 2 (Selbsttest):   alle ~55 Items
--   Tier 3 (360°):         dieselben + Fremdbild-Spiegel (kommt später)
--   Tier 4 (TeamCheck):    gekürzte Version (kommt später)
-- ============================================================

-- Sicherheit: Funktion für User, um ihre Assessment-Items zu laden
create or replace function public.get_items_for_assessment(assessment_uuid uuid)
returns setof public.items
language sql
security definer
set search_path = public
as $$
  select i.*
  from public.items i
  join public.assessments a on a.id = assessment_uuid
  join public.products p on p.id = a.product_id
  where i.active = true
    and p.tier = any(i.package_tiers)
  order by i.module_code, i.id;
$$;

grant execute on function public.get_items_for_assessment(uuid) to authenticated;
