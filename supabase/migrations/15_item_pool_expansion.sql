-- ============================================================
-- MIGRATION 15 — ITEM-POOL-ERWEITERUNG (Tiefe pro Stufe)
-- ============================================================
--
-- Ziel: jede Stufe inhaltlich vertiefen, ohne die Versprechen zu
-- brechen. Schwerpunkte:
--   1) MEHR Wichtig-vs-Gelebt-Paare (gap_wichtig/gap_gelebt) — das
--      stärkste Entwicklungssignal (Selbstbild vs. gelebte Praxis).
--   2) Neue Szenarien & Dilemmata pro Modul (situative Tiefe).
--   3) Neue Sub-Dimensionen: Wirkungstransparenz (Absicht vs. Wirkung),
--      Selbstwirksamkeit, Rollen-/Statusarbeit.
--
-- Konvention identisch zu Migration 03:
--   Spalten: (code, module_code, submodule, format, text_de, options,
--             axis_weights, package_tiers, reverse_scored)
--   Achsen:  struktur_intuition / autoritaet_beteiligung /
--            leistung_beziehung / stabilisierung_aktivierung /
--            reflexion_direktheit / standardisierung_anpassung
--
-- Alle Codes sind neu (kollidieren nicht mit 03/06).
-- Idempotent: on conflict (code) do nothing.
-- ============================================================

insert into public.items (code, module_code, submodule, format, text_de, options, axis_weights, package_tiers, reverse_scored) values

-- =========================================================
-- MODUL A — FÜHRUNGSIDENTITÄT (+ Wirkungstransparenz)
-- =========================================================

('A_id_10', 'A', 'wirkung', 'likert_5',
  'Ich weiß, wie meine Spieler meine Führung tatsächlich erleben — nicht nur, wie ich sie meine.',
  null,
  '{"reflexion_direktheit": 0.7}'::jsonb,
  ARRAY[1,2,3,4], false),

('A_id_11', 'A', 'wirkung', 'gap_wichtig',
  'Wie wichtig ist dir, dass deine Wirkung mit deiner Absicht übereinstimmt?',
  null,
  '{"reflexion_direktheit": 0.6}'::jsonb,
  ARRAY[2,3,4], false),

('A_id_12', 'A', 'wirkung', 'gap_gelebt',
  'Wie gut gelingt dir diese Übereinstimmung von Absicht und Wirkung aktuell?',
  null,
  '{"reflexion_direktheit": 0.6}'::jsonb,
  ARRAY[2,3,4], false),

