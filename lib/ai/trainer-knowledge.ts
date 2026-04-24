/**
 * HUMATRIX TRAINER-WISSENSBASIS
 * ==============================
 *
 * Diese Datei bündelt die wissenschaftlich fundierten Kernannahmen über
 * Trainerführung, Teamdynamik und Entwicklungsarbeit, die in die
 * Report-Generierung und Deep-Dive-Personalisierung einfließen.
 *
 * Theoretische Anker:
 * - Coach-Athlete Relationship (Jowett 3+1Cs: closeness, commitment, complementarity, co-orientation)
 * - Self-Determination Theory im Coaching (Mageau & Vallerand 2003)
 * - Motivational Climate / Empowering vs. Disempowering Coaching (Duda & Appleton)
 * - Psychological Safety (Edmondson)
 * - Transformational Leadership im Coaching (Turnnidge & Côté 2018)
 * - Coaching Efficacy (Feltz)
 * - Positive Youth Development through Sport (Holt)
 *
 * Formulierung für die AI: "theoriegeleitet entwickelt" — NIEMALS
 * "wissenschaftlich validiert", da kein Validierungsprozess vorliegt.
 */

// ============================================================================
// GRUNDAXIOME
// ============================================================================

export const GRUNDAXIOME = `
1. Gute Führung ist Wirkung, nicht nur Absicht. Ein Trainer kann intendiert
   klar sein und wird dennoch als kontrollierend erlebt. Die Differenz zwischen
   Selbstbild und Wirkung ist der wichtigste Entwicklungshebel.

2. Training ist immer auch Beziehungs- und Klimagestaltung. Zwei Trainer mit
   identischer Übung und Trainingszeit erzeugen völlig unterschiedliche
   Wirkungen — der Unterschied liegt selten im Plan, sondern in der
   Führungsqualität der Vermittlung.

3. Leistung und psychologische Sicherheit sind keine Gegensätze, wenn Führung
   reif ist. Die besten Lernmilieus haben nicht weniger Kritik, sondern bessere
   Kritik-Qualität.

4. Harmonie ist kein verlässliches Zeichen für Teamgesundheit. Ein Team kann
   ruhig wirken und gleichzeitig konfliktscheu, fragmentiert oder fragil sein.
   Offenheit und Konfliktfähigkeit sind oft aussagekräftiger als emotionale
   Temperatur.

5. Unter Druck zeigt sich nicht nur Charakter, sondern die Qualität der
   Selbstregulation. Viele Trainer führen im Alltag ordentlich und kippen unter
   Druck in Verengung, Überkontrolle, Aktionismus oder Rückzug.

6. Stilreifung ist wertvoller als Stilwechsel. Ein strukturstarker Trainer muss
   nicht "weicher" werden, sondern seine Klarheit anschlussfähiger machen.
   Entwicklung ist Integration, nicht Austausch.
`;

// ============================================================================
// TYPISCHE BLINDE FLECKEN
// ============================================================================

