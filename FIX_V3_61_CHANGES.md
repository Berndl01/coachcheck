# FIX v3_61 — i18n Welle 3b-2a: Assessment-Durchführung (Chrome)

## Was
Der Durchführungs-Flow des Assessments ist zweisprachig — das App-Chrome rund um den
Fragebogen. Die scharfe Grenze: das validierte deutsche **Instrument bleibt Deutsch**.

## Umgestellt (3 Dateien, App-Chrome)
- app/assessment/[id]/page.tsx (Server): Seiten-Zustände — Assessment nicht gefunden,
  „Bestätigung wird zugestellt"-Wartescreen, keine-Items-Fehler.
- components/assessment/runner.tsx (Client): Navigation (Zurück/Weiter/Abschließen),
  Fortschritt, Auswerten/Speichern-States, alle Fehlermeldungen (inkl. „X von Y Antworten
  fehlen"-Template).
- components/assessment/assessment-intro.tsx (Client): Onboarding-Screen (Dauer, Ablauf,
  „Das erwartet dich", Tipp, Start/Fortsetzen).

## Bewusst Deutsch belassen (Instrument-Grenze, geflaggt)
- **item-renderer.tsx bleibt vollständig Deutsch.** Item-Text (`text_de` aus DB), Antwort-Anker
  („Trifft nicht zu"/„Trifft voll zu" …), Format-Hinweise und der Modul-Titel direkt über der
  deutschen Frage bilden eine Einheit. Teilübersetzung wäre psychometrisch unsauber und sprachlich
  inkohärent (englischer Anker über deutscher Frage). Volles EN-Instrument = Fachübersetzung +
  Revalidierung + `text_en`/Anker-Spalten in der DB.
- **Modul-Namen** (Führungsidentität, Kommunikationsarchitektur …) bleiben Deutsch — Instrument-
  Eigennamen, behandelt wie die 12 Archetyp-Namen. Konsistent in item-renderer UND intro.

## Wörterbuch
3 neue Sektionen (assessmentPage, assessmentRunner, assessmentIntro), DE/EN strukturgleich.
Jetzt 40 Sektionen gesamt.

## Verifikation
- Residual-Scan: intro-Chrome vollständig auf t(); MODULE_TITLES bleibt Deutsch (gewollt).
- Gates: tsc OK · claimcheck 65 · vitest 355/355 (34) · eslint OK · next build Exit 0
  · npm audit 0 · PDF 4/4.

## Verbleibend (Welle 3)
3b-2b: result-Seite (740 Z) + result-Komponenten (Report-Inhalt psychometrisch geflaggt).
3c Token-Flows. 3d Content-Seiten. Siehe I18N.md.
