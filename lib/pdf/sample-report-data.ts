/**
 * Hand-kuratierter Premium-Beispielreport (Tier 2 / Selbsttest).
 *
 * Dient zwei Zwecken:
 *   1. Quelle für das verkaufsfertige Beispiel-PDF
 *      (docs/beispiel-report-fussball.pdf), gerendert über scripts/build-sample-report.mjs.
 *   2. Fixture für tests/report-content-quality.test.ts — der Sample-Text wird
 *      automatisch auf verbotene Floskeln / Platzhalter mitgeprüft.
 *
 * Inhaltlich bewusst claim-sicher: Coaching-Hypothesen statt Diagnosen, keine
 * Erfolgsgarantien, kein klinisches Vokabular. Fiktiver Trainer „Stefan Berger".
 */
import type { ReportOutput } from '@/lib/ai/report-prompt';
import type { AxisScores, MaturityScores } from '@/lib/scoring';

export const SAMPLE_AXIS_SCORES: AxisScores = {
  struktur_intuition: 0.78,
  autoritaet_beteiligung: 0.64,
  leistung_beziehung: 0.69,
  stabilisierung_aktivierung: 0.41,
  reflexion_direktheit: 0.58,
  standardisierung_anpassung: 0.72,
};

export const SAMPLE_MATURITY_SCORES: MaturityScores = {
  selbstregulation: 0.66,
  perspektivflexibilitaet: 0.48,
  konfliktreife: 0.57,
  druckreife: 0.61,
  verantwortungsklarheit: 0.74,
  integrationsfaehigkeit: 0.52,
};

export const SAMPLE_PRIMARY = {
  name_de: 'Der Strukturgeber',
  short_trait: 'Struktur · Klarheit · Verlässlichkeit',
  kernmuster:
    'Du führst über Ordnung und Berechenbarkeit. Deine Mannschaft weiß, woran sie bei dir ist — Klarheit ist dein wichtigstes Werkzeug.',
  staerken: [
    'Gibt der Mannschaft auch in unruhigen Phasen verlässliche Orientierung',
    'Bereitet Trainingswochen durchdacht und nachvollziehbar vor',
    'Trifft Entscheidungen klar und steht für sie ein',
  ],
  risiken: [
    'Kann unter Druck dazu neigen, die Zügel enger zu ziehen statt loszulassen',
    'Struktur wird von einem Teil der Spieler mitunter als Kontrolle erlebt',
    'Lässt wenig Raum für spontane, spielerische Lösungen',
  ],
  entwicklungshebel: [
    'Beteiligung gezielt dosieren, ohne die eigene Klarheit aufzugeben',
    'In Drucksituationen bewusst einen Moment Ruhe vor die nächste Ansage setzen',
    'Unterschiedliche Spielertypen unterschiedlich ansprechen',
  ],
};

export const SAMPLE_SECONDARY = {
  name_de: 'Der Leistungsarchitekt',
  short_trait: 'Anspruch · Fokus · Wettkampf',
};

