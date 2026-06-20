# FIX v3_65 — i18n Welle 3d-ii: Saison-Monitor (Abschluss Welle 3)

## Was
Der Saison-Monitor (Tier-5) schaltet DE/EN — reines Management-Chrome. Damit ist die gesamte
App-Oberfläche zweisprachig. Instrument + Report bleiben durchgängig Deutsch (geflaggt).

## Übersetzt
- **saison** (Server): Hero, „Aktive & Vergangene" / „Neue Saison starten", Leer-Zustand,
  Saison-Zeilen (Sport/Status sind Daten; „Pulse-Cycles" / „offener Pulse #" lokalisiert).
- **saison/[id]** (Server): „← Alle Saisons", Zugriff-gesperrt-Block, Hero-Meta
  (Spieler/Intervall/Status). „Saison-Monitor · Zugriff gesperrt" → `seasonDetail.lockedKicker`.
- **season-control** (Client, 432 Z): vollständige Zyklus-Steuerung (starten/schließen mit
  ≥5-Anonymitäts-Gate/archivieren), Trend-/Historie-Abschnitte, Token-Verwaltung (erzeugen,
  kopieren, widerrufen, rotieren, reaktivieren), alle notify-Meldungen und confirm-Dialoge,
  Datum via `useLocale`.
- **create-form** (Client): Labels + Sende-Zustand; Sport-Optionen reuse aus `options.sport*`.

## Bewusst Deutsch belassen (Instrument-/Report-Grenze, geflaggt)
- `DIM_LABELS` (Pulse-Dimensionen: Coach Impact, Psy Sicherheit, Teamklima, Belastung, Wir-Gefühl,
  Fokus) bleiben Deutsch — Instrument-Dimensionsnamen wie AXIS_LABELS/MATURITY_LABELS.
- `care_hints`-Inhalt (anonym aggregierter Snapshot, Humatrix Care-Trigger) bleibt Deutsch.
- severity/direction/status sind berechnete Roh-Daten (nicht übersetzt, wie überall).

## Wörterbuch
4 neue Sektionen (seasonOverview, seasonDetail, seasonControl, seasonCreate), DE/EN strukturgleich.
Jetzt **63 Sektionen** gesamt.

## Tests
Saison-Assertion in hardening-v3-43 aufs Wörterbuch umgezogen: die result-Seite/Saison-Seite prüfen
jetzt den Key (`seasonDetail.lockedKicker`) + DE_DICT enthält „Saison-Monitor · Zugriff gesperrt".
Intent (Entitlement-Gate + sichtbarer Lock) erhalten.

## Verifikation
- DIM_LABELS + care_hints nachweislich weiter Deutsch; Chrome-Strings ersetzt; Saison-Dateien
  ohne Residual-Chrome-Deutsch.
- Gates: tsc OK · claimcheck 65 · vitest 355/355 (34) · eslint OK · next build Exit 0
  · npm audit 0 · PDF 4/4.

## WELLE 3 ABGESCHLOSSEN
Gesamte App-Oberfläche zweisprachig (Landing → Auth/Konto → Dashboard → Assessment → Result/Report-
Tooling → Token-Flows → Content-Seiten → Saison-Monitor). 63 Sektionen, DE=EN über Typ erzwungen.
Durchgängig Deutsch/geflaggt: validiertes Instrument (Items, Anker, Modul-/Archetyp-Namen,
rephrase, Pulse-Fragen) + Report-Inhalt (lib/insight, lib/scoring, AXIS/MATURITY/DIM-Labels,
Portraits, Musterbericht, care_hints) — eigene Spur (Fachübersetzung + Revalidierung).

## Verbleibend (keine Blocker)
i18n-Welle 4 (E-Mail-Templates locale-aware), Welle 5 (Test-Assertions → Wörterbuch). Siehe I18N.md.
