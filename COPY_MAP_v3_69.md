# COPY-MAP v3.69 — „Führungsreife" → „Entwicklungsindikatoren"

Die zweite Ergebnisschicht (sechs aus Modul-Trends + Achsen abgeleitete Werte) wurde bisher
als **„Führungsreife"** mit wertenden Verdikten („souverän", „gefestigt", „im Aufbau",
„Entwicklungsfeld") und Prozentangaben dargestellt. Das suggeriert ein **normiertes,
validiertes Reifemaß**, das es (noch) nicht ist: Es fehlt eine dokumentierte Item-Konstrukt-
Matrix und eine empirische Validierung.

Bis diese Validierung vorliegt, wird die Schicht durchgängig als **Reflexionsraster**
dargestellt — „Entwicklungsindikatoren". Werte bleiben sichtbar (als Tendenz), aber:
- **keine** wertenden Verdikte („souverän"/„gefestigt"/„unreif") mehr,
- **keine** Prozent-Punktzahl als Schein-Norm (Tendenz statt „73 %"),
- ein **expliziter Hinweis**, dass es ein Denkanstoß ist, keine endgültige Einstufung.

## Geänderte Stellen (Code-verifiziert)

| Ort | Vorher | Nachher |
|---|---|---|
| `app/assessment/[id]/result/page.tsx` (Kicker) | „Führungsreife" | „Entwicklungsindikatoren" |
| ebd. (H2) | „Wie souverän du führst." | „Sechs Hinweise zum Weiterdenken." |
| ebd. (Band-Label) | `souverän / gefestigt / im Aufbau / Entwicklungsfeld` + „%" | `deutlich ausgeprägt / im mittleren Bereich / wenig ausgeprägt` (ohne %) |
| ebd. | — | Reflexions-Disclaimer ergänzt |
| `lib/pdf/report-document.tsx` (Kicker) | „Premium · Führungsreife" | „Premium · Entwicklungsindikatoren" |
| ebd. (H1) | „Stil ist das eine. *Reife* ist etwas anderes." | „Stil ist das eine. *Entwicklung* ist das andere." |
| ebd. (Werte) | „X %" (goldDeep) | Tendenz-Label + Disclaimer |
| `lib/ai/report-prompt.ts` | „# FÜHRUNGSREIFE … wie souverän …" / „Wo ist der Trainer souverän, wo gibt es Reife-Lücken?" | „# ENTWICKLUNGSINDIKATOREN … Reflexionshinweise, keine Verdikte" |
| `lib/insight/progress.ts` | „Deine Führungsreife ist stabil geblieben …" / „Reife-Vergleich" | „Deine Entwicklungsindikatoren sind stabil …" / „Vergleich der Entwicklungsindikatoren" |
| `lib/i18n/dictionaries/de.ts` + `en.ts` (`b3`) | „Führungsreife: wie souverän du …" | „Entwicklungsindikatoren: Reflexionshinweise …" |
| ebd. (`s2text`) | „… Führungsreife, funktionale Signatur …" | „… Entwicklungsindikatoren, funktionale Signatur …" |

## Bewusst NICHT geändert

- **Archetyp-Erzählungen** in `lib/archetype-deep-dive.ts` verwenden „souverän"/„Reife" **beschreibend**
  (z. B. „spielt souverän in Drucksituationen", „die souveräne Stufe"). Das sind narrative
  Charakterisierungen einzelner Archetypen, **kein** normiertes Reife-Verdikt über den Nutzer —
  ein Blanket-Replace würde hier Inhalte und Tests beschädigen und das Ziel verfehlen.
- Die **Dimensionsnamen** (Selbstregulation, Perspektivflexibilität, Konfliktreife, Druckreife,
  Verantwortungsklarheit, Integrationsfähigkeit) bleiben — sie benennen neutral, was betrachtet
  wird, ohne zu bewerten.
- Die **Berechnung** (`computeMaturityScores`) bleibt unverändert. Es werden KEINE neuen Gewichte
  „erfunden" — nur die **Darstellung** wird ehrlich gemacht. Die Werte werden ab v3.69 im
  unveränderbaren Snapshot (Migration 46) eingefroren und nicht mehr beim Lesen neu gerechnet.

## Offen (DEINE Entscheidung / vor „normierter Reife")

Bevor diese Schicht wieder als belastbares **Reifemaß** beworben werden darf, braucht es:
1. eine dokumentierte **Item-Konstrukt-Matrix** (welche Items messen welche Dimension, mit welcher Begründung),
2. eine **empirische Validierung** (Reliabilität/Validität an echten Daten),
3. eine Festlegung, ob/wie Normwerte gebildet werden.

Bis dahin ist „Entwicklungsindikatoren / Reflexionshinweise" die ehrliche, claim-sichere Bezeichnung.
