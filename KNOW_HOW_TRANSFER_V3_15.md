# KNOW-HOW-TRANSFER v3_15 — Achtsamkeits-Trigger (aus Humatrix Red-Flag-Audit 2026-06)

## Quelle

`humatrix_redflag_triggers_final.zip` → `lib/assessment/itembank-risk-triggers.ts`,
`lib/safety/red-flags.ts`, `content/itembank/scoring_visibility_redflag_rules.json`.

Kernerkenntnisse des Humatrix-Audits, die jetzt in CoachCheck verankert sind:

1. **Wertabhängige Trigger statt Pauschalheuristik.** Jedes relevante Item hat
   eine EXPLIZITE Richtung (Schutzfaktor → Ablehnung zählt; Belastungs-Wortlaut
   → Zustimmung zählt). Vorher gab es in CoachCheck gar keine Achtsamkeits-Ebene;
   kritische Antwortmuster (z. B. „fühle mich nach Fehlern klein gemacht") verschwanden
   im Dimensions-Mittelwert.
2. **Alarm-Fatigue-Prävention.** Aggregat statt Einzelflut: max. 3 Hinweise pro
   Auswertung, sortiert nach Signalstärke.
3. **Sichtbarkeits-Prinzip.** Der Trainer ist Kunde UND Bezugsperson der Befragten.
   Hinweise erscheinen daher nur anonym aggregiert mit strengen Schwellen
   (≥ 5 Antwortende, ≥ 2 betroffene Antworten, ≥ 25 % Anteil) — kein Rückschluss
   auf Einzelpersonen möglich. Share/Detailzahlen werden dem Trainer NICHT angezeigt.
4. **Nicht-diagnostische, claim-sichere Formulierung.** Zentral gepflegte Texte
   („Achtsamkeitshinweis … kein Befund über einzelne Personen"), per Test gegen
   die Claim-Guard-Sperrbegriffe abgesichert.

## Bewusste Abweichungen vom Humatrix-Original

- **Kein Freitext-Fail-safe**: CoachCheck hat keinen Disclosure-Kanal (nur
  server-validierte numerische/Choice-Antworten). Unbekannte Codes routen daher
  NICHT (es existiert keine Review-Queue) — konservativ ist hier Schweigen statt
  Spekulieren.
- **Strengere Anonymität statt Sensitivität-vor-Spezifität**: In Humatrix geht
  das Signal an geschulte Reviewer (Safeguarding/Medizin). In CoachCheck geht es
  an den Trainer selbst — deshalb Privatsphäre der Spieler vor Sensitivität.

## Neue/geänderte Dateien

- `lib/safety/care-triggers.ts` — NEU. Pure, getestete Trigger-Logik
  (Regeln für TC_*- und P_*-Items, `evaluateCareSignals`, `CARE_FRAME_NOTE`).
- `tests/care-triggers.test.ts` — NEU. 8 Tests: Richtungen, Anonymitätsschwellen,
  Einzel-Rückschluss-Schutz, Alarm-Fatigue-Cap, distinct-Respondenten, Claim-Sicherheit.
- `app/api/seasons/[id]/cycles/[cycleId]/close/route.ts` — Pulse-Zyklus erzeugt
  beim Schließen `snapshot.care_hints` (best effort, nie blockierend).
  ZUSÄTZLICH GEFIXT: Cycle wird jetzt gegen die Saison validiert
  (vorher konnte ein authentifizierter Saison-Besitzer per fremder `cycleId`
  einen Zyklus außerhalb seiner Saison schließen — Server-Authority-Lücke).
- `app/saison/[id]/season-control.tsx` — Historie zeigt Achtsamkeitshinweise
  mit Rahmenhinweis „anonym aggregiert · kein Befund über einzelne Personen".
- `app/api/assessment/[id]/report/route.ts` — TeamCheck (Tier ≥ 4): rohe
  Spielerantworten werden serverseitig (Admin-Client, Schwelle ≥ 5 abgeschlossene
  Spieler-Einladungen wie im Aggregate-RPC) ausgewertet; Hinweise fließen in
  Prompt + PDF.
- `lib/ai/report-prompt.ts` — `teamcheck.careHints` im Input; Prompt-Block mit
  expliziter Anweisung: sensibel aufgreifen, NIE über Einzelne spekulieren.
- `lib/pdf/report-document.tsx` — Achtsamkeitshinweis-Block auf der
  Team-Scores-Seite (nur wenn Hinweise vorhanden; Sample-PDF unverändert).

## Keine Migration nötig

`care_hints` lebt im bestehenden `pulse_cycles.snapshot` (jsonb); TeamCheck-Hinweise
werden zur Reportzeit berechnet und nicht persistiert.