export const BLINDE_FLECKEN = {
  absicht_vs_wirkung: `
Trainer verwechseln häufig ihre Intention mit der tatsächlichen Wirkung auf
Spieler. "Ich bin klar" wird als Härte erlebt. "Ich will fordern" wird als
Druck und Enge erlebt. "Ich bin ruhig" wird als Distanz erlebt.
Der blinde Fleck besteht nicht in schlechter Absicht, sondern in fehlender
Wirkungstransparenz.
`,
  kontrolle_vs_orientierung: `
Viele Trainer verwechseln Strukturgeben mit Kontrollieren. Orientierung
erweitert den Handlungsraum. Kontrolle verengt ihn. Unter Druck steigt bei
kontrollaffinen Trainern der Kontrollimpuls stärker als ihre Anschlussfähigkeit.
`,
  harmonie_vs_offenheit: `
Ein Team kann diszipliniert wirken und trotzdem konfliktscheu sein. Trainer mit
Harmonieorientierung interpretieren Ruhe als Gesundheit und übersehen, dass
Spieler nur noch funktionieren, nicht mehr ehrlich sprechen.
`,
  gleichbehandlung_vs_fairness: `
Spieler erleben Fairness weniger als Gleichbehandlung, mehr als nachvollziehbare,
konsistente und respektvolle Behandlung. Unterschiede dürfen existieren, müssen
aber begründbar sein. Der blinde Fleck liegt in der Unterschätzung der
subjektiven Fairnesswahrnehmung.
`,
  struktur_vs_anschlussfähigkeit: `
Trainer können inhaltlich recht haben und trotzdem schlecht wirken. Klarheit
ohne Anschlussfähigkeit wird als Kontrolle erlebt. Derselbe Inhalt muss
unterschiedliche Spielertypen erreichen können.
`,
  analyse_vs_handlungsfähigkeit: `
Analytische Trainer neigen dazu, nach Fehlern zu übererklären statt den
nächsten handlungsrelevanten Schritt klar zu machen. Dadurch sinkt die
Handlungsfähigkeit der Spieler unter Druck.
`,
  fehlerkultur_selbstüberschätzung: `
Trainer bewerten fast immer ihre eigene Fehlerkultur als konstruktiv. Das Team
erlebt sie oft anders. Besonders unter Druck zeigt sich, dass zwischen
inhaltlicher Korrektur und emotionaler Nebenwirkung eine große Differenz
bestehen kann.
`,
};

// ============================================================================
// FEHLERKULTUR
// ============================================================================

export const FEHLERKULTUR_PRINZIPIEN = `
Fehlerkultur ist kein weiches Thema, sondern ein zentraler Leistungshebel.
Sie entscheidet mit darüber, ob Spieler mutig lernen oder vorsichtig
funktionieren.

Gute Fehlerkultur leistet vier Dinge gleichzeitig:
- SCHUTZ DER LERNOFFENHEIT: Fehler dürfen nicht als Hinweis erlebt werden, dass
  Zugehörigkeit oder Wert im Team infrage stehen.
- ERHALT DER STANDARDS: Fehler werden klar benannt, nicht verwischt.
- ERHÖHUNG DER HANDLUNGSFÄHIGKEIT: Nach der Korrektur sollte klarer sein, was
  jetzt anders zu tun ist.
- SCHUTZ VON BEZIEHUNG UND WÜRDE: Kritik darf hart in der Sache sein, ohne die
  Person zu entwerten.

Schlechte Fehlerkultur zeigt sich selten an zu vielen oder zu wenigen Standards,
sondern an Nebenwirkungen: Spieler verstecken Unsicherheit, Fehler werden
kaschiert, Risiko sinkt, nur wenige übernehmen Verantwortung, Kritik führt zu
Enge statt Klarheit.

Unter Druck kippt Fehlerkultur bei vielen Trainern in Lautstärke,
Pauschalkritik, Sündenbocklogik oder hektische Korrekturdichte.

Beispiel SCHLECHT: "Das darf dir da nie passieren."
Beispiel BESSER: "In dieser Zone brauchen wir dort eine andere Entscheidung.
Du bist zu früh in den Druck gegangen. Nächster Schlüssel: erst die offene
Linie sichern, dann lösen."

Der Unterschied: Relevanz zeigen, nicht entwerten, Fehler präzisieren,
Handlungsalternative anbieten.
`;

// ============================================================================
// KONFLIKTFÜHRUNG
// ============================================================================

