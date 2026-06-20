# FIX v3_60 — i18n Welle 3b Teil 1: Dashboard + FocusTracker

## Was
Die meistgesehene Seite hinter dem Login — das Dashboard — ist jetzt zweisprachig,
samt interaktivem Aktionsbereich (FocusTracker). Ein englischer Nutzer sieht Profil,
Auswertungen, aktive/abgeschlossene Foki, Pakete und Tools vollständig auf Englisch.

## Umgestellt (2 Dateien)
- app/dashboard/page.tsx (Server, 429 Z): DB→Label-Maps (Status/Niveau/Alter/Sport) jetzt
  über t(); Schlüssel bleiben (DB-Werte), nur Labels lokalisiert. Sprachabhängiges Datum
  (de-AT/en-GB) und Preisformat (de-AT/en-IE). Plurale (Fokus/Foki, Tag/Tage, Saison/Saisons,
  Assessment/Assessments) über Singular/Plural-Keys.
- components/assessment/focus-tracker.tsx (Client, 213 Z): Check-in/Undo/Abschluss, Streak,
  Fortschrittszeile und Erfolgskarte; Zähler-Sätze über {count}-Templates (korrekte
  Wortstellung je Sprache); Fehlermeldungen ebenfalls auf t().

## Wörterbuch
2 neue Sektionen (dashboard, focusTracker), DE/EN strukturgleich. Jetzt 37 Sektionen gesamt.

## Tests
3 Source-Assertions, die auf deutsche UI-Strings im Komponenten-Quelltext prüften, wurden
aufs Wörterbuch umgezogen (deutscher Text wird im de.ts geprüft + Komponente referenziert den
t()-Key) — Test-Intention bleibt erhalten. 355/355.

## Verifikation
- Residual-Deutsch-Scan (dashboard, focus-tracker): sauber (Code-Kommentare bewusst deutsch).
- Gates: tsc OK · claimcheck 65 · vitest 355/355 (34) · eslint OK · next build Exit 0
  · npm audit 0 · PDF 4/4.

## Verbleibend (Welle 3)
3b Teil 2: assessment/[id] + result + übrige assessment-Komponenten (Report-Inhalt
psychometrisch -> geflaggt). 3c Token-Flows. 3d Content-Seiten. Siehe I18N.md.