export const SAMPLE_REPORT: ReportOutput = {
  executive_summary:
    'Stefan, dein Profil trägt eine klare Handschrift: Du führst über Struktur, Klarheit und Verlässlichkeit — und genau das gibt deiner Mannschaft Halt. Die markanteste Spannung liegt zwischen deinem hohen Bedürfnis nach Ordnung und der Beteiligung, die ein Teil deiner Spieler braucht, um wirklich Verantwortung zu übernehmen. Beim Stand von 0:1 zur Halbzeit ist deine Stärke spürbar: Du wirst nicht laut, du wirst präzise. Die Coaching-Frage ist, wo dieselbe Präzision unter Dauerdruck in Enge umschlägt.',
  archetyp_interpretation:
    'Dein Antwortprofil zeigt deutlich die Muster des Strukturgebers: Du baust Führung auf Berechenbarkeit auf. Bei einem Wert von 78 % auf der Achse Struktur–Intuition arbeitest du planvoll, nicht aus dem Bauch heraus — deine Trainingswoche hat einen roten Faden, den deine Spieler kennen. Kombiniert mit einer ausgeprägten Leistungsorientierung (69 %) entsteht ein Trainertyp, der Standards setzt und konsequent einfordert. Das ist eine Coaching-Hypothese für dein eigenes Nachdenken, keine Diagnose: Sie beschreibt, wie dein Stil typischerweise wirkt — und macht sichtbar, wo er trägt und wo er an seine Grenzen kommt.',
  signature_narrative:
    'Liest man deine sechs Achsen als ein Bild, ergibt sich die Signatur eines ruhigen Ordnungsgebers mit hohem Anspruch. Struktur und Standardisierung tragen dein Führungsverhalten, deine Klarheit ist das Geländer, an dem sich die Mannschaft festhält. Auf der Achse Stabilisierung–Aktivierung liegst du eher im stabilisierenden Bereich (41 %) — du beruhigst Systeme, statt sie aufzuladen. Das passt zu deinem Muster: Du gibst Sicherheit. Die Reflexionsachse (58 %) zeigt, dass du Entscheidungen durchdenkst, bevor du sie aussprichst. Im Trainingsalltag, am Spieltag und unter Druck wirkt diese Signatur jeweils etwas anders — und genau diese Unterschiede sind dein Entwicklungshebel.',
  druckprofil:
    'Unter Druck verstärkt sich bei deinem Profil die Ordnung. Wo andere lauter werden, wirst du kontrollierter — du greifst zur Struktur als Sicherheitsanker. Das ist in vielen Momenten ein Vorteil: Wenn ein Stammspieler nach einem Fehler den Kopf hängen lässt, hilft deine ruhige Klarheit. Die Risikozone liegt dort, wo Unsicherheit länger anhält. Dann kann aus Klarheit Enge werden: mehr Vorgaben, weniger Spielraum, ein Team, das auf Ansagen wartet, statt selbst Lösungen zu suchen. Der Hebel ist, in genau diesen Phasen bewusst eine Sekunde Ruhe vor die nächste Anweisung zu setzen — und zu prüfen, ob das Team gerade Führung oder Vertrauen braucht.',
  modul_interpretationen: {
    A: 'Deine Führungsidentität ist klar konturiert: Du weißt, wofür du stehst, und das spürt die Mannschaft. Diese Stabilität ist ein echtes Pfund. Achte darauf, dass aus einem klaren Selbstbild keine Unbeweglichkeit wird — die stärksten Trainer halten ihre Identität und bleiben trotzdem lernoffen für Rückmeldungen aus dem Team.',
    B: 'In der Kommunikation überzeugst du durch Verständlichkeit und Verlässlichkeit. Deine Ansagen sitzen. Im Einzelgespräch erreichst du oft mehr Tiefe als vor der ganzen Gruppe. Der Entwicklungsraum liegt in der Bandbreite: Nicht jeder Spieler braucht dieselbe Tonlage — die Kunst ist, dieselbe Botschaft für unterschiedliche Typen unterschiedlich zu rahmen.',
    C: 'Entscheidungen triffst du klar und stehst dafür ein — eine deiner größten Stärken. Verantwortung ist bei dir sauber verortet. Die Spieler wissen, dass am Ende du entscheidest. Prüfe gelegentlich, an welchen Stellen geteilte Verantwortung das Team reifen ließe, ohne dass du deine Linie verlierst.',
    D: 'Deine Fehlerkultur ist sachlich und lösungsorientiert. Du analysierst statt zu beschuldigen. Damit Fehler zu echtem Lernen werden, lohnt es sich, neben der Analyse auch sichtbar zu machen, dass ein Fehler okay war — gerade jüngere Spieler trauen sich dann mehr zu.',
    E: 'Unter Druck bleibst du bei dir und verlierst selten die Fassung — das ist im Profibereich Gold wert. Deine Mannschaft liest deine Ruhe als Sicherheit. Die Wachstumskante: Ruhe nicht mit Rückzug zu verwechseln. In der Schlussphase eines engen Spiels braucht das Team manchmal nicht nur deine Gelassenheit, sondern auch deine spürbare Energie.',
    F: 'Du motivierst über Anspruch und Verlässlichkeit, weniger über emotionale Aufladung. Das wirkt nachhaltig und unaufgeregt. Für Spieler, die über Begeisterung zünden, kann es hilfreich sein, deinen Anspruch hin und wieder sichtbar mit Anerkennung zu verbinden — Lob, das konkret ist, wirkt bei deinem Stil besonders glaubwürdig.',
    G: 'Beziehung baust du über Verlässlichkeit auf, nicht über Nähe um jeden Preis — die Mannschaft kann sich auf dich verlassen. Das schafft Vertrauen mit Substanz. Der nächste Schritt liegt darin, gezielt einzelne Beziehungen zu vertiefen, gerade zu Spielern, die du strukturell schwerer erreichst.',
  },
  hauptrisiken:
    'Drei Wirkungsgrenzen sind in deinem Profil angelegt. Erstens die Übersteuerung unter Druck: Wenn Unsicherheit steigt, kann deine Struktur in Kontrolle kippen und Eigeninitiative im Team dämpfen. Zweitens die Anschlussfähigkeit: Ein Teil der Spieler erlebt deine Klarheit als Orientierung, ein anderer als Distanz — derselbe Stil, zwei Wirkungen. Drittens die Aktivierung: In Phasen, in denen das Team Energie und Aufbruch braucht, ist dein stabilisierender Zug eher bremsend. Keine dieser Grenzen ist ein Defizit — entscheidend ist, dass du die Bedingungen kennst, unter denen sie auftreten.',
  entwicklungspfad:
    'Der größte Hebel liegt nicht in „mehr Struktur", sondern in dosierter Öffnung. Du musst deine Klarheit nicht aufgeben — du kannst sie gezielter einsetzen. Konkret: Wähle bewusst Situationen, in denen du Verantwortung ans Team abgibst, etwa eine von der Mannschaft selbst moderierte Videoanalyse pro Woche. Beobachte, was passiert, wenn du einen Schritt zurücktrittst. Beginne mit einer konkreten Szene der letzten Wochen, in der deine Wirkung nicht so war, wie du sie dir gewünscht hast, und leite daraus einen kleinen, beobachtbaren Schritt ab.',
  gespraechsleitfaden: [
    'In welchen Situationen erlebst du deine Klarheit als Stärke — und wann beginnt sie, dich oder das Team einzuengen?',
    'Welche Spieler erreichst du mit deinem Stil gut, welche weniger gut — und woran machst du das fest?',
    'Wo könntest du Verantwortung abgeben, ohne deine Linie zu verlieren?',
    'Was bräuchte dein Team in der Schlussphase eines engen Spiels von dir — Ruhe oder Energie?',
    'Wann hast du zuletzt einen Fehler im Team sichtbar als okay markiert, statt ihn nur zu analysieren?',
  ],
  naechste_30_tage: [
    'Eine konkrete Situation der letzten Wochen notieren, in der deine Klarheit klar positiv gewirkt hat.',
    'Eine Trainingseinheit pro Woche teilweise vom Team moderieren lassen und beobachten, was entsteht.',
    'In der nächsten engen Schlussphase bewusst zwischen Ruhe und spürbarer Energie wählen.',
    'Ein Einzelgespräch mit einem Spieler führen, den du strukturell schwerer erreichst.',
  ],
  entwicklungsprogramm: {
    kernfokus:
      'Zwei Felder haben für dich den größten Hebel. Erstens die dosierte Beteiligung: Deine Klarheit ist gesetzt — der Wachstumsraum liegt darin, an ausgewählten Stellen Verantwortung abzugeben, damit dein Team reift, ohne dass du deine Linie verlierst. Zweitens die situative Aktivierung: In Phasen, die Aufbruch brauchen, lohnt es sich, deinen stabilisierenden Grundzug bewusst um einen aktivierenden Impuls zu ergänzen. Beide Felder zielen nicht darauf, dich zu verändern, sondern dein vorhandenes Repertoire breiter und situativer einzusetzen.',
    vierzehn_tage: [
      'Vor jeder Ansage in einer Drucksituation bewusst einen Atemzug Pause setzen und prüfen, ob das Team gerade Führung oder Vertrauen braucht.',
      'Eine konkrete Trainingsentscheidung pro Woche gemeinsam mit zwei Führungsspielern abstimmen.',
    ],
    dreissig_tage: [
      'Eine wiederkehrende, vom Team selbst moderierte Kurz-Analyse etablieren (10 Minuten nach dem Spiel).',
      'Anerkennung gezielt und konkret aussprechen — mindestens ein benanntes Lob pro Trainingstag.',
    ],
    neunzig_tage: [
      'Mit dem Trainerteam ein einfaches Bild davon entwickeln, welche Spielertypen ihr wie ansprecht, und es regelmäßig nachschärfen.',
    ],
    wissenschaftlicher_hinweis:
      'Diese Bausteine sind theoriegeleitete Coaching-Hypothesen auf Basis evidenzbasierter Methodik der Führungs- und Sportpsychologie — keine Diagnose und keine Erfolgszusage, sondern Anregungen für deine Praxis.',
  },
  coach_signature_portrait:
    'Dieses Profil vereint hohe Struktur, klare Führungsintention und einen ausgeprägten Anspruch an Verlässlichkeit. Stefan führt nicht über Lautstärke, sondern über Ordnung: Die Mannschaft weiß, woran sie ist, und das schafft eine ruhige Form von Autorität. Die Stärke liegt in Orientierung, Berechenbarkeit und Standardsicherheit — gerade in unruhigen Phasen wird dieser Trainer zum Fixpunkt. Kritisch wird das Profil dort, wo Unsicherheit länger anhält und Struktur zunehmend als Kontrolle erlebt wird. Dann besteht die Gefahr, dass das Team in eine abwartende Haltung rutscht und auf Ansagen wartet, statt selbst zu gestalten. Die eigentliche Entwicklungsaufgabe ist deshalb kein Mehr an Führung, sondern ein situativeres Dosieren: zu wissen, wann Klarheit trägt und wann Beteiligung mehr Wirkung entfaltet. Wer diese Balance findet, verbindet die Verlässlichkeit des Strukturgebers mit der Lebendigkeit eines Teams, das Verantwortung übernimmt.',
  paradoxien: [
    'Hohe Klarheit, aber an manchen Stellen begrenzte Anschlussfähigkeit',
    'Starke Verlässlichkeit, aber wenig Raum für spontane Lösungen',
    'Ruhe unter Druck, die gelegentlich als Distanz statt als Sicherheit ankommt',
  ],
  shadow_pattern:
    'Das Schattenmuster dieses Profils liegt nicht in mangelnder Führung, sondern in der Tendenz zur Verengung unter steigender Unsicherheit. Was im Alltag als Struktur trägt, kann unter Dauerdruck als erhöhte Kontrolle erlebt werden: mehr Vorgaben, engere Führung, weniger Eigeninitiative. Das Team reagiert dann oft mit Abwarten — was die Unsicherheit des Trainers bestätigt und die Kontrolle weiter verstärkt. Den Kreislauf durchbricht bewusste, dosierte Beteiligung genau in den Momenten, in denen der Reflex zur Verengung am stärksten ist.',
  wirkung_je_kontext: {
    trainingsalltag:
      'In der Routine wirkt dieser Trainer als verlässlicher Taktgeber. Die Spieler schätzen die klare Struktur und wissen, was sie erwartet — das schafft Konzentration und Ruhe in der Wochenarbeit.',
    spieltag:
      'Am Spieltag überträgt sich die Ruhe als Sicherheit. Klare Matchpläne geben Orientierung. Der Wachstumsraum: in entscheidenden Momenten auch spürbar Energie freizusetzen, nicht nur Ordnung zu halten.',
    niederlage:
      'Nach einer Niederlage analysiert dieser Trainer sachlich statt emotional — das verhindert Schuldzuweisungen. Wichtig ist, neben der Analyse auch den emotionalen Moment der Mannschaft aufzufangen.',
    konflikt:
      'In Konflikten bleibt er fair und faktenorientiert. Er sucht die saubere Lösung. Bei aufgeladenen Spannungen hilft es, früher das persönliche Gespräch zu suchen, bevor sich Positionen verhärten.',
    krise:
      'In akuten Krisenphasen ist die Stabilität dieses Trainers ein Anker. Die Gefahr liegt darin, zu lange auf Kontrolle zu setzen, wo das Team einen aktivierenden, neuen Impuls bräuchte.',
  },
  fuehrungsreife_interpretation:
    'Reife ist nicht dein Stil, sondern wie souverän du mit den Anforderungen deines Stils umgehst — und hier zeigt dein Profil ein erfreuliches Bild. Besonders gefestigt bist du in der Verantwortungsklarheit (74 %): Du weißt, wofür du stehst, und triffst Entscheidungen ohne Schlingern. Auch deine Selbstregulation (66 %) und Druckreife (61 %) tragen dich verlässlich durch enge Phasen. Den größten Entwicklungsraum zeigt die Perspektivflexibilität (48 %): die Fähigkeit, bewusst die Sicht deiner Spieler einzunehmen und deinen Stil daran anzupassen. Genau dort liegt der Hebel, um deine ohnehin starke Führung anschlussfähiger zu machen — Reife heißt hier nicht, weicher zu werden, sondern beweglicher.',
  no_go_warnungen: [
    'Nicht noch mehr Kontrolle erhöhen, wenn die Unsicherheit im Team steigt — das verstärkt die Abwartehaltung.',
    'Keine pauschale Kritik im Kollektiv aussprechen; was sachlich gemeint ist, wirkt vor der Gruppe schnell hart.',
    'Ruhe in der Schlussphase nicht mit Rückzug verwechseln — bleib für das Team sichtbar präsent.',
    'Nicht jeden Spieler mit derselben Tonlage ansprechen, nur weil sie bei den meisten funktioniert.',
  ],
  spielerbedarf:
    'Spieler brauchen von diesem Stil vor allem zwei Dinge, damit er voll anschlussfähig wird. Erstens spürbare Anerkennung: Weil Lob bei einem so klaren, anspruchsvollen Trainer als besonders glaubwürdig erlebt wird, wirkt konkretes, benanntes Lob stark — es muss nur sichtbar gemacht werden. Zweitens dosierte Mitgestaltung: Gerade reifere und ehrgeizige Spieler wollen Verantwortung übernehmen. Wenn dieser Trainer ihnen klar umrissene Räume dafür öffnet, ohne die Gesamtlinie aufzugeben, verwandelt sich die anfängliche Abwartehaltung in echte Eigeninitiative — und die Struktur des Trainers wird vom Korsett zum Fundament.',
  beratungswuerdigkeit: 'mittel',
  fuehrungsenergie: 'ordnend und stabilisierend',
  saisonphase_interpretation:
    'In der aktuellen Saisonphase wirkt dieser Stil grundsätzlich günstig: Struktur und Verlässlichkeit geben einer Mannschaft, die Ergebnisse liefern muss, einen klaren Rahmen. Der Vorteil ist Orientierung und Konstanz. Das Risiko liegt darin, dass eine zu enge Führung den nötigen Mut zu spielerischen Lösungen bremst, wenn ein Spiel von einem mutigen Impuls statt von Disziplin entschieden wird. Die Phase belohnt es, die vorhandene Ordnung zu halten und sie punktuell um aktivierende Akzente zu ergänzen.',
  coach_to_team_fit:
    'Zu einem gemischt erfahrenen Team passt dieser Stil über weite Strecken gut: Die Erfahreneren schätzen Klarheit und sauber verortete Verantwortung, die Jüngeren profitieren von der verlässlichen Struktur und den klaren Standards. Reibung entsteht dort, wo eigenständige, kreative Spielertypen mehr Gestaltungsraum suchen, als die Struktur zunächst hergibt. Funktionieren wird die Passung dann, wenn der Trainer diesen Typen gezielt umrissene Freiräume eröffnet — die Struktur bleibt Fundament, wird aber nicht zur Decke.',
};

export const SAMPLE_META = {
  traineeName: 'Stefan Berger',
  sport: 'Fußball',
  productName: 'Selbsttest',
  productTier: 2,
};
