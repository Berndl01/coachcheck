# Scoring- & Validierungs-Audit (v3_28)

Tiefenprüfung von Scoring und Datenvalidierung — gegen den tatsächlichen Code,
mit Fokus auf die neuen v3_27-Items. **Ergebnis: korrekt, keine Logikänderung
nötig.** Zusätzlich ein Regressionstest, der die Semantik festnagelt.

## 1. Scoring — geprüft und korrekt

**Achsen-Scoring** (`computeAxisScores`): gewichteter Mittelwert pro Achse,
auf 0..1 normalisiert. Alle Formate der neuen Items sind abgedeckt:
- `state` → wie Likert (1→−1, 3→0, 5→+1), `reverse_scored` respektiert.
- `likert_5`, `gap_wichtig`, `gap_gelebt` → Likert-Mapping.
- `szenario` → Gewichte der **gewählten** Option, voller Beitrag (signed = 1).
- Unbekannter Options-Key → kein Beitrag (kein Crash, neutral).
- Normalisierung als Mittelwert: zusätzliche Items verschieben die Population-
  Baseline **nicht** — sie fügen nur Signal hinzu (kein Bias durch mehr Items).

**Modul-Mittelwerte** (finalize + report, identisch): aus `value_numeric`/
`value_position`, `reverse_scored` respektiert. **Szenario-Items fließen NICHT
in den Modul-Schnitt** (kein numeric) → die neuen Außendruck-/Kommunikations-
Szenarien verzerren druckreife nicht; sie wirken nur über Achsen-Optionsgewichte.

**Führungsreife** (`computeMaturityScores`): Richtung verifiziert —
- `druckreife` = 0.7·ModulE + 0.3·(1 − stabilisierung_aktivierung)
- `selbstregulation` = 0.7·ModulE + 0.3·reflexion_direktheit
Die neuen Belastungs-Items (positiv gekeyt, negatives stabilisierung-Gewicht)
heben **beide** Terme → ein Trainer, der eigene Last gut steuert, erhält höhere
Druck-/Selbstregulationsreife. Konsistent mit dem Konstrukt.

**gap-Konvention**: Bei allen bestehenden Paaren (A_id_11/12, B_ko_12/13,
D_fe_10/11 …) tragen **beide** Items identische Achsengewichte. Das neue Paar
E_be_05/06 folgt exakt diesem Muster — keine Abweichung.

## 2. Datenvalidierung — geprüft und robust

**Schreibpfad** (`/answer`, einzige Schreibquelle für Antworten):
- Zod-Schema; Ownership; Item muss **aktiv UND im Tier** sein.
- `likert_5/state/gap_*` → Integer **1..5**; `spannungsfeld` → Zahl **0..1**;
  `forced_choice/szenario/dilemma/ranking` → `value_choice` **∈ options[].key**.
- Genau ein Wertfeld wird gesetzt, der Rest serverseitig auf null.
- Client kann **nie** `status='completed'` setzen — Abschluss nur über `/finalize`.

**Abschlusspfad** (`/finalize`):
- Vollständigkeit gegen `get_items_for_assessment`: **alle** erwarteten Items des
  Tiers müssen gültig beantwortet sein, sonst HTTP 400 mit `missingItemIds`.
- Entdoppelung pro `item_id`; erst danach Score, Archetyp, `completed`.

→ Da ungültige Choice-Keys bereits am Schreibpfad abgewiesen werden, ist jede
gespeicherte Antwort garantiert gültig. Defense-in-depth ist geschlossen.

## 3. Neuer Regressionstest — `tests/scoring-new-items.test.ts` (9 Tests)

Nagelt fest: state==Likert; gap-Paar zählt doppelt zur Achse; Belastungs-Richtung
(<0.5); Szenario wendet Options-Gewichte vorzeichenrichtig an; unbekannter Key
neutral; Reife-Richtung (hoher Modul-E → hohe druckreife/selbstregulation);
mehr stabilisierend → höhere druckreife; neutraler Trainer → 0.5; gemischte
Pipeline bleibt in 0..1 + liefert Archetyp.

## Gates
```
tsc ✓ · claimcheck ✓ 47 · vitest ✓ 60 (vorher 51) · eslint ✓ · next build ✓ EXIT 0 · npm audit ✓ 0
```

Zusätzlich offline verifiziert: Report-/PDF-Pipeline rendert (19 Seiten) und die
ausgelieferte Item-Zahl je Tier (27/103/103/77) = beworbener `item_count`.