export const KONFLIKTFÜHRUNG = `
Konflikte sind in leistungsorientierten, engen Teams erwartbar und normal.
Problematisch wird nicht der Konflikt selbst, sondern seine Form, Dauer,
Verdrängung oder schlechte Bearbeitung.

Hinter Konflikten liegen meist mehrere Ebenen:
- Sachkonflikte (Taktik, Training, Rollen, Ziele)
- Statuskonflikte (Einsatzzeit, Sichtbarkeit, Einfluss)
- Beziehungskonflikte (Kränkung, Misstrauen, Respekt)
- Gerechtigkeitskonflikte (empfundene Ungleichbehandlung)
- Identitätskonflikte (Selbstbild vs. Rolle im Team)
- Belastungskonflikte (Überforderung, Erschöpfung, privater Druck)

Typische Trainer-Fehler:
- Zu frühes Schließen über Autorität (kurzfristig Ruhe, keine Klärung)
- Zu spätes Ansprechen (Eskalation bereits fortgeschritten)
- Falsche Bühne (Einzelthema im Team oder umgekehrt)
- Personalisierung (Verhalten als Charakterfehler lesen)
- Moralische Überhöhung (Appelle an Teamgeist statt konkreter Bearbeitung)
- Unklare Zielrichtung (Klärung, Grenzsetzung, Rückmeldung oder Entscheidung?)
`;

// ============================================================================
// ERSATZSPIELER & ROLLEN
// ============================================================================

export const ROLLEN_UND_ERSATZSPIELER = `
Rollenunklarheit erzeugt fast immer mehr Frust als eine unangenehme, aber klare
Rolle. Spieler akzeptieren unangenehme Entscheidungen eher, wenn sie
nachvollziehbar, konsistent, fair gerahmt, rechtzeitig kommuniziert und nicht
demütigend sind.

Ersatzspielerführung ist eines der sensibelsten Felder:
- Kränkung + Vergleich + Statusverlust + Zweifel am eigenen Wert treffen
  zusammen. Schlechte Führung hier erzeugt Untergruppen, Zynismus, Distanz zum
  Trainer und emotionale Entkopplung.

Ersatzspieler brauchen vier Dinge:
1. KLARHEIT — Unklarheit ist belastender als unangenehme Wahrheit
2. SICHTBARKEIT — auch ohne Startrolle Wahrnehmung des Beitrags
3. ENTWICKLUNGSPFAD — nicht "warte ab", sondern konkreter nächster Hebel
4. WÜRDE — Nichtberücksichtigung darf nicht als stiller Bedeutungsverlust
   erlebt werden

Beispiel SCHWACHES Rollengespräch: "Im Moment reicht es einfach nicht. Du
musst mehr bringen."

Beispiel REIFES Rollengespräch: "Aktuell sehe ich dich in dieser Phase nicht in
der Startrolle. Der Hauptgrund liegt nicht im Potenzial, sondern in zwei
konkreten Punkten: [A und B]. Ich möchte, dass du genau weißt, woran wir
arbeiten. Gleichzeitig ist mir wichtig: Deine Rolle im Team bleibt relevant."
`;

// ============================================================================
// KRISENFÜHRUNG
// ============================================================================

export const KRISENFÜHRUNG = `
Krisen verschärfen Leistungsthemen UND Wahrnehmung, Sprache, Statusdynamik,
Reaktivität. Coach-Verhalten kann Krisen stabilisieren oder verschärfen.

Typische Trainer-Fehler in Krisen:
- Zu viel Veränderung auf einmal (Orientierung schwächt weiter)
- Mehr Lautstärke statt mehr Klarheit
- Öffentliche Schuldlogik (Sicherheit sinkt weiter)
- Unklare Verantwortung
- Verlust des sozialen Sensors (nur noch Leistung, nicht mehr Zustand)

Reife Krisenführung:
- Priorisierung und Reduktion statt Komplexitätserhöhung
- Sprachliche Beruhigung ohne Verharmlosung
- Schutz zentraler Beziehungen
- Saubere Rollensignale
- Weniger, aber bessere Eingriffe

Drei Leitfragen in Krisen:
1. Was ist gerade das HAUPTPROBLEM? (nicht zehn Symptome, ein Kernmuster)
2. Was braucht das Team JETZT am meisten? (Struktur? Sicherheit? Aktivierung?
   Rollenklärung? Offenheit?)
3. Was muss ich UNBEDINGT VERMEIDEN? (Verengung, diffuse Härte, widersprüchliche
   Signale, falsche Hoffnung, Aktionismus)
`;

// ============================================================================
// KONTEXT: PROFI / AMATEUR / JUGEND
// ============================================================================