('A_id_13', 'A', 'identitaet', 'likert_5',
  'Ich kann meine Führungslinie auch dann erklären, wenn sie unbequem ist.',
  null,
  '{"reflexion_direktheit": 0.4, "autoritaet_beteiligung": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('A_id_14', 'A', 'identitaet', 'szenario',
  'Ein Vereinsverantwortlicher hinterfragt öffentlich deinen Führungsstil. Was ist am ehesten deine erste Reaktion?',
  '[
    {"key": "A", "text": "Ich erläutere meine Prinzipien sachlich und bleibe bei meiner Linie.",
     "weights": {"struktur_intuition": 0.4, "reflexion_direktheit": 0.4, "autoritaet_beteiligung": 0.3}},
    {"key": "B", "text": "Ich suche das direkte Gespräch und kläre die Erwartungen.",
     "weights": {"reflexion_direktheit": 0.5, "leistung_beziehung": -0.3}},
    {"key": "C", "text": "Ich prüfe ehrlich, ob an der Kritik etwas dran ist, bevor ich reagiere.",
     "weights": {"reflexion_direktheit": 0.7, "standardisierung_anpassung": -0.3}},
    {"key": "D", "text": "Ich setze eine klare Grenze, um meine Autorität zu wahren.",
     "weights": {"autoritaet_beteiligung": 0.7, "reflexion_direktheit": -0.3}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

-- =========================================================
-- MODUL B — KOMMUNIKATIONSARCHITEKTUR (+ Zuhör-/Feedbacktiefe)
-- =========================================================

('B_ko_11', 'B', 'kommunikation', 'likert_5',
  'Ich höre im Gespräch wirklich zu, bevor ich meine Sicht setze.',
  null,
  '{"reflexion_direktheit": 0.6, "autoritaet_beteiligung": -0.3}'::jsonb,
  ARRAY[1,2,3,4], false),

('B_ko_12', 'B', 'kommunikation', 'gap_wichtig',
  'Wie wichtig ist dir, dass deine Botschaft bei jedem Spielertyp ankommt?',
  null,
  '{"standardisierung_anpassung": -0.5, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('B_ko_13', 'B', 'kommunikation', 'gap_gelebt',
  'Wie gut erreichst du aktuell tatsächlich unterschiedliche Spielertypen?',
  null,
  '{"standardisierung_anpassung": -0.5, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('B_ko_14', 'B', 'kommunikation', 'szenario',
  'Eine wichtige Botschaft ist im Team unterschiedlich angekommen — ein Teil ist motiviert, ein Teil verunsichert. Was tust du zuerst?',
  '[
    {"key": "A", "text": "Ich wiederhole die Botschaft klarer und strukturierter für alle.",
     "weights": {"struktur_intuition": 0.5, "standardisierung_anpassung": 0.4}},
    {"key": "B", "text": "Ich gehe gezielt auf die Verunsicherten zu und kläre individuell.",
     "weights": {"standardisierung_anpassung": -0.6, "leistung_beziehung": -0.4}},
    {"key": "C", "text": "Ich frage im Team aktiv nach, wie die Botschaft verstanden wurde.",
     "weights": {"autoritaet_beteiligung": -0.5, "reflexion_direktheit": 0.6}},
    {"key": "D", "text": "Ich setze auf Zeit — die Botschaft wirkt, wenn die Ergebnisse kommen.",
     "weights": {"stabilisierung_aktivierung": -0.5, "reflexion_direktheit": -0.3}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

-- =========================================================
-- MODUL C — ENTSCHEIDUNG & PRIORITÄTSLOGIK (+ Tempo/Reife)
-- =========================================================

('C_en_12', 'C', 'entscheidung', 'likert_5',
  'Ich erkenne, wann eine Entscheidung schnell und wann sie sorgfältig sein muss.',
  null,
  '{"reflexion_direktheit": 0.4, "struktur_intuition": 0.3}'::jsonb,
  ARRAY[1,2,3,4], false),

('C_en_13', 'C', 'entscheidung', 'dilemma',
  'Zwei deiner Werte geraten in Konflikt: Leistungsgerechtigkeit und Loyalität zu einem verdienten Spieler. Was wiegt für dich schwerer?',
  '[
    {"key": "A", "text": "Leistungsgerechtigkeit — die aktuelle Form entscheidet.",
     "weights": {"leistung_beziehung": 0.8, "standardisierung_anpassung": 0.5}},
    {"key": "B", "text": "Loyalität — Verdienste und Vertrauen zählen.",
     "weights": {"leistung_beziehung": -0.7, "standardisierung_anpassung": -0.3}},
    {"key": "C", "text": "Ein transparenter Kompromiss mit klaren Kriterien.",
     "weights": {"reflexion_direktheit": 0.6, "struktur_intuition": 0.4}},
    {"key": "D", "text": "Was die Signalwirkung an die Gruppe stärkt.",
     "weights": {"autoritaet_beteiligung": 0.5, "leistung_beziehung": 0.4}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

('C_en_14', 'C', 'entscheidung', 'spannungsfeld',
  'Wo liegst du zwischen diesen Polen deiner Entscheidungslogik?',
  '[{"left": "Tempo", "right": "Sorgfalt", "axis": "reflexion_direktheit"}]'::jsonb,
  '{"reflexion_direktheit": 1.0}'::jsonb,
  ARRAY[1,2,3], false),

-- =========================================================
-- MODUL D — FEHLER- & LERNKULTUR (+ Sicherheit/Mut)
-- =========================================================

('D_fe_09', 'D', 'fehlerkultur', 'likert_5',
  'Meine Spieler trauen sich, mir auch unangenehme Dinge offen zu sagen.',
  null,
  '{"leistung_beziehung": -0.4, "reflexion_direktheit": 0.4, "autoritaet_beteiligung": -0.3}'::jsonb,
  ARRAY[1,2,3,4], false),

('D_fe_10', 'D', 'fehlerkultur', 'gap_wichtig',
  'Wie wichtig ist dir, dass Spieler mutig spielen und Fehler riskieren dürfen?',
  null,
  '{"leistung_beziehung": -0.3, "stabilisierung_aktivierung": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('D_fe_11', 'D', 'fehlerkultur', 'gap_gelebt',
  'Wie sehr erleben deine Spieler aktuell, dass sie mutig spielen dürfen?',
  null,
  '{"leistung_beziehung": -0.3, "stabilisierung_aktivierung": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('D_fe_12', 'D', 'fehlerkultur', 'szenario',
  'Nach einem riskanten, aber gescheiterten Spielzug schauen die Spieler zu dir. Was vermittelst du in diesem Moment?',
  '[
    {"key": "A", "text": "Ich markiere den Mut positiv und gebe dann die Korrektur.",
     "weights": {"stabilisierung_aktivierung": 0.4, "reflexion_direktheit": 0.4, "leistung_beziehung": -0.3}},
    {"key": "B", "text": "Ich bleibe neutral — der Fehler spricht für sich.",
     "weights": {"leistung_beziehung": 0.3, "reflexion_direktheit": -0.3}},
    {"key": "C", "text": "Ich fordere sofort die nächste Aktion und halte den Fokus vorne.",
     "weights": {"stabilisierung_aktivierung": 0.6, "struktur_intuition": 0.3}},
    {"key": "D", "text": "Ich mache deutlich, dass solche Risiken klar abgesprochen sein müssen.",
     "weights": {"autoritaet_beteiligung": 0.6, "standardisierung_anpassung": 0.5}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

-- =========================================================
-- MODUL E — FÜHRUNG UNTER DRUCK (+ State/Selbstregulation)
-- =========================================================

('E_dr_10', 'E', 'druck', 'state',
  'In den letzten 14 Tagen habe ich auch nach Rückschlägen handlungsfähig geführt.',
  null,
  '{"stabilisierung_aktivierung": -0.4, "reflexion_direktheit": 0.4}'::jsonb,
  ARRAY[2,3,4], false),

('E_dr_11', 'E', 'druck', 'likert_5',
  'Ich merke früh, wenn ich unter Druck in alte Reaktionsmuster kippe.',
  null,
  '{"reflexion_direktheit": 0.7}'::jsonb,
  ARRAY[2,3,4], false),

('E_dr_12', 'E', 'druck', 'szenario',
  'Du liegst zur Halbzeit eines wichtigen Spiels zurück, das Team ist nervös. Was ist deine dominante Führungsaktion in der Kabine?',
  '[
    {"key": "A", "text": "Ruhe und Orientierung geben — Fakten, ein klarer Plan.",
     "weights": {"stabilisierung_aktivierung": -0.6, "struktur_intuition": 0.4, "reflexion_direktheit": 0.3}},
    {"key": "B", "text": "Energie und Emotion aktivieren — aufrütteln.",
     "weights": {"stabilisierung_aktivierung": 0.8, "leistung_beziehung": 0.3}},
    {"key": "C", "text": "Klare Ansage mit Verantwortungsverteilung.",
     "weights": {"autoritaet_beteiligung": 0.7, "struktur_intuition": 0.4}},
    {"key": "D", "text": "Einzelne Schlüsselspieler gezielt ansprechen und stabilisieren.",
     "weights": {"leistung_beziehung": -0.5, "reflexion_direktheit": 0.4}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

-- =========================================================
-- MODUL F — MOTIVATION & AKTIVIERUNG (+ Autonomie/Bedürfnisse)
-- =========================================================

('F_mo_09', 'F', 'motivation', 'likert_5',
  'Ich gebe Spielern echten Handlungsspielraum, nicht nur die Illusion von Mitbestimmung.',
  null,
  '{"autoritaet_beteiligung": -0.6, "reflexion_direktheit": 0.3}'::jsonb,
  ARRAY[1,2,3,4], false),

('F_mo_10', 'F', 'motivation', 'gap_wichtig',
  'Wie wichtig ist dir, dass Spieler sich kompetent und zugehörig fühlen?',
  null,
  '{"leistung_beziehung": -0.4, "stabilisierung_aktivierung": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('F_mo_11', 'F', 'motivation', 'gap_gelebt',
  'Wie stark erleben deine Spieler dieses Gefühl von Kompetenz und Zugehörigkeit aktuell?',
  null,
  '{"leistung_beziehung": -0.4, "stabilisierung_aktivierung": 0.3}'::jsonb,
  ARRAY[2,3,4], false),

('F_mo_12', 'F', 'motivation', 'forced_choice',
  'Worüber entsteht für dich nachhaltige Motivation eher?',
  '[
    {"key": "A", "text": "Über klare Ziele und sichtbaren Fortschritt.",
     "weights": {"struktur_intuition": 0.5, "leistung_beziehung": 0.4}},
    {"key": "B", "text": "Über Zugehörigkeit, Sinn und echte Beteiligung.",
     "weights": {"autoritaet_beteiligung": -0.5, "leistung_beziehung": -0.5}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[1,2,3], false),

-- =========================================================
-- MODUL G — BEZIEHUNGS- & VERTRAUENSARCHITEKTUR (+ Rolle/Status)
-- =========================================================

('G_be_10', 'G', 'beziehung', 'likert_5',
  'Spieler in Randrollen erleben mich als fair und nachvollziehbar.',
  null,
  '{"leistung_beziehung": -0.3, "reflexion_direktheit": 0.4, "standardisierung_anpassung": -0.3}'::jsonb,
  ARRAY[1,2,3,4], false),

('G_be_11', 'G', 'beziehung', 'gap_wichtig',
  'Wie wichtig ist dir, dass auch wenig spielende Spieler ihre Rolle verstehen und annehmen?',
  null,
  '{"struktur_intuition": 0.4, "leistung_beziehung": -0.3}'::jsonb,
  ARRAY[2,3,4], false),

('G_be_12', 'G', 'beziehung', 'gap_gelebt',
  'Wie gut gelingt dir die Rollenklärung mit Randspielern aktuell?',
  null,
  '{"struktur_intuition": 0.4, "leistung_beziehung": -0.3}'::jsonb,
  ARRAY[2,3,4], false),

('G_be_13', 'G', 'beziehung', 'szenario',
  'Ein lange verdienter Spieler verliert seinen Stammplatz und zieht sich emotional zurück. Wie gehst du vor?',
  '[
    {"key": "A", "text": "Frühes, ehrliches Gespräch: Rolle erklären, Impact-Aufgabe definieren.",
     "weights": {"reflexion_direktheit": 0.5, "struktur_intuition": 0.4, "leistung_beziehung": -0.3}},
    {"key": "B", "text": "Ich gebe Raum und warte ab, ob er sich selbst fängt.",
     "weights": {"stabilisierung_aktivierung": -0.4, "autoritaet_beteiligung": -0.3}},
    {"key": "C", "text": "Ich appelliere an seine Erfahrung und Leader-Funktion.",
     "weights": {"autoritaet_beteiligung": 0.3, "leistung_beziehung": -0.3}},
    {"key": "D", "text": "Ich mache die sportliche Entscheidung klar und halte sie konsequent.",
     "weights": {"leistung_beziehung": 0.6, "standardisierung_anpassung": 0.5}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[2,3,4], false),

('G_be_14', 'G', 'beziehung', 'likert_5',
  'Ich pflege Vertrauen aktiv — auch in Phasen ohne Konflikt.',
  null,
  '{"leistung_beziehung": -0.4, "standardisierung_anpassung": -0.3}'::jsonb,
  ARRAY[2,3,4], false)

on conflict (code) do nothing;

-- ============================================================
-- PRODUKT-METADATEN — ehrliche Aktualisierung nach Erweiterung
-- ============================================================
-- Neue reale Item-Zahlen (über package_tiers gezählt):
--   Tier 1 (Schnelltest): 19 + 8 neue Tier-1-Items     = 27
--   Tier 2 (Selbsttest):  64 + 28 neue Tier-2-Items     = 92
--   Tier 3 (360°):        wie Selbsttest (92) + Fremdbild
--   Tier 4 (TeamCheck):   51 + 26 neue Tier-4-Items      = 77 (Trainer)
-- Dauern moderat angepasst.

update public.products
set item_count = 27, duration_min = 9,
    features = '[
      "27 Items · 9 Minuten",
      "Hybrid: Skalen + Forced Choice + Szenario",
      "Typ-Tendenz aus 12 Archetypen",
      "3 Stärken · 3 Risiken · 1 Sofort-Hebel",
      "Sofort-Ergebnis online · 7-Seiten-Report"
    ]'::jsonb
where slug = 'schnelltest';

update public.products
set item_count = 92, duration_min = 28,
    features = '[
      "92 Premium-Items · 28 Min",
      "7 Analyse- & Coaching-Module + Wichtig-vs-Gelebt-Lücken",
      "Haupttyp + Sekundärtyp + Führungsreife",
      "Druckprofil & Entscheidungslogik",
      "Evidenzbasiertes Entwicklungsprogramm (14/30/90 Tage)"
    ]'::jsonb
where slug = 'selbsttest';

update public.products
set item_count = 92, duration_min = 40,
    features = '[
      "Selbsttest (92 Items) + 5 Fremdeinschätzungen",
      "Identity vs. Behavior Gap + Wichtig-vs-Gelebt",
      "Diskrepanz- & Streuungsanalyse",
      "Funktionale Signatur + Führungsreife",
      "Premium-Report inkl. Entwicklungsprogramm"
    ]'::jsonb
where slug = 'spiegel_360';

update public.products
set item_count = 77, duration_min = 27,
    features = '[
      "Trainer: 77 Items · 27 Min",
      "Spieler: 12 Items · 8 Min · anonymisiert ab 5 Antworten",
      "Coach-Impact-Report + Entwicklungsprogramm",
      "Teamklima & Untergruppen-Analyse",
      "14-Tage-Maßnahmenplan"
    ]'::jsonb
where slug = 'teamcheck';

-- ============================================================
-- DONE — Item-Pool erweitert, Metadaten ehrlich aktualisiert.
-- Nächster Schritt: Frontend-Texte (Landingpage/FAQ) auf die
-- neuen Item-Zahlen + "Entwicklungsprogramm" abstimmen.
-- ============================================================
