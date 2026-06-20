# FIX v3_58 — i18n Welle 2: Landing vollständig zweisprachig

## Was
Alle 17 Landing-Komponenten von hartkodiertem Deutsch auf das i18n-Wörterbuch umgestellt.
Der DE/EN-Umschalter macht jetzt die **komplette Startseite** englisch — nicht nur Nav+Hero.

## Umgestellte Komponenten (zusätzlich zu Nav+Hero aus v3_57)
stats-strip, ticker, problem, products, archetypes, mini-check (Client), architecture,
science-foundation, how-it-works, sample-report, voices, quote-break, trust-band,
faq (Client), final-cta, footer.

## Wörterbuch
19 Sektionen, DE/EN strukturgleich (per Dictionary-Typ erzwungen). Server-Komponenten via
`getT()`, Client-Komponenten (mini-check, faq) via `useT()`.

## Bewusste Festlegungen
- Produktnamen + 12 Archetyp-Namen bleiben Deutsch (kanonisch / psychometrischer Inhalt).
- Akademische Zitate bleiben; nur Beschreibungen übersetzt.
- Rechtsseiten-Labels übersetzt, Seiten bleiben Deutsch (Anwalt).
- FAQ-Markenkorrektur "Mindset Check" -> "CoachCheck".

## Verifikation
- Kein durchgerutschtes Deutsch in en.ts (heuristischer Scan, ausgenommen Namenszeilen).
- 19 Sektionen DE = EN.
- Gates: tsc OK · claimcheck 65 · vitest 355/355 (34) · eslint OK · next build Exit 0
  · npm audit 0 · PDF 4/4.

## Offen (nächste Wellen)
App-Seiten, E-Mail-Templates, Test-Assertions. Recht + Psychometrik = gekennzeichnete
Spuren (Anwalt / Fachübersetzung). Siehe I18N.md.
