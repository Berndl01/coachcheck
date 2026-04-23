-- ============================================================
-- MIGRATION 02 — 12 Premium Trainer-Archetypen
-- Basiert auf dem Humatrix Coach Assessment Strategie-Dokument
-- ============================================================

insert into public.archetypes (code, name_de, short_trait, kernmuster, staerken, risiken, entwicklungshebel, axis_profile) values

('strategic_architect', 'Der Strategische Architekt',
  'Struktur · Planung · Spielidee',
  'Stark in Struktur, Planung, Klarheit, Spielidee, Trainingslogik.',
  ARRAY['hohe Struktur','klare Trainingssteuerung','gutes Ordnungsgefühl','definierte Standards','gute taktische Führung'],
  ARRAY['zu viel System, zu wenig Beziehung','Distanz','Übersteuerung','wenig emotionale Anschlussfähigkeit'],
  ARRAY['Kommunikation emotional anschlussfähiger machen','mehr Resonanz auf individuelle Wahrnehmung','Beziehung nicht dem System opfern'],
  '{"struktur_intuition": 0.85, "autoritaet_beteiligung": 0.45, "leistung_beziehung": 0.70, "stabilisierung_aktivierung": 0.60, "reflexion_direktheit": 0.60, "standardisierung_anpassung": 0.80}'::jsonb),

('authoritative_leader', 'Der Autoritative Lenker',
  'Richtung · Präsenz · Entscheidung',
  'Hohe Führungssicherheit, starke Präsenz, klare Richtung, hohe Entscheidungskraft.',
  ARRAY['Orientierung','Sicherheit in Drucksituationen','Klarheit','Führungsstärke','Entscheidungsfreude'],
  ARRAY['geringe Beteiligung','zu dominant','wenig Offenheit für Rückmeldung','Angst statt Vertrauen'],
  ARRAY['Autorität mit Anschlussfähigkeit verbinden','Feedbackfähigkeit erhöhen','Sicherheit geben, ohne zu verengen'],
  '{"struktur_intuition": 0.65, "autoritaet_beteiligung": 0.90, "leistung_beziehung": 0.65, "stabilisierung_aktivierung": 0.55, "reflexion_direktheit": 0.20, "standardisierung_anpassung": 0.60}'::jsonb),

('development_mentor', 'Der Entwicklungsorientierte Förderer',
  'Potenzial · Lernen · Wachstum',
  'Starker Fokus auf individuelle Entwicklung, Lernen, Fehlerkultur und Potenzialentfaltung.',
  ARRAY['gute Spielerbindung','wachstumsorientiertes Klima','motivierende Begleitung','konstruktiver Umgang mit Fehlern'],
  ARRAY['zu wenig Härte / Konsequenz','zu große Schonung','unklare Leistungsgrenzen','Konfliktvermeidung'],
  ARRAY['Entwicklung und Forderung stärker verbinden','Leistungsstandards klarer machen','Konsequenz erhöhen'],
  '{"struktur_intuition": 0.40, "autoritaet_beteiligung": 0.35, "leistung_beziehung": 0.30, "stabilisierung_aktivierung": 0.45, "reflexion_direktheit": 0.70, "standardisierung_anpassung": 0.30}'::jsonb),

('relational_integrator', 'Der Beziehungsstarke Integrator',
  'Bindung · Nähe · Vertrauen',
  'Stark in Teamgefühl, Bindung, Zugehörigkeit, sozialem Klima.',
  ARRAY['schafft Nähe','Teamzusammenhalt','Vertrauen','gute emotionale Anschlussfähigkeit','erkennt soziale Spannungen früh'],
  ARRAY['zu hohe Harmonieorientierung','Entscheidungen werden weich','Kritik wird zu vorsichtig','Leistungskonflikte werden vertagt'],
  ARRAY['Beziehung und Leistung stärker balancieren','konfliktfähiger werden','klare Ansagen trotz Verbundenheit'],
  '{"struktur_intuition": 0.30, "autoritaet_beteiligung": 0.25, "leistung_beziehung": 0.15, "stabilisierung_aktivierung": 0.55, "reflexion_direktheit": 0.60, "standardisierung_anpassung": 0.25}'::jsonb),