export const KONTEXT_UNTERSCHIEDE = {
  profi: `
Im Profikontext besonders relevant: Glaubwürdigkeit, Entscheidungsschärfe,
Druckkompetenz, Klarheit, Differenzierung, Umgang mit Status und Heterogenität,
legitime Autorität. Profis akzeptieren klare Führung, aber nicht automatisch
Kontrolle. Sie erwarten Qualität, Fairness, Kompetenz und Nachvollziehbarkeit.
`,
  amateur: `
Im Amateurbereich die schwierigste Mischlage: hohe Heterogenität, begrenzte
Trainingszeit, externe Belastungen, freiwillige Bindung UND echter sportlicher
Anspruch. Gute Amateurtrainer balancieren mehr als Profitrainer:
Verbindlichkeit ohne Überhärte, Klarheit trotz wenig Zeit, Motivation trotz
Alltagsstress, Zugehörigkeit ohne Beliebigkeit, Leistung ohne falschen
Profianspruch.
`,
  jugend: `
Im Jugendbereich tragen Trainer einen erweiterten Auftrag: nicht nur sportliche
Leistung, sondern Selbstkonzept, soziale Entwicklung, Werte, Life Skills,
Zugehörigkeit. Gute Jugendführung verbindet Sicherheit UND Herausforderung,
entwicklungsförderliche Kritik, pädagogisch tragfähige Rollenkommunikation,
Zugehörigkeit nicht nur an Leistung, Vorbild für Selbstregulation.
`,
};

// ============================================================================
// SAISONPHASEN
// ============================================================================

export const SAISONPHASEN_FOKUS = {
  aufbau_fruehe_saison: 'Orientierung, Rollen, Standards, Zugehörigkeit, Klarheit. Stabilisierung von Abläufen, Verbindlichkeit, Teamnormen.',
  hauptsaison: 'Konstanz halten, Standards schützen, Ermüdung erkennen, Fokus auf Wesentliches.',
  krise_formtief: 'Druckregulation, psychologische Sicherheit, Priorisierung, KEINE Übersteuerung, klare Kommunikation.',
  erfolgsphase: 'Wachheit, Demut, Standards halten, Zugehörigkeit nicht verlieren, nicht von kurzfristiger Euphorie führen lassen.',
  saisonendphase: 'Klarheit, Ermüdungsmanagement, Bedeutung, Rollenkommunikation, Fokus auf Wesentliches.',
};

// ============================================================================
// HOCHWERTIGE FORMULIERUNGEN (anti-billig)
// ============================================================================

export const PREMIUM_SPRACHE = `
Die App arbeitet NICHT in billigen Kategorien:
- NICHT "Du bist zu hart." / "Du bist zu weich."
- NICHT "Du kommunizierst schlecht."
- NICHT allgemeine Coaching-Floskeln.

Sondern in präziser, reifer Sprache:
- "In belasteten Situationen steigt bei dir die Wahrscheinlichkeit, dass
  Klarheit als Härte erlebt wird."
- "Dein Führungsstil wirkt im Alltag tragfähig, verliert aber in
  Konfliktsituationen an Anschlussfähigkeit."
- "Die aktuelle Lage spricht weniger für ein Motivationsdefizit als für eine
  Kombination aus Rollenunsicherheit und sinkender Offenheit."
- "Im Umgang mit nicht berücksichtigten Spielern besteht das Risiko, dass
  Klarheit formal vorhanden ist, aber Bedeutung und Perspektive zu wenig
  sichtbar werden."

Grundregel: NIE "Schwächen" sagen. Stattdessen:
"Entwicklungsrisiken", "Wirkungsgrenzen", "Übersteuerungen", "Kippmuster",
"blinde Zonen".
`;

// ============================================================================
// KOMPAKTE WISSENSSÄTZE (für AI-Inputs)
// ============================================================================

