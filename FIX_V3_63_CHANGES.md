# FIX v3_63 — i18n Welle 3c: Token-Flows (externe Bewerter/Teilnehmer)

## Was
Die vier Token-Strecken, über die externe Personen (360°-Bewerter, Spieler, Pulse-Teilnehmer)
ohne Login antworten, schalten jetzt DE/EN — das App-Chrome. Instrument + Report bleiben Deutsch.

## Übersetzt (App-Chrome)
- **Seiten-Zustände (4 Server-Seiten):** einschaetzung/teamcheck/pulse/karte — nicht-gefunden,
  abgemeldet, bereits-abgeschlossen, abgelaufen, Saison-pausiert, kein-offener-Pulse, ungültig.
- **Runner-Chrome (3 Client-Runner):** Intro-Screens (mit {name}/{sport}/{club}-Templates),
  Finished-/Done-Screens, Header, Navigation, Submit, Fehlermeldungen. Gemeinsame Navigations-
  Strings (Zurück/Weiter/Abschließen/Speichert/keine Items) aus `assessmentRunner` wiederverwendet.
- **karte:** nur not-found-Zustand, „Eigenes Profil erstellen"-CTA und Metadata-Titel.

## Bewusst Deutsch belassen (Instrument-/Report-Grenze, geflaggt)
- **Instrument:** `ItemRenderer` (einschaetzung/teamcheck) unverändert deutsch. Die deutsch-
  spezifische `rephraseForFremdbild`-Heuristik (Regex auf ich/mir/mich/mein → Trainer-Perspektive)
  bleibt Deutsch — sie operiert auf dem deutschen Item-Text. Im Pulse-Runner bleibt der Frage-Block
  deutsch: Zähler „Frage X/Y", `text_de`, Antwort-Anker „Trifft voll/nicht zu".
- **Report:** `karte` rendert die Profilkarte aus `lib/insight` (buildOperatingManual /
  buildPlayerTypeMatrix). Karte + Labels („So erreichst du mich", „Derselbe Stil, vier Wirkungen",
  „Coaching-Hypothese, keine Diagnose" …) bleiben Deutsch = Report-Inhalt, wie auf der result-Seite.

## Wörterbuch
7 neue Sektionen (einschaetzungPage, einschaetzungRunner, teamcheckPage, teamcheckRunner,
pulsePage, pulseRunner, cardPage), DE/EN strukturgleich. Jetzt 55 Sektionen gesamt.

## Tests
1 Claim-Disziplin-Assertion (hardening-v3-43, „pulse runner verspricht keinen automatischen Link")
aufs Wörterbuch umgezogen: der ehrliche Wortlaut „denselben Link" wird jetzt in de.ts geprüft, und
weder Wörterbuch noch Runner versprechen einen Auto-Link. Intent erhalten.

## Verifikation
- Instrument/Report-Anteile nachweislich weiter Deutsch (Pulse-Frage-Block + Anker, rephrase-
  Heuristik, karte-Labels); Chrome-Strings ersetzt; Runner/Seiten ohne Residual-Chrome-Deutsch.
- Gates: tsc OK · claimcheck 65 · vitest 355/355 (34) · eslint OK · next build Exit 0
  · npm audit 0 · PDF 4/4.

## Verbleibend (Welle 3)
3d Content-Seiten: `saison` (+ `[id]` — inkl. „Zugriff gesperrt"), `kontakt`, `musterbericht`,
`archetyp/[slug]`. Danach Welle 3 abgeschlossen. Siehe I18N.md.
