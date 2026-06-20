# FIX v3_66 — Modul-Pole in der Architektur-Sektion

## Problem
In der Landing-Architektur-Sektion („Sieben analytische Module" / „Sechs Kernachsen") zeigten die
**Achsen** ihre Pol-Paare (links ↔ rechts), die **Module** aber nur Schlagwort-Pills — die Pole
fehlten bei den Modulen. Diese Asymmetrie ist jetzt behoben.

## Was geändert wurde
- `components/landing/architecture.tsx`: jedes der 7 Module zeigt jetzt sein Pol-Paar als
  kompakte Spektrum-Zeile (links — Haarlinie — rechts), visuell an die Achsen angelehnt. Bewusst
  OHNE Positions-Marker, da die Landing generisch ist (kein echtes Profil → kein Fake-Score).
  Die Schlagwort-Pills bleiben darunter erhalten.
- 14 neue Wörterbuch-Keys (`poleAl`…`poleGr`) in `architecture`, DE/EN strukturgleich. EN
  übersetzt die Pole konsistent zu den bereits übersetzten Achsen-Polen derselben Sektion.

## ⚠️ Modell-Inhalt — bitte Wortlaut bestätigen
Es gab **nirgends** im Code Pol-Daten für Module (weder DB, lib/scoring, Wissensschicht, PDF noch
Beispieldaten). Die Pol-Paare sind daher NEU und von mir aus der jeweils **vorhandenen
Modul-Beschreibung** abgeleitet — nicht frei erfunden, aber Modell-Inhalt, den du als Eigentümer
final festlegst. Abgeleitete Pole (links ↔ rechts):

- **A Führungsidentität:** Diffus ↔ Konturiert  (Beschreibung: Selbstbild, innere Linie, Klarheit)
- **B Kommunikationsarchitektur:** Sendend ↔ Dialogisch  (einseitig senden vs. Dialog)
- **C Entscheidung & Priorität:** Abwägend ↔ Entschlossen  (Tempo / Konsequenz)
- **D Fehler- & Lernkultur:** Bedrohung ↔ Lernchance  (Fehler als Bedrohung vs. Bearbeitungsanlass)
- **E Führung unter Druck:** Kontrolle ↔ Gelassenheit  (Kippmuster: aus Struktur wird Kontrolle)
- **F Motivation & Aktivierung:** Fordernd ↔ Ermutigend  (Anspruch vs. Anerkennung)
- **G Beziehung & Vertrauen:** Distanziert ↔ Verbunden  (Nähe / Anschluss)

Wenn du andere Pol-Begriffe willst: es ist eine Ein-Zeilen-Änderung pro Modul im Wörterbuch
(`poleAl`/`poleAr` … in `lib/i18n/dictionaries/de.ts` + `en.ts`). Sag mir die Begriffe, ich setze
sie um.

## Verifikation
- Alle 7 Module tragen jetzt `pl`/`pr`; Pol-Zeile rendert `m.pl`/`m.pr`.
- Gates: tsc OK · claimcheck 65 · vitest 355/355 (34) · eslint OK · next build Exit 0
  · npm audit 0 · PDF 4/4 · DE/EN-Parität 4/4.