export const KERNSÄTZE = [
  'Gute Führung ist nicht nur Richtung, sondern auch Resonanz.',
  'Ein Team braucht nicht immer mehr Druck, sondern oft bessere Orientierung.',
  'Standards wirken nur dann stabilisierend, wenn sie fair und nachvollziehbar erlebt werden.',
  'Fehlerkultur entscheidet darüber, ob ein Team lernt oder sich absichert.',
  'Harmonie ist kein verlässliches Zeichen für Teamgesundheit.',
  'Klarheit ohne Anschlussfähigkeit wird leicht als Kontrolle erlebt.',
  'Förderung ohne Zumutung bleibt häufig unter ihrem Potenzial.',
  'Ein Trainer beeinflusst nicht nur Leistung, sondern immer auch Zugehörigkeit.',
  'Unter Druck zeigt sich nicht nur Charakter, sondern die Qualität der Führungsregulation.',
  'Gute Teams sprechen nicht deshalb offen, weil es leicht ist, sondern weil der Rahmen es erlaubt.',
  'Konflikte werden gefährlich, wenn sie verdrängt, personalisiert oder unsauber bearbeitet werden.',
  'Rollenunklarheit erzeugt häufig mehr Frust als eine unangenehme, aber klare Rolle.',
  'Ersatzspielerführung ist ein Test für die Fähigkeit des Trainers, Realität und Würde gleichzeitig zu halten.',
  'Gute Krisenführung reduziert Komplexität, statt sie hektisch zu erhöhen.',
  'Ein schwieriges Gespräch ist gut, wenn danach mehr Realität, mehr Würde und mehr Handlungsfähigkeit vorhanden sind.',
  'Führung zeigt sich nicht nur darin, ob Entscheidungen getroffen werden, sondern wie Menschen nach diesen Entscheidungen arbeitsfähig bleiben.',
];

// ============================================================================
// CONTEXT-BUILDER FÜR AI-PROMPTS
// ============================================================================

/**
 * Baut einen kompakten Wissens-Kontext für den AI-Report-Prompt.
 * Wird einmal in jeden Report-Generation-Call eingebaut.
 */
export function buildKnowledgeContext(): string {
  return `
---
WISSENSBASIS (theoriegeleitete Grundlagen):

${GRUNDAXIOME.trim()}

---
FEHLERKULTUR:

${FEHLERKULTUR_PRINZIPIEN.trim()}

---
ROLLEN & ERSATZSPIELER:

${ROLLEN_UND_ERSATZSPIELER.trim()}

---
KRISENFÜHRUNG:

${KRISENFÜHRUNG.trim()}

---
SPRACHLICHE QUALITÄTSGRENZE:

${PREMIUM_SPRACHE.trim()}
---
`.trim();
}

/**
 * Baut einen zielgerichteten Wissens-Kontext für die Deep-Dive-Personalisierung.
 * Kürzer als Report-Kontext, da Deep-Dive auf einen Archetypen fokussiert.
 */
export function buildDeepDiveKnowledgeContext(trainingLevel?: string): string {
  const kontextSection = trainingLevel === 'profi'
    ? KONTEXT_UNTERSCHIEDE.profi
    : trainingLevel?.startsWith('amateur')
    ? KONTEXT_UNTERSCHIEDE.amateur
    : trainingLevel === 'jugend'
    ? KONTEXT_UNTERSCHIEDE.jugend
    : '';

  return `
THEORETISCHER RAHMEN (orientierend, nicht zitieren):

${GRUNDAXIOME.trim()}

BLINDE FLECKEN — typische Muster:
- Absicht vs. Wirkung (intendierte Klarheit wird als Härte erlebt)
- Kontrolle vs. Orientierung (unter Druck kippt Struktur in Kontrolle)
- Harmonie vs. Offenheit (Ruhe wird als Teamgesundheit missgedeutet)

${kontextSection ? `\nKONTEXT:\n${kontextSection.trim()}` : ''}

SPRACHE: reif, präzise, NIEMALS "Schwächen" — stattdessen
"Entwicklungsrisiken", "Wirkungsgrenzen", "Kippmuster".
`.trim();
}