('performance_driver', 'Der Leistungsorientierte Antreiber',
  'Anspruch · Tempo · Ambition',
  'Hoher Anspruch, hohes Tempo, starker Fokus auf Leistung, Entwicklung und Wettbewerbsfähigkeit.',
  ARRAY['Energie','Leistungsdichte','Ambition','hohe Standards','starke Aktivierung'],
  ARRAY['Überdruck','Erschöpfung im Team','zu wenig emotionale Sicherheit','Fehlerangst','kurzfristige statt nachhaltige Wirkung'],
  ARRAY['Druck besser dosieren','Erholungs- und Vertrauensräume stärken','Fehlerkultur verbessern'],
  '{"struktur_intuition": 0.60, "autoritaet_beteiligung": 0.75, "leistung_beziehung": 0.90, "stabilisierung_aktivierung": 0.85, "reflexion_direktheit": 0.30, "standardisierung_anpassung": 0.65}'::jsonb),

('calm_stabilizer', 'Der Ruhige Stabilisator',
  'Gelassenheit · Halt · Verlässlichkeit',
  'Emotional kontrolliert, ruhig, ausgleichend, wenig reaktiv, stabilisierend.',
  ARRAY['Gelassenheit','Stabilität','Verlässlichkeit','geringe Impulsivität','deeskalierend'],
  ARRAY['zu wenig Präsenz','zu wenig Dringlichkeit','emotionale Distanz','fehlende Aktivierung','wird unterschätzt'],
  ARRAY['sichtbarer führen','Präsenz erhöhen','mehr Energie und Richtung geben'],
  '{"struktur_intuition": 0.55, "autoritaet_beteiligung": 0.50, "leistung_beziehung": 0.55, "stabilisierung_aktivierung": 0.15, "reflexion_direktheit": 0.55, "standardisierung_anpassung": 0.55}'::jsonb),

('inspiring_activator', 'Der Inspirierende Aktivator',
  'Energie · Mobilisierung · Momentum',
  'Motiviert stark, reißt mit, emotionalisiert positiv, erzeugt Aufbruch und Energie.',
  ARRAY['hohe Aktivierungsfähigkeit','Begeisterung','emotionale Mobilisierung','Momentum','gute Ansprache vor Spielen / Phasen'],
  ARRAY['zu wenig Struktur','zu schwankend','viel Energie, wenig Konstanz','Wirkung verpufft im Alltag'],
  ARRAY['Inspiration mit Struktur koppeln','Wiederholbarkeit schaffen','weniger spontan, mehr systematisch'],
  '{"struktur_intuition": 0.25, "autoritaet_beteiligung": 0.55, "leistung_beziehung": 0.60, "stabilisierung_aktivierung": 0.90, "reflexion_direktheit": 0.20, "standardisierung_anpassung": 0.20}'::jsonb),

('analytical_diagnostician', 'Der Analytische Diagnostiker',
  'Analyse · Reflexion · Präzision',
  'Beobachtet präzise, analysiert stark, erkennt Muster und Ursachen differenziert.',
  ARRAY['hohe Reflexion','gutes Situationsverständnis','präzise Wahrnehmung','differenzierte Problemerkennung','sinnvolle Korrekturen'],
  ARRAY['Überanalyse','zögerliches Handeln','zu wenig emotionale Wirkung','Distanz','mangelnde Einfachheit in Kommunikation'],
  ARRAY['einfacher kommunizieren','schneller entscheiden','Klarheit vor Perfektion stellen'],
  '{"struktur_intuition": 0.75, "autoritaet_beteiligung": 0.40, "leistung_beziehung": 0.55, "stabilisierung_aktivierung": 0.30, "reflexion_direktheit": 0.90, "standardisierung_anpassung": 0.65}'::jsonb),

