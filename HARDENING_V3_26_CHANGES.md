# CoachCheck — Änderungen v3_26

**Fokus:** Vertiefung der trainer-seitigen **Empfehlungen & Hilfestellungen**
zu Druck, eigener Belastung und schwieriger Kommunikation. Rein additiv,
claim-sicher, **ohne Eingriff in Item-Zahlen oder Marketing-Claims**.

## Ausgangslage (Audit-Befund)

Die App deckt die Themen bereits substanziell ab — der Befund vorab:

- **Druck:** Modul E „Führung unter Druck", 12 Items (Selbstreaktion, 4× `state`-
  Selbstregulation, Halbzeit-Rückstand-Szenario E_dr_12). Reifewerte
  `druckreife` und `selbstregulation` werden aus Modul E berechnet.
- **Kommunikation:** Modul B „Kommunikationsarchitektur", 14 Items (Klarheit
  unter Druck, Kritik/Feedback, Zuhören, Absicht-vs-Wirkung, Misalignment-Szenario).
- **Stress/Zustand:** über `state`-Items (letzte 14 Tage) erfasst.
- **Empfehlungen:** Der Report erzeugt bereits ein **14/30/90-Tage-Entwicklungs-
  programm** (`development-matcher`) mit konkreten Interventions-Schritten +
  Trainer-Rahmung, plus Druckprofil, Shadow-Pattern (Kippmuster unter Druck)
  und — für TeamCheck/Saison — anonymisierte care-Impulse.

**Echte Lücke:** Die bestehenden Druck-/Overload-/Stakeholder-Bausteine waren
auf *Spieler* bzw. *Consultant* zugeschnitten. Für den **Trainer selbst** fehlten
direkte Hilfestellungen zu eigener Belastung, Außendruck und High-Stakes-Kommunikation.

## Was neu ist

### `lib/knowledge/development-core.ts`
- Neues Wissensmodul **M26 — Selbstführung, Belastungssteuerung & Erholung des Trainers**.
- **6 neue, an den Trainer adressierte Interventionen** (`audience: 'coach'`),
  claim-sicher:
  - **I035** Eigene Belastungssteuerung (Quellen sortieren, Erholungsfenster, Austausch)
  - **I036** Außendruck-Grenze setzen (Verein/Eltern/Umfeld vom sportlichen Kern trennen)
  - **I037** Niederlagen-Ansprache strukturieren (Klartext + Aufbau)
  - **I038** Faire Bank-/Rollenbotschaft kommunizieren
  - **I039** Persönliche Druck-Vorroutine (Seitenlinie)
  - **I040** Wirkungs-Check für wichtige Botschaften (Absicht vs. Wirkung)
- → Interventionsbibliothek jetzt **40 Bausteine** (vorher 34).

### `lib/knowledge/development-matcher.ts`
- Die neuen Bausteine sind über die **Reifedimensionen** verdrahtet, damit sie
  über die bestehenden Scores beim Trainer ankommen:
  - `selbstregulation` → + I035, I039
  - `druckreife` → + I039, I035, I036
  - `konfliktreife` → + I037
  - `verantwortungsklarheit` → + I038
  - `perspektivflexibilitaet` → + I040
- `AXIS_RULES` und `MATURITY_RULES` werden jetzt exportiert (für Integritätstests).

### `tests/development-matcher.test.ts` (neu)
- **Integrität:** jede in AXIS_RULES/MATURITY_RULES referenzierte Interventions-ID
  existiert; `framings`-Keys ⊆ `interventionIds`.
- **Erreichbarkeit:** I035–I040 werden bei niedriger Reife tatsächlich ausgespielt.
- **Druck-Surfacing:** niedrige Druckreife allein erzeugt Druck-Bausteine; `maxItems` wird respektiert.
- **Claim-Sicherheit:** keine verbotenen Muster in Interventions-Texten/Rahmungen.

## Bewusst NICHT geändert
- **Keine neuen Fragebogen-Items in Live-Tiers** → Item-Zahlen (27/92/92/77),
  Dauer und Startseiten-Claims (Hero/Stats) unverändert, Invariante „beworben =
  geliefert" bleibt intakt. Eine optionale, count-gekoppelte Item-Erweiterung
  liegt als Vorschlag in `proposals/stress-pressure-communication/` (deine Entscheidung).
- Keine Schema-Migration, kein Eingriff in Scoring-Gewichte.

## Gates (alle grün)
```
tsc --noEmit ........... ✓
claimcheck ............. ✓ 46 Dateien
vitest ................. ✓ 51 Tests (vorher 37)
eslint ................. ✓
next build ............. ✓ EXIT 0
npm audit (omit dev) ... ✓ 0 vulnerabilities
```
