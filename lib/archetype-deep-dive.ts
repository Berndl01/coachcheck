/**
 * Statische Deep-Dive-Inhalte pro Archetyp.
 * Geschrieben für Amateur/Semi-Profi Kontext als Standard,
 * mit Hinweisen für Profi-Ebene.
 *
 * Struktur pro Archetyp:
 * - dna:       4-5 Absätze über den Grundtyp
 * - alltag:    5 konkrete Szenen aus dem Amateur-Alltag
 * - spieler:   wer profitiert / wer leidet
 * - kippmuster: Shadow Pattern
 * - reifeweg:  3 Stufen von unreif zu souverän
 */

export type ArchetypeDeepDive = {
  code: string;
  name_de: string;
  kicker: string;
  signatur: string; // Energie-Adjektive
  dna: string[];
  alltag: { szene: string; beschreibung: string }[];
  spieler_profitieren: string[];
  spieler_leiden: string[];
  kippmuster: string;
  reifeweg: { stufe: string; titel: string; text: string }[];
  upsell_hinweis: string;
};

export const ARCHETYPE_DEEP_DIVES: Record<string, ArchetypeDeepDive> = {
  // ============================================================
  strategic_architect: {
    code: 'strategic_architect',
    name_de: 'Der Strategische Architekt',
    kicker: 'Struktur · Planung · Spielidee',
    signatur: 'ordnend · klar · berechenbar',
    dna: [
      'Du denkst in Systemen. Wo andere spontan reagieren, siehst du Muster und baust daraus Abläufe. Dein Training hat eine Struktur, der Spielplan eine Logik, die Standards eine klare Reihenfolge. Das ist kein Zwang zur Kontrolle — das ist dein Weg, Komplexität handhabbar zu machen.',
      'Deine Stärke liegt in der Vorbereitung. Andere Trainer starten das Training und schauen was passiert — du weißt vor der ersten Übung schon, wie die letzte aussehen soll. Spieler merken das. Sie wissen, woran sie bei dir sind. Das schafft Sicherheit.',
      'Im Amateurbereich ist das oft ein echter Unterschied. Viele Trainer improvisieren — du hast einen Plan. Das gibt deiner Mannschaft Orientierung, die sie sonst selten bekommt. Und es macht dich unabhängig von Tagesform. Auch an schlechten Tagen funktioniert dein System.',
      'Die andere Seite: Dein Fokus auf System kann deine Antennen für Menschen verengen. Was fühlt dieser Spieler gerade? Warum wirkt die Kabine heute anders? Das sind Fragen, die du manchmal erst bemerkst, wenn die Stimmung schon gekippt ist.',
    ],
    alltag: [
      { szene: 'Dienstag 19:30 Uhr, Training', beschreibung: 'Deine Trainingsplanung liegt ausgedruckt auf der Bank. Die Übungen sind auf die Minute getaktet. Du weißt genau was kommt. Spieler, die zum Aufwärmen rumalbern, spürst du eher als Störung des Plans denn als Teamverbindung.' },
      { szene: 'Nach knapper Niederlage', beschreibung: 'Du analysierst sofort: Was hat nicht funktioniert in der Abwehr-Formation, wo war die Kommunikation unklar. Was du dabei leicht übersiehst: Ein Spieler hat in der 70. Minute einen entscheidenden Fehler gemacht und trägt die Niederlage emotional allein.' },
      { szene: 'Vor einem wichtigen Spiel', beschreibung: 'Du hast einen präzisen Matchplan. Taktikboard, Videoanalyse, klare Rollen. Das gibt dem Team enormen Rückhalt. Aber manchmal vergisst du zu fragen: Wer ist heute emotional nicht bei 100%? Dein Spielplan setzt voraus, dass alle funktionieren.' },
      { szene: 'Elterngespräch', beschreibung: 'Du argumentierst sachlich, mit Fakten, Einsatzminuten, Trainingsbeteiligung. Das wirkt souverän. Wenn Eltern aber emotional werden — "mein Kind fühlt sich außen vor" — hast du oft nur die Fakten parat, nicht die Antwort auf das Gefühl.' },
      { szene: 'Kabine nach dem Spiel', beschreibung: 'Du gehst die Taktik durch, lobst präzise, korrigierst präzise. Die, die strukturell lernen wollen, finden das super. Die, die emotionale Bestätigung brauchen, fühlen sich manchmal nicht gesehen — obwohl sie gespielt haben.' },
    ],
    spieler_profitieren: [
      'Taktisch denkende Spieler, die Zusammenhänge verstehen wollen',
      'Neue Spieler, die Orientierung brauchen — dein klarer Rahmen gibt ihnen Halt',
      'Ältere erfahrene Spieler, die Verlässlichkeit schätzen',
      'Spieler mit Struktur-Bedürfnis (oft introvertiert, leise Leistungsträger)',
    ],
    spieler_leiden: [
      'Emotionale Spieler, die Resonanz und Nähe brauchen — deine Sachlichkeit wirkt auf sie kühl',
      'Kreative, intuitive Spieler, die sich in deinem System eingeengt fühlen',
      'Spieler in persönlicher Krise — du übersiehst oft die Signale, weil sie nicht im "System-Radar" sind',
      'Spieler, die viel Lob brauchen — du gibst es sparsam und nur für faktische Leistung',
    ],
    kippmuster:
      'Unter Druck verengst du dich in Richtung Kontrolle. Was im Alltag Struktur ist, wird bei steigender Unsicherheit zur Überregulierung. Du willst dann noch mehr planen, noch präziser anweisen, noch genauer steuern. Paradoxerweise verlierst du dabei genau das, was du gewinnen willst: Kontrolle. Denn das Team wird eng, initiativlos und wartet auf deine Ansagen. Das Kippmuster erkennst du daran, dass du nach Rückschlägen den Trainingsplan noch stärker durchtaktest, statt einen Moment Raum zu lassen.',
    reifeweg: [
      { stufe: '01', titel: 'Die kontrollierende Stufe', text: 'Du steuerst alles. Jede Entscheidung geht über dich. Dein System ist präzise, aber starr. Abweichung = Fehler. Spieler werden ausführend. Das funktioniert im Amateurbereich oft erstaunlich lange — besonders wenn du gute Ergebnisse einfährst. Aber es kostet Bindung.' },
      { stufe: '02', titel: 'Die delegierende Stufe', text: 'Du beginnst, Raum zu lassen. Ein erfahrener Spieler führt das Aufwärmen, ein Co-Trainer übernimmt Standards, ein Kapitän bekommt echte Verantwortung. Dein System bleibt — aber es atmet. Du merkst: das Team trägt dich, nicht umgekehrt.' },
      { stufe: '03', titel: 'Die orientierende Stufe', text: 'Du bist nicht mehr der, der alles weiß und alles anweist — du bist der, der Richtung gibt und dann vertraut. Deine Struktur ist kein Käfig mehr, sondern ein Rahmen, in dem andere wachsen. Du kannst Struktur und Beziehung halten, ohne dass eines das andere opfert.' },
    ],
    upsell_hinweis: 'Du siehst deinen Stil jetzt im Überblick. Aber: wie erleben deine Spieler dich wirklich? Im 360° Spiegel kriegst du genau das — anonym, ehrlich, mit Diskrepanz-Analyse.',
  },

  // ============================================================
  authoritative_leader: {
    code: 'authoritative_leader',
    name_de: 'Der Autoritative Lenker',
    kicker: 'Richtung · Präsenz · Entscheidung',
    signatur: 'präsent · richtungsgebend · direkt',
    dna: [
      'Du nimmst Raum ein. In der Kabine, auf dem Trainingsplatz, in der Besprechung — wenn du sprichst, hört das Team zu. Das ist keine Show, das ist dein natürlicher Auftritt. Entscheidungen fallen bei dir schnell und werden klar kommuniziert. Du führst.',
      'Spieler wissen bei dir immer, woran sie sind. Keine endlosen Diskussionen, keine wabernden Erwartungen. Das schätzen besonders Mannschaften, die vorher eine unklare Führung hatten. Nach zwei Wochen unter dir steht das Gefüge.',
      'Im Amateurbereich ist diese Führungsqualität oft der Gamechanger. Gerade wenn du ein Team übernimmst, das sich "irgendwie" organisiert hat, bringst du Richtung rein. Spieler, die Orientierung brauchen — und das sind mehr als man denkt — blühen unter dir auf.',
      'Der Preis: Dein Raum ist groß. Das lässt wenig Platz für andere. Junge Spieler haben Respekt — manchmal zu viel. Feedback bekommst du seltener, als du brauchst, weil niemand gegen dich anreden will. Du kannst in einer Blase landen, ohne es zu merken.',
    ],
    alltag: [
      { szene: 'Montag, Trainingsstart', beschreibung: 'Du kommst, alle richten sich unbewusst auf. Keine Ansage nötig, deine Präsenz reicht. Das Training läuft straff, diszipliniert. Aber: ein Spieler, der eigentlich etwas sagen wollte, sagt es doch nicht. Die Kosten dieser Disziplin siehst du selten direkt.' },
      { szene: 'Spielbesprechung', beschreibung: 'Du stehst vorne, erklärst die Taktik, gibst die Richtung vor. Schnell, klar, präzise. Das Team hört zu. Aber wenn du am Ende fragst "Gibt\'s Fragen?" kommt meist nichts. Nicht weil alles klar ist — sondern weil fragen = nicht aufgepasst haben.' },
      { szene: 'Ein Spieler widerspricht dir', beschreibung: 'Selten, aber wenn, dann ist der Moment entscheidend. Entweder du hörst zu — oder du schlägst zurück. Wenn du zurückschlägst, hast du gewonnen, aber ab dem Moment sagt niemand mehr etwas. Wenn du zuhörst, wächst dein Standing.' },
      { szene: 'Nach Niederlage', beschreibung: 'Du benennst klar, was nicht lief. Keine Ausflüchte, kein Schönreden. Das ist stark. Aber Spieler, die sich schon fertigmachen, brauchen manchmal nicht noch eine klare Ansage — sondern ein "Kopf hoch, war ok". Du gibst das zu selten.' },
      { szene: 'Kapitäns-Gespräch', beschreibung: 'Dein Kapitän vermittelt zwischen dir und der Mannschaft. Er ist dein Puffer. Wenn er gut ist, funktioniert das. Wenn er unter Druck steht oder selbst Probleme hat, fehlt dir plötzlich dein Zugang zum Team — und du merkst es erst, wenn die Stimmung schon gekippt ist.' },
    ],
    spieler_profitieren: [
      'Spieler, die klare Ansagen brauchen (oft jüngere oder unsicherere)',
      'Disziplinierte Typen, die mit klarer Struktur am besten funktionieren',
      'Teams aus Chaos-Phasen, die Orientierung suchen',
      'Spieler, die sich an stärkeren Persönlichkeiten aufrichten',
    ],
    spieler_leiden: [
      'Kreative Eigenköpfe, die Raum für eigene Lösungen brauchen',
      'Sensitive Spieler, die deine direkte Art als verletzend erleben',
      'Ältere, erfahrene Spieler, die sich nicht mehr anweisen lassen wollen',
      'Spieler in persönlichen Krisen — sie trauen sich nicht, dich anzusprechen',
    ],
    kippmuster:
      'Unter Druck wird aus Klarheit Härte. Was im Alltag Richtung ist, wird in der Krise Kommando-Ton. Du hebst die Stimme, wo Ruhe mehr bewegen würde. Du wirst dominant, wo Fragen mehr bewegen würden. Paradoxerweise verlierst du so das, was deine Stärke ist: das freiwillige Mitgehen des Teams. Das Kippmuster erkennst du daran, dass du nach einer schlechten Phase öfter einzelne Spieler öffentlich ansprichst, statt einen 1:1 zu suchen.',
    reifeweg: [
      { stufe: '01', titel: 'Die dominante Stufe', text: 'Du führst über Präsenz und Lautstärke. Fehler werden öffentlich benannt, Anweisungen sind nicht verhandelbar. Das funktioniert im Amateurbereich oft auf kurze Sicht. Der Preis ist ein Team, das dir folgt, aber dir nicht offen gegenüber ist.' },
      { stufe: '02', titel: 'Die autoritative Stufe', text: 'Du führst klar, aber beginnst zuzuhören. Du fragst ältere Spieler vor Entscheidungen. Du trennst zwischen sachlich klar (Aufstellung, Taktik) und persönlich offen (Einzelgespräche). Deine Autorität wird dadurch nicht schwächer, sondern stärker.' },
      { stufe: '03', titel: 'Die orientierende Stufe', text: 'Du bist die Richtung, aber nicht mehr das Zentrum. Das Team trägt Verantwortung, Spieler trauen sich Widerspruch, und du erlebst das nicht als Angriff, sondern als Zeichen von Reife. Deine Präsenz bleibt — aber sie lässt anderen Platz.' },
    ],
    upsell_hinweis: 'Der nächste Schritt für dich: Herausfinden, wo dein Auftritt wirkt und wo er verengt. Das 360° Spiegel zeigt dir die Diskrepanz zwischen deinem Selbstbild und dem, was das Team wirklich erlebt.',
  },

  // ============================================================
  development_mentor: {
    code: 'development_mentor',
    name_de: 'Der Entwicklungsorientierte Förderer',
    kicker: 'Potenzial · Lernen · Wachstum',
    signatur: 'fördernd · geduldig · wachstumsorientiert',
    dna: [
      'Du siehst Spieler, nicht nur Rollen. Wo andere Trainer denken "Der Innenverteidiger hat heute schlecht gespielt", denkst du "Der Julian hat heute einen schlechten Tag, er hat sich seit zwei Wochen verändert, was ist da los?". Du liest Menschen.',
      'Dein Training ist ein Lernraum, nicht nur ein Leistungsbetrieb. Fehler werden bei dir nicht bestraft — sie werden besprochen. Spieler fühlen sich sicher, Neues zu probieren, weil sie wissen: ein Fehler kostet keinen Status. Das ist Gold, besonders im Nachwuchsbereich.',
      'Im Amateurbereich machst du oft den Unterschied für Spieler, die im Profisystem längst aussortiert wären. Du siehst Potenzial in Leuten, die andere abgeschrieben haben. Und du holst es raus — mit Geduld, Fragen statt Antworten, und der Fähigkeit, kleine Fortschritte zu feiern.',
      'Der Schatten: Deine Geduld kann zur Schonung werden. Wenn du lange nicht fordert, weil du schützen willst, nimmst du dem Spieler genau das, was er am meisten braucht — eine klare Ansage über seine Grenze. "Du bist gut — aber bei dem Tempo wirst du nicht reichen." Diesen Satz sprichst du selten aus.',
    ],
    alltag: [
      { szene: 'Individual-Coaching nach dem Training', beschreibung: 'Du bleibst mit einem Spieler auf dem Platz. 10 Minuten Feinarbeit am Schuss, danach 5 Minuten reden. "Wie fühlst du dich gerade im Team?" Andere Trainer packen nach der Einheit zusammen. Dein Team weiß: wenn was ist, ist dein Ohr da.' },
      { szene: 'Nach einem schweren Spieler-Fehler', beschreibung: 'Ein Spieler verschuldet das 0:1. Die anderen Trainer würden auswechseln. Du lässt ihn drin und gehst nach dem Spiel zu ihm. "Was hast du gemerkt? Was nehmen wir mit?" Du machst aus dem Fehler eine Lektion, nicht eine Strafe.' },
      { szene: 'Konflikt zwischen zwei Spielern', beschreibung: 'Du moderierst, hörst beide an, lässt sie reden. Das ist deine Stärke. Aber manchmal dauert es zu lang. Irgendwann braucht das Team auch einfach eine Entscheidung. "So machen wir\'s jetzt." Dieser Satz fällt dir schwer.' },
      { szene: 'Ein Leistungsträger kommt zu spät — wieder', beschreibung: 'Du hast schon zweimal gesprochen. Beim dritten Mal solltest du eigentlich Konsequenzen ziehen. Stattdessen redest du nochmal. Der Spieler nimmt dich nicht ernst — nicht weil du schwach wirkst, sondern weil deine Grenze unsichtbar ist.' },
      { szene: 'Saisonende', beschreibung: 'Du führst mit jedem Spieler ein Einzelgespräch. 30 Minuten, ehrlich, wertschätzend. Kein anderer Amateur-Trainer macht das. Spieler verlassen dein Team Jahre später noch mit dem Gefühl: Der Trainer hat mich gesehen. Das ist nicht klein.' },
    ],
    spieler_profitieren: [
      'Spätentwickler, die noch Zeit brauchen',
      'Spieler mit Selbstvertrauens-Problemen',
      'Talente, die aus strengen Systemen kommen und aufatmen müssen',
      'Junge Spieler, die einen erwachsenen Bezugspunkt brauchen',
    ],
    spieler_leiden: [
      'Leistungsträger, die gefordert werden wollen und deine Geduld als Nicht-Ernstnehmen interpretieren',
      'Spieler, die klare Grenzen brauchen — sie dehnen deinen Rahmen aus',
      'Disziplinierte Typen, die sich an unpünktlichen Mitspielern stören und sich fragen, warum du nichts sagst',
      'Durchsetzungsstarke Spieler, die spüren, dass du Konflikte meidest',
    ],
    kippmuster:
      'Unter Druck wird aus Fürsorge Schonung. Du willst deinen Spielern nicht wehtun — und genau das tut ihnen dann weh. Du wartest zu lange mit der Ansage, lässt Unprofessionalität durchgehen, nimmst einem Spieler die Wahrheit vor, weil du ihn schützen willst. Das Kippmuster erkennst du daran, dass deine Spieler oft von anderen Trainern oder Eltern die harte Wahrheit hören müssen, die eigentlich du hätten sagen sollen.',
    reifeweg: [
      { stufe: '01', titel: 'Die harmonieorientierte Stufe', text: 'Du willst für alle da sein. Konflikte werden vertagt, Kritik weichgespült, Grenzen sind unklar. Das Team mag dich — aber es nimmt dich nicht ganz ernst, wenn\'s eng wird. Spieler testen deine Grenzen, weil sie sie suchen.' },
      { stufe: '02', titel: 'Die grenzsetzende Stufe', text: 'Du lernst, dass echte Fürsorge auch "Nein" heißt. Du ziehst Konsequenzen, ohne die Beziehung zu verlieren. Du gibst die harte Rückmeldung, weil du weißt: genau das braucht der Spieler, um zu wachsen. Deine Wärme wird nicht weniger — sie wird belastbarer.' },
      { stufe: '03', titel: 'Die präzise-fördernde Stufe', text: 'Du bist Mentor und Fordernder gleichzeitig. Du schaffst einen Raum, in dem Spieler sich öffnen können, aber du verlangst auch Klarheit von ihnen. Dein Feedback ist ehrlich, ohne zu verletzen. Du siehst Menschen — und schaust nicht weg, wenn sie sich selbst im Weg stehen.' },
    ],
    upsell_hinweis: 'Dein größter Entwicklungshebel: sauber zwischen Fördern und Fordern zu trennen. Der TeamCheck zeigt dir anonym, ob deine Spieler sich gefördert fühlen — oder ob manche mehr Klarheit bräuchten.',
  },

  // ============================================================
  relational_integrator: {
    code: 'relational_integrator',
    name_de: 'Der Beziehungsstarke Integrator',
    kicker: 'Bindung · Nähe · Vertrauen',
    signatur: 'verbindend · offen · menschlich',
    dna: [
      'Für dich ist die Kabine nicht nur der Ort, wo man sich umzieht — sondern wo das Team entsteht. Du liest Stimmungen, bevor sie Worte werden. Du merkst, wer heute nicht in Form ist, noch bevor der Spieler es selbst weiß. Das ist keine Magie, das ist Aufmerksamkeit.',
      'Deine Spieler vertrauen dir auf eine Art, die man nicht trainiert. Sie kommen zu dir mit Familienproblemen, mit Lebensentscheidungen, mit Dingen, die nichts mit Fußball zu tun haben. Das macht dich mehr als Trainer — es macht dich zur Bezugsperson. In der Jugendarbeit ist das unschätzbar.',
      'Im Amateur- und Nachwuchsbereich hast du einen echten Vorteil. Viele Spieler suchen genau das: einen Erwachsenen, der wirklich zuhört. Eltern schätzen dich, weil du ihre Kinder als Menschen siehst. Die Bindung an den Verein ist bei dir überdurchschnittlich — Spieler bleiben.',
      'Die Kehrseite: Wenn die Beziehung so wichtig ist, wird jede Klarheit zur potenziellen Gefahr. Du weichst schwierige Gespräche aus, weil du Verbindungen nicht beschädigen willst. Du triffst Leistungsentscheidungen manchmal mit Rücksicht auf Gefühle — und verlierst dadurch an Profil als Trainer.',
    ],
    alltag: [
      { szene: 'Kabine vor dem Spiel', beschreibung: 'Du gehst durch, klopfst auf Schultern, hast für jeden einen Satz. Der nervöse Neuzugang kriegt ein "Du bist genau richtig hier", der frustrierte Reservist ein "Ich seh deine Arbeit". Kein anderer Trainer macht das so. Dein Team geht emotional gerüstet raus.' },
      { szene: 'Aufstellung — ein Leistungsträger fliegt raus', beschreibung: 'Du redest mit ihm stundenlang. Erklärst, entschuldigst fast, suchst Verständnis. Der Spieler akzeptiert — mit einem komischen Gefühl. Weil er spürt: dein Mitgefühl ist echt, aber deine Entscheidung weich. Er zweifelt beides an.' },
      { szene: 'Zwei Spieler haben sich verkracht', beschreibung: 'Du moderierst, hörst beide, schaffst Raum. Das ist deine Paradedisziplin. Aber wenn einer von beiden hartnäckig bleibt, brauchst du an einem Punkt die Klarheit: "So geht\'s nicht weiter in dieser Kabine." Diesen Moment schiebst du oft zu lange.' },
      { szene: 'Einzelgespräch nach Saisonende', beschreibung: 'Du führst es mit Herz. Spieler verlassen dein Büro nach einer Stunde mit dem Gefühl, gesehen worden zu sein. Das ist echt selten. Aber wenn du einen Spieler nicht mehr im Kader willst, sagst du es so weich, dass er\'s nicht wirklich versteht — und auf nächstes Jahr hofft.' },
      { szene: 'Ein Spieler kommt wegen einer Lebenskrise', beschreibung: 'Du bist da. Du hörst zu. Du hilfst. Das ist vielleicht das wertvollste, was du tun kannst — und kein anderer Trainer in der Liga würde das so machen. In diesen Momenten bist du ganz in deinem Element.' },
    ],
    spieler_profitieren: [
      'Sensitive Spieler, die Nähe und Vertrauen brauchen',
      'Junge Spieler, die einen erwachsenen Anker suchen',
      'Menschen in schwierigen Lebensphasen',
      'Teams mit unterschwelligen Spannungen, die jemanden brauchen, der die Beziehung hält',
    ],
    spieler_leiden: [
      'Leistungsorientierte Typen, die klare Hierarchien und Ansagen wollen',
      'Disziplinierte Spieler, die sehen dass andere durchrutschen',
      'Spieler, die spüren dass ihnen die ehrliche Rückmeldung fehlt',
      'Starkopf-Typen, die deine Weichheit als Schwäche lesen',
    ],
    kippmuster:
      'Unter Druck wird aus Nähe Harmoniezwang. Du vermeidest den Konflikt, der eigentlich fällig wäre. Du redest lieber nochmal, statt zu entscheiden. Paradoxerweise beschädigst du so genau das, was dir wichtig ist: Vertrauen. Denn Vertrauen braucht Klarheit, nicht nur Wärme. Das Kippmuster erkennst du daran, dass du nach Konflikten oft denkst "zum Glück haben wir das Thema umgangen" — statt es wirklich gelöst zu haben.',
    reifeweg: [
      { stufe: '01', titel: 'Die harmonisierende Stufe', text: 'Du willst die gute Stimmung halten. Konflikte werden vermieden, Kritik weichgespült, alle müssen gemocht werden. Das Team ist zusammen — aber auch weich. In entscheidenden Momenten fehlt die Kante.' },
      { stufe: '02', titel: 'Die beziehungsklare Stufe', text: 'Du begreifst: Klarheit ist nicht das Gegenteil von Nähe — sondern ihre Voraussetzung. Du führst die harten Gespräche, weil dir der Mensch wichtig ist. Deine Spieler lernen: bei dir zählen Worte. Und sie vertrauen dir dadurch noch mehr, nicht weniger.' },
      { stufe: '03', titel: 'Die verbindende Stufe', text: 'Du bist der Trainer, der Menschen hält UND fordert. Du kannst Konflikte austragen, ohne die Beziehung zu verlieren. Du sagst harte Wahrheiten mit Respekt. Dein Team ist nicht nur zusammen — es ist tragfähig. Auch wenn\'s eng wird.' },
    ],
    upsell_hinweis: 'Für dich ist der 360° Spiegel besonders spannend: Du bekommst zu hören, was deine Spieler dir sonst nicht sagen — weil sie die Beziehung schonen. Nur anonym kommt manche Wahrheit raus.',
  },

  // ============================================================
  performance_driver: {
    code: 'performance_driver',
    name_de: 'Der Leistungsorientierte Antreiber',
    kicker: 'Leistung · Intensität · Wille',
    signatur: 'antreibend · intensiv · fordernd',
    dna: [
      'Du bist kompromisslos, wenn\'s um Leistung geht. Intensität im Training ist für dich nicht verhandelbar. Wenn der Puls nicht hochgeht, ist\'s nicht Training, sondern Spazierengehen. Deine Mannschaften sind fit, gewinnen Zweikämpfe, sind in den letzten 15 Minuten noch da. Das ist kein Zufall.',
      'Du hast einen klaren Standard, was "100% geben" bedeutet — und du lässt darunter nichts gelten. Das kann unbequem sein, aber es ist auch fair: jeder weiß, was von ihm erwartet wird. Spieler, die Leistung suchen, finden bei dir ein Zuhause. Deine Forderung ist ihr Wachstum.',
      'Im Amateurbereich, wo viele Trainer mit "so geben wir halt was wir können" durchgehen, hebst du das Niveau. Spieler entdecken Grenzen, die sie sich selbst nicht zugetraut hätten. Das ist ein echtes Geschenk — auch wenn sie es im Moment nicht so sehen.',
      'Die Schattenseite: Wer nicht mitkommt, fällt bei dir schnell durchs Raster. Dein Fokus auf Output kann Menschen übersehen, die unter der Oberfläche kämpfen. Leistung ist messbar — Angst, Unsicherheit, Lebenssituationen sind es nicht. Und genau die bestimmen oft, warum jemand heute nicht liefert.',
    ],
    alltag: [
      { szene: 'Aufwärmen', beschreibung: 'Du willst Tempo. Wenn einer nicht reinkommt, sagst du\'s direkt. "Hey, bist du da?" Manche spüren sich dadurch, andere schämen sich. Du siehst beides nicht — du siehst nur, ob die Intensität stimmt.' },
      { szene: 'Halbzeit bei Rückstand', beschreibung: 'Du wirst laut. "Das ist nicht genug, Leute!" Du spornst an, manche blühen auf. Aber ein Spieler, der heute privat was drückt, versteckt sich jetzt. Du merkst nicht, dass er nicht fehlt an Wollen — sondern an Kraft.' },
      { szene: 'Ein Spieler meldet sich krank', beschreibung: 'Du hakst nach, subtil skeptisch. "Wie ernst ist es?" Das ist legitim — Amateur-Verein, Leute melden sich auch mal leicht ab. Aber dein Ton vermittelt manchmal: Krankheit ist Schwäche. Spieler kommen dann eher krank, als dir zu widersprechen.' },
      { szene: 'Trainingsende', beschreibung: 'Abschluss-Lauf, volle Pulle. "Wer nicht bis zum Ende rennt, gehört nicht hierher." Klare Botschaft. Motiviert die Willensstarken. Demotiviert stille Leistungsträger, die heute einfach müde sind — und jetzt glauben, sie gehören nicht dazu.' },
      { szene: 'Saison-Analyse', beschreibung: 'Du bewertest Leistungskurven, Einsatzminuten, Laufwerte. Das ist professionell. Aber bei einem Spieler, der Elternteil wurde, sagt die Kurve nichts aus. Du siehst den Einbruch — nicht den Menschen dahinter.' },
    ],
    spieler_profitieren: [
      'Ehrgeizige Typen, die ihre Grenze suchen',
      'Fitte Athleten, die im Wettkampf leben',
      'Spieler, die Disziplin durch Außendruck brauchen',
      'Ex-Profis oder Nachwuchs mit hohen Ambitionen',
    ],
    spieler_leiden: [
      'Stille Leistungsträger, die durch deine Härte verunsichert werden',
      'Spieler in persönlichen Krisen, die gerade nicht "100%" geben können',
      'Kreative, die mehr Raum brauchen als den reinen Leistungskorridor',
      'Spätentwickler, die deine Ungeduld zerstört',
    ],
    kippmuster:
      'Unter Druck wird aus Forderung Überforderung. Bei schlechter Phase drehst du die Intensität hoch — noch härteres Training, noch klarere Ansagen, noch weniger Pausen. Paradoxerweise produzierst du genau das Gegenteil: erschöpftere Spieler, mehr Verletzungen, sinkende Leistung. Das Kippmuster erkennst du daran, dass deine Teams oft in der Rückrunde einbrechen — weil du im Herbst zu hart aufgedreht hast.',
    reifeweg: [
      { stufe: '01', titel: 'Die treibende Stufe', text: 'Maximale Intensität, kompromisslose Standards, wenig Geduld mit Zwischentönen. Wer mithält, wird stärker. Wer nicht mithält, fliegt raus. Kurzfristig effektiv, langfristig verbrennst du Substanz.' },
      { stufe: '02', titel: 'Die dosierende Stufe', text: 'Du lernst, dass Leistung nicht linear steigt. Intensität braucht Pausen. Spieler brauchen Regeneration. Forderung ohne Wärme fängt an zu kippen. Du beginnst zu differenzieren: wer braucht Druck, wer braucht Vertrauen.' },
      { stufe: '03', titel: 'Die kraftvolle Stufe', text: 'Du bist immer noch anspruchsvoll — aber nicht mehr pauschal. Du forderst, wo Forderung hilft. Du lässt los, wo Druck schadet. Deine Spieler geben mehr als bei jedem anderen Trainer — aber nicht aus Angst, sondern aus Verbindung.' },
    ],
    upsell_hinweis: 'Du solltest wissen: wie verträgst du wirklich den Druck den du aufbaust? Der TeamCheck zeigt dir anonym, ob dein Leistungsklima inspiriert oder erdrückt. Wichtige Information, bevor es bricht.',
  },

  // ============================================================
  calm_stabilizer: {
    code: 'calm_stabilizer',
    name_de: 'Der Ruhige Stabilisator',
    kicker: 'Ruhe · Konstanz · Gelassenheit',
    signatur: 'beruhigend · konstant · verlässlich',
    dna: [
      'Du bist der Fels in der Brandung. Wenn rund um dich Chaos ist, bleibst du ruhig. Spieler merken das sofort. Nach einem Gegentor verlieren andere Trainer die Nerven — du bleibst bei dir. Das ist extrem wertvoll, besonders für Teams, die schnell nervös werden.',
      'Deine Mannschaften spielen oft überraschend souverän in Drucksituationen. Weil du nicht ausrastest, rasten sie auch nicht aus. Dein Ruhepol überträgt sich auf das Team. In engen Spielen holst du mehr Punkte, als statistisch zu erwarten wäre.',
      'Im Amateurbereich, wo Trainer oft emotional getrieben sind (weil\'s ehrenamtlich ist, weil\'s auch persönlich nah geht), bist du die Ausnahme. Eltern schätzen dich, weil du Kinder nicht aufreißt. Vorstände schätzen dich, weil du nicht mit Kündigung drohst wenn\'s mal schlecht läuft.',
      'Der Schatten: Ruhe kann zur Distanz werden. Wenn wirklich mal Emotion gefragt ist — nach einem Riesen-Sieg, in einer Krise — kann deine Konstanz als Gleichgültigkeit gelesen werden. Spieler fragen sich: "Ist ihm das hier eigentlich wichtig?" Das ist nicht fair dir gegenüber, aber es passiert.',
    ],
    alltag: [
      { szene: 'Kurz vor dem Anpfiff, wichtiges Spiel', beschreibung: 'Alle sind nervös. Du gehst ruhig durch die Kabine, sagst kurze, klare Sätze. Das beruhigt. Aber ein Spieler, der heute besonders aufgeregt ist, bräuchte vielleicht noch eine persönliche Ansprache. Du verlässt dich auf deine allgemeine Ruhe — und das reicht nicht immer.' },
      { szene: 'Gegentor in letzter Minute', beschreibung: 'Spieler schauen zu dir. Du bleibst stehen, nickst kurz, gibst Anweisung. Das ist souverän. Aber die emotionale Entladung, die sie brauchen, gibst du ihnen nicht. Manchmal ist Wut ein Signal, dass dir das Ergebnis wichtig ist. Wenn du keine zeigst, zweifeln sie.' },
      { szene: 'Großer Sieg', beschreibung: 'Die Kabine explodiert. Du freust dich — aber leise. Du klatschst, lächelst, sagst "Gut gemacht". Spieler, die mit dir zusammen feiern wollten, ziehen sich zurück. Sie fragen sich, ob dein "Gut gemacht" wirklich das hier meint oder nur eine Floskel ist.' },
      { szene: 'Konflikt zwischen zwei Spielern', beschreibung: 'Du wartest ab, lässt die Emotionen abkühlen. Das ist klug. Aber wenn du zu lange wartest, verhärtet sich der Konflikt. Irgendwann braucht es die klare Ansage — und die fällt dir schwer, weil sie dich aus deiner Ruhezone reißen würde.' },
      { szene: 'Training nach Niederlage', beschreibung: 'Business as usual. Du arbeitest wie immer. Das ist professionell und es zeigt: eine Niederlage wirft uns nicht aus der Bahn. Aber manchmal bräuchte das Team den Moment des Innehaltens. Dein "weiter geht\'s" kann auch wie "ich will nicht darüber reden" wirken.' },
    ],
    spieler_profitieren: [
      'Nervöse, schnell überforderte Spieler',
      'Teams mit vielen emotionalen Typen, die einen Anker brauchen',
      'Junge Spieler, die in der Leistungsspitze lernen müssen, Druck zu regulieren',
      'Mannschaften nach einer turbulenten Phase (Trainerwechsel, Krise)',
    ],
    spieler_leiden: [
      'Spieler, die Emotion und Energie als Motivation brauchen',
      'Feuerköpfe, die deine Ruhe als Desinteresse lesen',
      'Teams in Aufwärtsphase, die jetzt den Schub, nicht die Bremse brauchen',
      'Spieler in persönlicher Krise — du übersiehst das Unausgesprochene',
    ],
    kippmuster:
      'Unter Druck wird aus Ruhe Distanz. Während andere sich emotionalisieren, baust du eine Wand. Du verarbeitest intern, was draußen zu sehen sein sollte. Paradoxerweise erlebt dein Team dich dann nicht als stabil — sondern als unerreichbar. Das Kippmuster erkennst du daran, dass Spieler in schweren Phasen öfter zu Co-Trainern gehen als zu dir. Nicht weil die mehr wissen — sondern weil sie mehr zeigen.',
    reifeweg: [
      { stufe: '01', titel: 'Die distanzierte Stufe', text: 'Du bist ruhig, weil du bewusst Abstand hältst. Keine Hochs, keine Tiefs. Das wirkt professionell, aber auch steril. Spieler respektieren dich — sie gehen aber nicht wegen dir durch die Wand.' },
      { stufe: '02', titel: 'Die präsente Stufe', text: 'Du bleibst gelassen, aber du bist da. Du zeigst Freude, wenn\'s welche gibt, du zeigst Ärger, wenn\'s welchen gibt. Deine Ruhe ist keine Abwesenheit mehr, sondern gewählte Gelassenheit. Das ist ein großer Unterschied.' },
      { stufe: '03', titel: 'Die verbindende Stufe', text: 'Du bist der Anker, aber kein Eisberg. Spieler spüren: dem Trainer ist wichtig, was hier passiert. Er kocht nicht über, aber er ist auch nicht kalt. Diese Mischung ist selten — und extrem wirkungsvoll, besonders in Drucksituationen.' },
    ],
    upsell_hinweis: 'Du kennst deine Außenwirkung vielleicht nicht ganz. Der 360° Spiegel klärt die Frage: wird deine Ruhe als Stärke oder als Abwesenheit erlebt? Entscheidender Unterschied für deine Führung.',
  },

  // ============================================================
  inspiring_activator: {
    code: 'inspiring_activator',
    name_de: 'Der Inspirierende Aktivator',
    kicker: 'Energie · Motivation · Mitreißen',
    signatur: 'mobilisierend · begeisternd · emotional',
    dna: [
      'Du hast Feuer. Wenn du in die Kabine kommst, bringst du Energie mit. Dein Training hat Musik, deine Ansprachen haben Wucht, deine Freude bei einem Tor ist echt und groß. Spieler gehen mit dir aus der Kabine raus mit einem Puls, der schon 20 Schläge höher ist.',
      'Deine Stärke ist die Mobilisierung. Wenn ein Team in einer Phase festsitzt, kriegst du Bewegung rein. Wenn Motivation fehlt, baust du sie auf. Du bist derjenige, der aus einer durchschnittlichen Ansprache ein Motivationsbeschleuniger macht. Das ist ein Talent — und im Amateurbereich Gold wert, wo viele Spieler nach Feierabend müde sind.',
      'Du siehst Menschen schnell — wer heute brennt, wer heute müde ist. Und du sprichst sie an. Kurz, pointiert, oft mit Humor. Spieler lieben das. Du bist der Trainer, den sie Jahre später noch erzählen.',
      'Die Schattenseite: Energie braucht Zündstoff. Wenn der fehlt — wenn du müde bist, wenn\'s lange schlecht läuft, wenn die Saison lang ist — kippt deine Aktivierung schnell in Druck. Aus Motivation wird Aufputschen. Aus "Komm Jungs!" wird Forcieren. Und Teams, die auf deine Energie angewiesen sind, bauen ein, wenn sie fehlt.',
    ],
    alltag: [
      { szene: 'Aufwärmen', beschreibung: 'Musik an, du bist überall. Witze, Anfeuern, kleine Wettkämpfe. Die Stimmung geht hoch. Spieler, die mit einem ranzigen Kopf angekommen sind, sind nach 15 Minuten präsent. Das ist deine Superpower.' },
      { szene: 'Ansprache vor dem Spiel', beschreibung: 'Du packst eine Geschichte ein, baust Spannung auf, endest mit einem Satz der hängenbleibt. Spieler gehen raus und wollen für dich laufen. Aber manchmal ist der Content dünn — viel Emotion, wenig Taktik. Gegner mit besserem Plan gewinnen.' },
      { szene: 'Halbzeit, 0:2 hinten', beschreibung: 'Du kommst rein wie eine Naturgewalt. "Wir haben noch 45 Minuten! Das ist unser Spiel!" Einige brennen. Aber der Kopf deines Teams ist längst weg — die ruhige Analyse fehlt. Du drehst die Emotion hoch, ohne die Ursachen zu klären.' },
      { szene: 'Ein Spieler ist demotiviert', beschreibung: 'Du redest ihn munter, versuchst zu zünden. Das funktioniert bei den meisten. Aber bei einem, der grad in einer echten Krise ist, landest du nicht. Er braucht kein Feuerwerk, sondern ein ehrliches Gespräch. Das fällt dir schwerer.' },
      { szene: 'Du selbst bist müde', beschreibung: 'Lange Saison, du hast wenig Schlaf, auch privat läuft\'s nicht rund. Du versuchst, die Energie aufzubauen — sie kommt nicht. Das Team merkt\'s sofort. Es ist, als hätte jemand den Stecker gezogen. Dein Team ist auf deinen Zustand angewiesen, ohne dass es ihm bewusst war.' },
    ],
    spieler_profitieren: [
      'Junge Spieler, die noch entzündet werden müssen',
      'Teams in Motivationsphasen (Saisonvorbereitung, nach Krise)',
      'Spieler, die mit Emotion lernen und wachsen',
      'Mannschaften mit viel "leiser" Substanz, die einen Energiegeber brauchen',
    ],
    spieler_leiden: [
      'Ruhige, introvertierte Spieler, die deine Lautstärke als belastend erleben',
      'Analytische Typen, die mehr Struktur und weniger Emotion brauchen',
      'Spieler, die in echten Krisen sind und Ernsthaftigkeit statt Zündung brauchen',
      'Erfahrene Leistungsträger, die Taktik über Pathos stellen',
    ],
    kippmuster:
      'Unter Druck wird aus Aktivierung Aufputschen. Was im Alltag Energie ist, wird in schwerer Phase Forcieren. Du redest dich und das Team in eine Euphorie, die nicht trägt. Paradoxerweise erschöpfst du damit deine Substanz und die deines Teams. Das Kippmuster erkennst du daran, dass deine Mannschaften oft unerklärliche Durchhänger nach emotionalen Hochs haben.',
    reifeweg: [
      { stufe: '01', titel: 'Die feurige Stufe', text: 'Volle Energie, immer. Jedes Training ist ein Event, jede Ansprache eine Show. Spieler lieben dich — aber sie werden auch abhängig von dir. Ohne deinen Einsatz läuft nichts. Du trägst das ganze System.' },
      { stufe: '02', titel: 'Die dosierte Stufe', text: 'Du lernst, Energie gezielt einzusetzen statt permanent zu senden. Ruhige Phasen sind erlaubt. Du merkst: nicht jeder Spieler braucht dauernd Feuer. Einige brauchen auch mal Ruhe. Dein Repertoire erweitert sich.' },
      { stufe: '03', titel: 'Die wirksame Stufe', text: 'Du bist der Zünder, wenn\'s nötig ist — aber nicht mehr der einzige Motor. Das Team hat eigene Energie, du lieferst den Funken. Du bist immer noch der Trainer, den sie Jahre später erzählen — aber aus den richtigen Gründen.' },
    ],
    upsell_hinweis: 'Dein TeamCheck zeigt dir, ob deine Energie das Team hebt — oder ob manche Spieler bei dir auflaufen, die du nicht siehst. Für einen Aktivator wie dich ist das die wichtigste Frage.',
  },

  // ============================================================
  analytical_diagnostician: {
    code: 'analytical_diagnostician',
    name_de: 'Der Analytische Diagnostiker',
    kicker: 'Analyse · Präzision · Erkenntnis',
    signatur: 'reflektiert · nuanciert · tief',
    dna: [
      'Du schaust zweimal hin. Wo andere Trainer nach einem Spiel sagen "war ok, weiter geht\'s", analysierst du — was war die Struktur? Wo war die Schwachstelle? Warum hat der Gegner links durchkommen können? Du arbeitest wissenschaftlich, auch wenn\'s nur die Bezirksliga ist.',
      'Diese Tiefe zahlt sich aus. Du erkennst Muster, bevor sie sich verfestigen. Du siehst, warum dein Team gegen tiefstehende Gegner Schwierigkeiten hat — und hast den Gegenentwurf. Dein Matchplan ist präziser als bei den meisten Kollegen deiner Liga.',
      'Spieler lernen bei dir viel über das Spiel. Du bringst sie zum Denken, nicht nur zum Ausführen. Wer im Amateurbereich wirklich verstehen will, wie Fußball funktioniert, findet bei dir einen Lehrer. Das ist besonders für ambitionierte Nachwuchsspieler Gold.',
      'Der Schatten: Deine Reflexion kann zur Grübelei werden. Du siehst so viele Nuancen, dass du dich in Entscheidungen verzettelst. Was anderen in 3 Sekunden klar ist, kostet dich 20 Minuten Abwägen. In einem Spiel, das Schnelligkeit verlangt, kostet dich das manchmal den entscheidenden Moment.',
    ],
    alltag: [
      { szene: 'Videoanalyse', beschreibung: 'Du hast das Spiel schon dreimal gesehen. Du bereitest 6 Szenen vor, perfekt geschnitten. Spieler sind beeindruckt. Aber manche kommen ins Grübeln statt ins Tun. Zu viel Analyse, zu wenig Action.' },
      { szene: 'Entscheidung in der Pause', beschreibung: 'Umstellen oder nicht? Du wägst ab: Formkurve, Ermüdung, Gegner-Muster. Drei Varianten durchgedacht. Aber der richtige Moment für die Umstellung ist schon vorbei, während du noch denkst. Die Chance war: zack, entscheiden.' },
      { szene: 'Ein Spieler fragt "Warum hab ich gestern nicht gespielt?"', beschreibung: 'Du erklärst ausführlich. Daten, Kontext, taktische Überlegungen. Der Spieler versteht — intellektuell. Aber emotional wollte er nur ein "Du hast dir deinen Platz verdient, heute passte es nicht". Du hast zu viel geantwortet, zu wenig zugehört.' },
      { szene: 'Trainingsplanung', beschreibung: 'Du bereitest detailliert vor. Jede Übung hat einen Zweck, jede Steigerung ist begründet. Das ist professionell. Aber manchmal vergisst du die Spieler-Tagesform. Nach einer stressigen Arbeitswoche brauchen sie Spaß, nicht taktische Feinarbeit.' },
      { szene: 'Spielerische Krise einer Nummer 10', beschreibung: 'Du analysierst: Laufwege, Zweikampfquote, Ballkontakte. Du hast einen konkreten Plan für ihn. Der Spieler aber weint nachts, weil seine Freundin Schluss gemacht hat. Das fehlt dir, weil dein Radar auf Spielanalyse, nicht auf Emotion eingestellt ist.' },
    ],
    spieler_profitieren: [
      'Taktisch denkende Spieler, die das Warum verstehen wollen',
      'Ambitionierte Nachwuchs, die auf höhere Klassen wollen',
      'Intellektuelle Typen, die Zusammenhänge schätzen',
      'Spieler in technischen Entwicklungsphasen',
    ],
    spieler_leiden: [
      'Spieler mit wenig Bock auf Theorie — die wollen einfach kicken',
      'Intuitive Spieler, die ins Denken kommen und das Tun verlieren',
      'Emotionale Spieler, die menschliche Rückmeldung brauchen',
      'Junge Spieler, die mit zuviel Information überfordert sind',
    ],
    kippmuster:
      'Unter Druck wird aus Analyse Lähmung. Wo andere entscheiden, prüfst du noch eine Variante. Wo andere handeln, suchst du Information. Paradoxerweise verpasst du oft den Moment, weil du ihn zu gut verstehen willst. Das Kippmuster erkennst du daran, dass du nach schweren Niederlagen lange bei der Analyse hängen bleibst — statt das Team emotional aufzufangen.',
    reifeweg: [
      { stufe: '01', titel: 'Die grübelnde Stufe', text: 'Du denkst mehr als du entscheidest. Analyse ist Rückzugsort. Spieler respektieren dein Wissen, aber sie warten auf Ansagen, die spät kommen. Du weißt viel — handelst aber zögerlich.' },
      { stufe: '02', titel: 'Die entschlussfähige Stufe', text: 'Du behältst deine Analysefähigkeit, aber kommst zu schnellen Entscheidungen. "Ich kann nicht alles wissen, und ich muss jetzt führen." Dein Denken wird Werkzeug, nicht Zuflucht. Das Team spürt den Unterschied sofort.' },
      { stufe: '03', titel: 'Die souveräne Stufe', text: 'Du bist der Trainer, der tief sieht und klar entscheidet. Deine Analyse ist nicht mehr Grübeln, sondern Präzision. Du liest das Spiel, siehst die Muster, triffst die Entscheidung — alles in einem Zug. Deine Reife ist: Komplexität halten, Handeln nicht verlieren.' },
    ],
    upsell_hinweis: 'Du siehst dein Team analytisch. Aber wie sehen DICH deine Spieler? Der 360° Spiegel gibt dir die Außenperspektive, die du dir selbst schwer geben kannst.',
  },

  // ============================================================
  consistent_standard_setter: {
    code: 'consistent_standard_setter',
    name_de: 'Der Konsequente Standardsetzer',
    kicker: 'Standards · Verlässlichkeit · Disziplin',
    signatur: 'verlässlich · standardfest · diszipliniert',
    dna: [
      'Bei dir gelten Regeln. Pünktlichkeit ist nicht verhandelbar. Was du heute einforderst, forderst du morgen auch. Und in drei Monaten. Deine Spieler wissen: beim Trainer gibt\'s kein "mal so, mal so". Das ist eine Form von Fairness, die viele Amateur-Teams sonst nicht haben.',
      'Deine Mannschaften sind oft nicht die talentiertesten — aber die verlässlichsten. Im entscheidenden Spiel kommen sie, sie sind vorbereitet, sie verlieren den Kopf nicht. Das ist keine magische Motivation — das ist das Ergebnis von wochenlanger Standardarbeit.',
      'Im Amateurbereich, wo Unverlässlichkeit oft das eigentliche Problem ist (Spieler kommt nicht, kein Schiedsrichter, Trikot fehlt), hebst du ein ganzes Niveau. Eltern schätzen dich extrem, weil ihre Kinder lernen, sich zu organisieren. Vereinsvorstände lieben dich, weil bei dir nicht gemeckert wird.',
      'Die Kehrseite: Dein Standard kann zur Starre werden. Nicht jede Regel passt immer. Nicht jeder Spieler bricht die Regel böswillig. Wenn du alles gleich behandelst, übersiehst du Kontext. Und Spieler, die grad privat durch die Hölle gehen, erleben deinen "keine Ausreden"-Ton als respektlos.',
    ],
    alltag: [
      { szene: 'Trainingsbeginn', beschreibung: 'Punkt 19:30 pfeifst du ab. Wer zu spät kommt, läuft eine Extrarunde. Keine Diskussion. Neue Spieler testen das einmal — und dann nie wieder. Das gibt dem Rahmen Halt. Aber der Spieler, dessen Kind krank war, läuft genauso wie der, der verschlafen hat.' },
      { szene: 'Spieler-Ausrüstung nicht da', beschreibung: 'Der Torwart hat seine Handschuhe vergessen. Du leihst ihm keine, sondern schickst ihn ins Feld. "Nächstes Mal denkst du dran." Lehrreich. Aber du merkst nicht, dass er heute durcheinander war, weil sein Vater krank im Spital liegt.' },
      { szene: 'Nach einem Spiel', beschreibung: 'Du analysierst sachlich, benennst was schlecht war — ohne persönliche Angriffe, aber auch ohne Trost. Spieler, die sich selbst schon fertigmachen, bekommen keinen zusätzlichen Halt. "Es war unsere Aufgabe, das Spiel zu gewinnen. Wir haben sie nicht erfüllt." Mehr nicht.' },
      { szene: 'Ein Stammspieler fragt nach Pause', beschreibung: 'Urlaub für zwei Trainings? Du sagst ja — aber mit einem kurzen Satz, der klarmacht: das kostet Einsatzminuten am Wochenende. Regel ist Regel. Der Spieler kommt, aber er merkt: emotional bist du nicht bei ihm, du rechnest.' },
      { szene: 'Saisonende', beschreibung: 'Alles war ordentlich, alles pünktlich, alle Trainings durchgezogen. Aber die Stimmung war die ganze Saison etwas nüchtern. Das Team hat respektiert, aber nicht geliebt. Kein Spieler würde sagen: "Das war ein legendärer Trainer."' },
    ],
    spieler_profitieren: [
      'Disziplinierte, verlässliche Typen die klaren Rahmen suchen',
      'Unorganisierte Spieler, die Strukturen brauchen um überhaupt zu funktionieren',
      'Teams aus chaotischen Phasen',
      'Junge Spieler, die Arbeitsethik lernen müssen',
    ],
    spieler_leiden: [
      'Sensible Spieler in schwierigen Lebenssituationen',
      'Kreative Eigenköpfe, die individuelle Lösungen brauchen',
      'Emotionale Typen, die menschliche Flexibilität suchen',
      'Spieler, die sich nach einem Fehler zusätzlichen Trost wünschen',
    ],
    kippmuster:
      'Unter Druck wird aus Konsistenz Starre. Wo andere differenzieren, ziehst du die Regel durch. Wo Kontext gefragt wäre, machst du keine Ausnahme. Paradoxerweise schwächt das deine Autorität — nicht stärkt sie. Weil Spieler merken: der Trainer sieht nicht mich, er sieht nur die Regel. Das Kippmuster erkennst du daran, dass Spieler in schweren Phasen zu anderen Trainern gehen, um Verständnis zu finden.',
    reifeweg: [
      { stufe: '01', titel: 'Die rigide Stufe', text: 'Du führst durch Regeln. Keine Ausnahmen, keine Differenzierung. Das gibt Klarheit — aber auch Kälte. Dein Team ist diszipliniert, aber nicht emotional gebunden. Die, die bleiben, bleiben aus Prinzip. Die, die gehen, hatten nie das Gefühl, gesehen zu werden.' },
      { stufe: '02', titel: 'Die kontextuelle Stufe', text: 'Du hältst deine Standards — aber du siehst Menschen. Die Regel bleibt die Regel, aber du fragst: was steckt dahinter, wenn jemand sie bricht? Du lernst, den Menschen von der Leistung zu trennen, ohne die Standards aufzugeben.' },
      { stufe: '03', titel: 'Die menschlich-klare Stufe', text: 'Du bist verlässlich und warm. Standards sind nicht mehr Selbstzweck, sondern Rahmen für Wachstum. Du kannst hart sein, ohne kalt zu werden. Spieler erleben dich als fair — und als einen Trainer, der auch in schweren Momenten sieht, was wirklich los ist.' },
    ],
    upsell_hinweis: 'Disziplin und Standard sind deine Sprache. Aber wird das als Halt erlebt — oder als Distanz? Der TeamCheck fragt deine Spieler anonym. Die Antwort kann dich überraschen.',
  },

  // ============================================================
  adaptive_shaper: {
    code: 'adaptive_shaper',
    name_de: 'Der Adaptive Gestalter',
    kicker: 'Flexibilität · Situativ · Anpassung',
    signatur: 'anpassend · situativ · wendig',
    dna: [
      'Du bist nicht festgelegt auf ein System. Wenn\'s nicht läuft, änderst du. Wenn der Gegner schwach ist, spielst du offensiv. Wenn ein Spieler Form hat, baust du um ihn herum. Du verstehst, dass Coaching Kontext ist — nicht Dogma.',
      'Diese Flexibilität ist selten. Viele Trainer ziehen ihr System durch, koste es was es wolle. Du liest die Situation und passt an. Deine Mannschaften haben oft mehr taktische Bandbreite als der Gegner. Das bringt Punkte in engen Spielen.',
      'Im Amateurbereich ist das ein riesiger Vorteil. Du hast nicht immer den perfekten Kader — Spieler fehlen, Talente wechseln, Verletzungen passieren. Wo andere klagen "so kann man kein System spielen", findest du einen neuen Weg. Du improvisierst gut.',
      'Der Schatten: Adaptation kann zur Prinziplosigkeit werden. Spieler wissen manchmal nicht mehr, wo\'s hingeht. "Gestern haben wir mit Dreier-Kette gespielt, heute mit Vierer, morgen wieder Dreier — was ist eigentlich unsere Identität?" Diese Frage stellst du dir zu wenig.',
    ],
    alltag: [
      { szene: 'Kurz vor dem Spiel, Aufstellung', beschreibung: 'Du hast drei Varianten im Kopf. Letzte Entscheidung kurz vor der Kabine, basierend auf Wetter, Gegner-Aufstellung, Tagesform. Das ist clever. Aber ein Spieler, der erst spät erfährt dass er doch nicht beginnt, ist mental nicht vorbereitet.' },
      { szene: 'Halbzeit, es läuft anders als geplant', beschreibung: 'Du stellst um, Dreierkette statt Viererkette. Entscheidest schnell, implementierst klar. Einige Spieler lieben das — sie spüren, dass du reagierst. Andere sind verwirrt, weil sie die neue Rolle nicht richtig verinnerlicht haben. Das Ergebnis schwankt.' },
      { szene: 'Kader-Umbruch im Sommer', beschreibung: 'Statt alte Strukturen zu übernehmen, baust du neu auf Basis der neuen Spieler. Das ist smart. Aber die Alten fragen sich: was war eigentlich falsch an unserem System? Du erklärst wenig, machst einfach. Unbeabsichtigt demontierst du das Gefühl von Kontinuität.' },
      { szene: 'Trainingsplanung', beschreibung: 'Du schaust dir an wer heute da ist, wer fit ist, was das Team braucht — und baust das Training aus dem Moment. Das ist lebendig. Aber über Wochen betrachtet fehlt eine Systematik. Spieler entwickeln keine klare Kompetenz, weil der Fokus immer wechselt.' },
      { szene: 'Ein Spieler fragt: "Was ist unser System?"', beschreibung: 'Du sagst: "Das hängt vom Gegner ab." Der Spieler nickt — aber er hätte eine Identität gebraucht. Etwas, woran er sich festhalten kann. Dein "kommt drauf an" ist ehrlich, aber wenig tragend.' },
    ],
    spieler_profitieren: [
      'Intelligente, lesefähige Spieler, die Wechsel verstehen',
      'Allrounder, die nicht auf einer Position festgelegt sind',
      'Erfahrene Profis, die taktische Bandbreite schätzen',
      'Teams in Übergangsphasen, die Experimentieren brauchen',
    ],
    spieler_leiden: [
      'Strukturbedürftige Spieler, die klare Rollen brauchen',
      'Junge Spieler, die noch Identität durch Routine aufbauen',
      'Eigenköpfe, die ein System mögen und sich dagegen abarbeiten',
      'Teams, die Identität und Kontinuität suchen',
    ],
    kippmuster:
      'Unter Druck wird aus Flexibilität Wankelmut. Was im Alltag Anpassung ist, wird in schwerer Phase Herumprobiererei. Jedes Training ein anderes System, jeder Spieltag eine neue Aufstellung. Paradoxerweise verlierst du das Team, weil es keine Orientierung mehr hat. Das Kippmuster erkennst du daran, dass du in schwierigen Phasen mehr wechselst, nicht weniger — obwohl gerade Stabilität helfen würde.',
    reifeweg: [
      { stufe: '01', titel: 'Die sprunghafte Stufe', text: 'Du experimentierst viel. Alles ist verhandelbar, nichts ist gesetzt. Das Team ist nie ganz sicher wohin es geht. Kurzfristig gibt\'s Erfolge, langfristig bildet sich keine klare Identität. Du bist talentiert, aber ohne Wurzel.' },
      { stufe: '02', titel: 'Die kontextuell-klare Stufe', text: 'Du definierst einen Grundrahmen — eine Identität, die bleibt. Innerhalb davon adaptierst du. Dein Team weiß: wir sind EIN bestimmter Typ Team. Und wir spielen je nach Situation unterschiedliche Varianten davon. Flexibilität hat jetzt einen Rahmen.' },
      { stufe: '03', titel: 'Die gestaltende Stufe', text: 'Du bist der Architekt, der nicht starr baut. Dein System hat DNA, aber auch Atem. Das Team hat Identität UND Bandbreite. Gegner können sich nicht auf dich einstellen, weil deine Variationen aus einer gemeinsamen Wurzel kommen. Das ist hohe Coaching-Kunst.' },
    ],
    upsell_hinweis: 'Für dich als Adapter ist der TeamCheck besonders wertvoll: gibt es Rollenklarheit in deinem Team? Oder verwirrt deine Flexibilität mehr als sie hilft? Anonyme Spieler-Antworten zeigen\'s.',
  },

  // ============================================================
  mental_conductor: {
    code: 'mental_conductor',
    name_de: 'Der Mentale Dirigent',
    kicker: 'Mentale Stärke · Fokus · Wille',
    signatur: 'fokussiert · mental · zielgerichtet',
    dna: [
      'Du weißt, dass Spiele im Kopf entschieden werden. Du arbeitest an der Mentalität deiner Spieler, nicht nur an ihrer Technik. Visualisierung, Fokus-Rituale, mentale Vorbereitung — das sind für dich keine Modewörter, sondern Werkzeuge. Im Amateurbereich ist das selten.',
      'Deine Mannschaften gewinnen oft Spiele, die sie objektiv nicht gewinnen dürften. Weil sie in engen Momenten stabil bleiben. Weil sie sich nicht verrückt machen lassen. Weil sie an sich glauben. Das kommt nicht zufällig — das kommt daher, dass du am Kopf arbeitest.',
      'Du bist nicht der, der emotional explodiert. Du bist der, der vor dem entscheidenden Elfmeter zu deinem Schützen geht und einen Satz sagt, der den Kopf klärt. Deine Spieler vertrauen dir in Drucksituationen, weil sie wissen: du baust Mentalstärke auf, systematisch und über Zeit.',
      'Die Kehrseite: Dein Fokus auf den Kopf kann andere Dimensionen übersehen. Nicht jeder Spieler braucht mentale Arbeit — manche brauchen technische, manche brauchen physische, manche brauchen einfach mal eine Umarmung. Du bist in deinem mentalen Radius stark, aber nicht überall.',
    ],
    alltag: [
      { szene: 'Vor einem Elfmeter-Schießen', beschreibung: 'Du gehst zu jedem Schützen einzeln, sagst einen Satz, der klärt. Ruhig, präzise. Deine Spieler wissen, was sie tun werden, bevor sie zum Punkt gehen. Das ist großes Coaching. Andere Trainer verstecken sich in diesem Moment.' },
      { szene: 'Ein Spieler verschießt Elfmeter', beschreibung: 'Andere Trainer trösten. Du analysierst nüchtern: "Wo war dein Fokus? Was war der Moment, in dem du aus dem Konzept kamst?" Hilfreich — wenn der Spieler bereit ist. Aber im Moment unmittelbar nach dem Fehlschuss braucht er vielleicht erst mal Stille.' },
      { szene: 'Mental-Training als Extraeinheit', beschreibung: 'Du setzt dich mit interessierten Spielern nach dem Training zusammen, arbeitest an Routinen, Atmung, Selbstgespräch. Das ist im Amateurbereich fast einzigartig. Aber für Spieler, die damit nichts anfangen können, wirkt es manchmal eso — du verlierst sie.' },
      { szene: 'Niederlage-Analyse', beschreibung: 'Du fragst: "Wo war euer Fokus in der entscheidenden Phase?" Manche Spieler reflektieren tief und wachsen. Andere finden das zu abstrakt und wollen lieber über das Gegentor sprechen. Du hast Schwierigkeiten, beide gleich gut zu bedienen.' },
      { szene: 'Neuer Spieler kommt rein', beschreibung: 'Du arbeitest mit ihm an Identität, Rolle, mentaler Rolle. Das ist sehr tief — aber manche Spieler wollen einfach nur kicken und sich eingewöhnen. Deine Intensität am Kopf überfordert sie am Anfang.' },
    ],
    spieler_profitieren: [
      'Talentierte Spieler, die mental noch nicht stabil sind',
      'Ambitionierte Typen, die über den Kopf wachsen wollen',
      'Spieler mit Prüfungsangst oder Druckproblemen',
      'Nachwuchsspieler in Leistungsspitze, die mentale Grundlagen lernen müssen',
    ],
    spieler_leiden: [
      'Pragmatische Spieler, denen mentale Arbeit zu abstrakt ist',
      'Spieler, die einfach mal Spaß haben wollen',
      'Introvertierte, die nicht über ihren Kopf reden wollen',
      'Teams in akuten Krisen, wo sofortige Lösungen statt Mentalarbeit gefragt sind',
    ],
    kippmuster:
      'Unter Druck wird aus Mentalarbeit Intellektualisierung. Du redest dich ins Thema, statt es emotional zu packen. Wo Tränen und Umarmung gefragt wären, lieferst du Reflexionsfragen. Paradoxerweise wirkt deine Tiefe dann abgehoben — nicht tragend. Das Kippmuster erkennst du daran, dass Spieler in echten Krisen zu Co-Trainern gehen, die ihnen einfach mal zuhören statt zu analysieren.',
    reifeweg: [
      { stufe: '01', titel: 'Die methodische Stufe', text: 'Du hast deine Tools und ziehst sie durch. Bei jedem Spieler die gleichen Routinen, die gleichen Fragen. Das ist systematisch — aber auch mechanisch. Wer nicht in dein System passt, fällt raus, ohne dass du\'s merkst.' },
      { stufe: '02', titel: 'Die differenzierte Stufe', text: 'Du merkst: nicht jeder braucht dasselbe. Manche Spieler brauchen dein Mental-Toolkit, andere brauchen erst mal nur Präsenz. Du lernst, wann du Werkzeug bist und wann du einfach Mensch bist. Das ist großes Wachstum.' },
      { stufe: '03', titel: 'Die dirigierende Stufe', text: 'Du bist der, der Köpfe führt — nicht nur methodisch, sondern intuitiv. Du weißt, welcher Spieler jetzt welche Intervention braucht. Dein Team hat mentale Stärke, die nicht aus einem Programm kommt, sondern aus echter innerer Arbeit. Du bist Coach und Mentor zugleich.' },
    ],
    upsell_hinweis: 'Du arbeitest am Kopf deiner Spieler. Aber was ist mit deinem eigenen Kopf — wie wirkst du in deinen methodischen Interventionen wirklich auf sie? Das 360° Spiegel zeigt\'s.',
  },

  // ============================================================
  transformative_culture_builder: {
    code: 'transformative_culture_builder',
    name_de: 'Der Transformative Kulturbauer',
    kicker: 'Kultur · Sinn · Transformation',
    signatur: 'bedeutend · kulturstiftend · tiefgreifend',
    dna: [
      'Du willst mehr als Spiele gewinnen. Du willst ein Team bauen, das für etwas steht. Werte, Kultur, eine gemeinsame Sprache — das sind für dich keine weichen Themen, sondern das Fundament. Deine Teams fühlen sich anders an. Man merkt beim Zuschauen: hier geht\'s nicht nur um Punkte.',
      'Du ziehst Menschen an. Spieler kommen zu deinem Verein nicht wegen der Prämie — sondern wegen dem, was du baust. Eltern sagen: "Mein Kind ist unter diesem Trainer nicht nur besserer Fußballer geworden — sondern besserer Mensch." Das ist die Art von Nachwirkung, die selten ist.',
      'Im Amateurbereich, wo viele Trainer nur Trainingsfolgen aneinanderreihen, baust du etwas. Eine Identität, ein Selbstverständnis, eine Art wie man sich kleidet, wie man sich anspricht, wie man nach einer Niederlage auftritt. Das überdauert Saisons. Das überdauert dich.',
      'Die Kehrseite: Kulturarbeit ist langsam. In einem Amateurverein, wo der Kader sich jedes Jahr teilweise verändert, frustrierst du dich manchmal. Spieler verstehen den tieferen Sinn nicht — sie wollen einfach gewinnen und Bier trinken. Dein Anspruch kann für manche zu groß wirken.',
    ],
    alltag: [
      { szene: 'Saisonstart', beschreibung: 'Du machst einen Team-Tag mit Zielklärung, Werte-Workshop, Kultur-Sprech. Manche Spieler brennen, andere denken "was soll das Blabla, kicken wir doch einfach". Du verlierst einen Teil des Teams schon am ersten Tag — ohne\'s zu merken.' },
      { szene: 'Nach einer Niederlage', beschreibung: 'Du sprichst über Werte, über Haltung, über das "Wie wir verlieren". Tief, bedeutungsvoll. Einige Spieler sind gerührt. Andere denken: "Was hat das jetzt mit unserer Dreierkette zu tun?" Deine Ebene ist manchmal zu hoch.' },
      { szene: 'Ein Spieler handelt unwürdig', beschreibung: 'Hat den Schiri beleidigt. Du führst ein langes Gespräch über Respekt, Identität, wer wir sein wollen. Das kann transformativ sein. Für einen Spieler, der einfach emotional war und sich entschuldigen will, ist\'s Overkill.' },
      { szene: 'Saisonende-Rückblick', beschreibung: 'Du hältst eine Rede über das, was das Team geworden ist. Tief, bewegend, manche haben feuchte Augen. Das ist selten im Amateurbereich. Aber die, die nur 5-mal gespielt haben, fühlen sich nicht angesprochen — sie waren nicht wirklich Teil der Kultur.' },
      { szene: 'Sommerpause', beschreibung: 'Du denkst über Kaderplanung anders als andere. Welche Spieler passen zur Kultur, nicht nur zu den Positionen. Das ist klug langfristig. Aber kurzfristig verlierst du manchmal gute Kicker, die einfach kicken wollen, weil du sie als "nicht passend zur Identität" siehst.' },
    ],
    spieler_profitieren: [
      'Tief denkende Spieler, die Sinn in dem suchen was sie tun',
      'Junge Spieler, die nach Orientierung und Werten suchen',
      'Leistungsträger mit langer Verbindung zum Verein',
      'Talente, die mehr wollen als bloß Fußballkarriere',
    ],
    spieler_leiden: [
      'Pragmatiker, die einfach kicken wollen',
      'Durchwandernde Söldner-Typen, die einen Fußballklub als Job sehen',
      'Junge Spieler, die mit Kulturgedanken überfordert sind',
      'Teams in Abstiegsnot, die pragmatische Ergebnisse vor Kultur brauchen',
    ],
    kippmuster:
      'Unter Druck wird aus Sinnstiftung Pathos. Wenn die Ergebnisse nicht stimmen, redest du noch größer von Kultur und Werten. Paradoxerweise verlierst du die Bodenhaftung — und das Team merkt: der Trainer flüchtet in Höhen, während wir im Abstiegskampf sind. Das Kippmuster erkennst du daran, dass deine Kabinenansprachen bei schlechter Phase länger werden, nicht kürzer — als wollten sie fehlende Ergebnisse durch Bedeutung ersetzen.',
    reifeweg: [
      { stufe: '01', titel: 'Die idealistische Stufe', text: 'Du baust eine Kultur, als wärst du in einem Bundesliga-NLZ. Deine Ansprüche sind hoch, deine Sprache bedeutungsvoll. Ein Teil des Teams zieht mit — der Rest fühlt sich nicht angesprochen. Du führst eine Elite, aber keine Mannschaft.' },
      { stufe: '02', titel: 'Die geerdete Stufe', text: 'Du lernst, dass Kultur nicht in großen Worten lebt, sondern in kleinen Handlungen. Wie wir uns im Training begrüßen. Wie wir mit einer Niederlage heimfahren. Kultur wird konkret, nicht mehr abstrakt. Du redest weniger und zeigst mehr. Das Team zieht breiter mit.' },
      { stufe: '03', titel: 'Die transformierende Stufe', text: 'Du bist der Trainer, unter dem Menschen anders werden — auch wenn sie nicht wollten. Nicht durch Predigt, sondern durch gelebte Kultur. Deine Teams werden Jahre später noch als prägend erlebt. Du hast etwas gebaut, das über dich hinauswirkt. Das ist der höchste Level.' },
    ],
    upsell_hinweis: 'Du baust Kultur. Aber erleben deine Spieler das auch so? Oder fühlen sich einige von deiner Vision überfordert? Der TeamCheck zeigt dir die Kulturwirkung aus Spielersicht — anonym, ehrlich.',
  },
};