('consistent_standard_setter', 'Der Konsequente Standardsetzer',
  'Regeln · Disziplin · Standards',
  'Klare Regeln, hohe Verlässlichkeit, Standards, Disziplin und Struktur.',
  ARRAY['Berechenbarkeit','Ordnung','Gerechtigkeit durch Klarheit','starke Standards','gute Routinen'],
  ARRAY['Starrheit','geringe Flexibilität','Kontextblindheit','zu normativ','wenig individueller Zugang'],
  ARRAY['Standards mit situativer Anpassung verbinden','mehr Differenzierung im Umgang mit Menschen','Flexibilität ohne Beliebigkeit'],
  '{"struktur_intuition": 0.85, "autoritaet_beteiligung": 0.70, "leistung_beziehung": 0.60, "stabilisierung_aktivierung": 0.50, "reflexion_direktheit": 0.40, "standardisierung_anpassung": 0.95}'::jsonb),

('adaptive_shaper', 'Der Adaptive Spielgestalter',
  'Flexibilität · Situation · Passung',
  'Hohe Situationssensibilität, flexibel, reagiert gut auf Dynamik und unterschiedliche Teambedürfnisse.',
  ARRAY['Anpassungsfähigkeit','situative Intelligenz','gute Passung zu wechselnden Situationen','variabler Führungsstil'],
  ARRAY['Unklarheit','wirkt inkonsistent','Team weiß manchmal nicht, woran es ist','zu viel Anpassung, zu wenig Linie'],
  ARRAY['stärkere Kernlinie formulieren','Konsistenz erhöhen','Flexibilität sichtbar begründen'],
  '{"struktur_intuition": 0.25, "autoritaet_beteiligung": 0.40, "leistung_beziehung": 0.50, "stabilisierung_aktivierung": 0.55, "reflexion_direktheit": 0.55, "standardisierung_anpassung": 0.15}'::jsonb),

('mental_conductor', 'Der Mentale Taktgeber',
  'Fokus · Haltung · Mentalität',
  'Stark in Fokus, Haltung, mentaler Stabilität, Präsenz, Vorbereitung und innerer Ausrichtung.',
  ARRAY['mentale Führung','Konzentrationssteuerung','Umgang mit Druck','innere Ordnung','Fokus in Schlüsselmomenten'],
  ARRAY['zu abstrakt','wirkt intellektuell oder distanziert','zu wenig greifbarer Alltagstransfer','soziale Dynamik wird unterschätzt'],
  ARRAY['mentale Stärke stärker in Alltag und Beziehung übersetzen','Klarheit im täglichen Kontakt erhöhen','soziale Feinfühligkeit ergänzen'],
  '{"struktur_intuition": 0.70, "autoritaet_beteiligung": 0.55, "leistung_beziehung": 0.65, "stabilisierung_aktivierung": 0.35, "reflexion_direktheit": 0.75, "standardisierung_anpassung": 0.50}'::jsonb),

('transformative_culture_builder', 'Der Transformative Kulturentwickler',
  'Kultur · Sinn · Identität',
  'Führt nicht nur Leistung, sondern Identität, Haltung, Kultur und Sinn.',
  ARRAY['prägt Kultur','schafft Zugehörigkeit und Sinn','entwickelt Teams über tieferes Selbstverständnis','langfristige Wirkung'],
  ARRAY['zu groß gedacht, zu wenig operationalisiert','Alltagsumsetzung schwach','hohe Vision, geringe Übersetzung','Gefahr von Unschärfe'],
  ARRAY['Kultur in klare Verhaltensstandards übersetzen','Vision in Alltag überführen','mehr operative Präzision'],
  '{"struktur_intuition": 0.45, "autoritaet_beteiligung": 0.45, "leistung_beziehung": 0.35, "stabilisierung_aktivierung": 0.60, "reflexion_direktheit": 0.80, "standardisierung_anpassung": 0.40}'::jsonb);

-- ============================================================
-- Ready — 12 Archetypen seeded.
-- Next migration: Item-Pool (~120 Premium-Fragen)
-- ============================================================
