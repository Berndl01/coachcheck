# FIX v3_70 — Release-Blocker-Korrekturen (10 × P0 aus dem finalen Release-Audit)

Antwort auf den externen **Finalen Release-Audit zu v3.69**, der den Go-live mit 10 P0-Blockern
verweigert hat. Jede der zehn Behauptungen wurde **zuerst empirisch gegen den echten Code geprüft**
(nicht statisch geglaubt) — **alle zehn waren real** — und dann behoben. Kernlinie unverändert:
**fail-closed statt fail-open**, **Advertised = Delivered**, **eingefrorenes Ergebnis statt
Nachrechnen**, **ehrliches Scoping**.

Die sieben v3.69-Gates waren bereits grün — das war nie der Streitpunkt. Grüne Gates ≠ verkaufsbereit:
die Blocker lagen in Verhalten, das die bestehenden Tests nicht abgedeckt haben. Genau diese Lücken
sind jetzt geschlossen **und** mit neuen Tests verriegelt.

---

## Umgesetzt (code-verifiziert, je P0)

### P0.1 — Migrations-Versionslüge + Readiness fail-open → fail-closed
- **`supabase/migrations/45_release_contract_integrity.sql`**: schreibt jetzt `schema_version = 45`
  (vorher fälschlich `46`). Eine nur-bis-45-migrierte DB meldet damit nicht mehr „46 bereit".
- **`supabase/migrations/46_…`** (Abschnitt D, NEU): hebt `release_contract.schema_version` **erst
  am Ende von 46** auf `46` — also genau dann, wenn Snapshot-Spalten + gehärtete Report-RPC real da
  sind. Verifikations-Block prüft das.
- **`lib/release/readiness.ts`**: liest jetzt `release_contract` live und vergleicht
  schema/scoring/itempool **exakt** mit den Code-Konstanten (neuer Check `release_contract_version`).
  Die DB-Integritätsfunktion ist **fail-closed**: fehlt sie (Migration 45 nicht aktiv) oder wirft sie,
  ist die DB **nicht** bereit (vorher wurde der Fehler als `ok:true` durchgewinkt).

### P0.2 — Fragebogen prüft nur DB-Itemzahl → zusätzlich gegen Code-Spec
- **`app/assessment/[id]/page.tsx`**: vergleicht die ausgelieferte/DB-`item_count` zusätzlich mit
  `expectedItemCountForSlug(slug)` aus dem Release-Vertrag. Drift (DB ≠ Code) blockt den Fragebogen
  fail-closed mit Marker `spec_count_mismatch`. Tatsächliche, DB- und Code-Itemzahl müssen identisch sein.

### P0.3 — Item-Vertrag nur Pole/Zahl → vollständige Itemprüfung
- **`lib/release/contract.ts`** (`checkItemsAgainstContract`): prüft jetzt zusätzlich **eindeutige ID**,
  **eindeutigen Code**, **vorhandenen Fragetext**, **Modul A–G**, **unterstütztes Format**,
  **vollständige Auswahloptionen (key + text) mit eindeutigen Schlüsseln** — zusätzlich zu den
  bestehenden Pol-/Platzhalter-/Itemzahl-Prüfungen.

### P0.4 — Spannungsfeld-Platzhalter + irreführende 50/50
- **`components/assessment/item-renderer.tsx`**: der Fallback `{ left:'Pol A', right:'Pol B' }` ist
  **entfernt** — es wird nichts mehr erfunden (fehlende Pole blockt der Vertrag vorher). Ein
  **unbeantwortetes** Spannungsfeld ist jetzt klar von einer **bewussten 50/50-Wahl** getrennt:
  Anzeige „Noch nicht beantwortet" + Button „50 / 50 bewusst auswählen", gedämpfter Regler,
  `data-testid="pole-left"/"pole-right"`, `aria-valuetext`. Der Weiter-Button bleibt gesperrt, bis
  bewusst geantwortet wurde.

### P0.5 — Ergebnis/Report/PDF lasen teils live → eingefrorener Snapshot als Quelle
- **`app/assessment/[id]/result/page.tsx`**: liest Achsen/Entwicklungsindikatoren/Modul-Signale
  bevorzugt aus `result_snapshot` (Migration 46), nicht beim Lesen neu gerechnet; Legacy fällt
  deterministisch zurück.
- **`app/api/assessment/[id]/report/route.ts`**: bevorzugt **eingefrorene** Modul-Signale **und
  Modul-Gaps** aus dem Snapshot statt aus evtl. geänderten Items neu zu rechnen.
- **`app/api/assessment/[id]/finalize/route.ts`**: friert zusätzlich `module_gaps` in den Snapshot
  ein, damit der Report sie aus dem Snapshot lesen kann.

### P0.6 — Finalize scort alle Antworten → nur erwartete Items + Choice-Schlüssel
- **`finalize/route.ts`**: ab der Vollständigkeitsprüfung wird **ausschließlich auf den erwarteten
  Items des Tiers** gerechnet (`expectedIdSet` + `validAnswers`) — fremde/doppelte Antworten fließen
  weder ins Scoring noch in Modul-Signale, Antwortqualität oder Snapshot. Choice-Antworten müssen
  einen **gültigen Optionsschlüssel** des Items treffen, sonst zählen sie nicht als beantwortet.

### P0.7 — `finalize_report_atomic()` ohne Vorbedingungen
- **`supabase/migrations/46_…`**: Funktionskörper gehärtet. Unter Zeilensperre wird geprüft, dass der
  Report-Job existiert, **zum Assessment gehört** und `processing` ist, und dass das Assessment
  existiert und **abgeschlossen** ist (`completed`/`report_ready`). Jede Mutation muss **genau eine
  Zeile** treffen (`GET DIAGNOSTICS`); andernfalls Exception → **gesamte Transaktion bricht ab**
  (kein Report ohne gültigen Statuswechsel und umgekehrt).

### P0.8 — Aktionshistorie nach Abschluss/Refund noch änderbar
- **`app/api/action/[planId]/route.ts`**: Check-in-Rücknahme (DELETE) und Fokus-Abschluss (PATCH)
  setzen jetzt **aktiven Status** voraus (409 sonst) und prüfen die Bezahlung (402). Der Abschluss
  ist **statusgebunden** (`.eq('status','active')` + 409 bei 0 Zeilen) — `completed_at` lässt sich
  nicht nachträglich verschieben.

### P0.9 — Sieben Module nur im PDF → auch im Web sichtbar (qualitativ)
- **`app/assessment/[id]/result/page.tsx`**: neuer Abschnitt **„Sieben Führungsdimensionen"** —
  dieselben sieben Module wie im Report, aus dem eingefrorenen Snapshot, als **qualitative Tendenz**
  Richtung eines Modul-Pols (kein normierter Prozentwert), mit ausdrücklichem Reflexions-Disclaimer.

### P0.10 — E2E-Tests dauerhaft per `test.fixme` deaktiviert → echte, env-gated Tests
- **`tests/e2e/questionnaire.spec.ts`**: der Kernlauf ist ein echter Test (kein `test.fixme` mehr),
  per `E2E_*`-Env gegated; nutzt die neuen Pol-`data-testid`s.
- **`tests/e2e/purchase-flow.spec.ts`**: aus dem Dauer-`test.fixme(true)` wird ein **echter
  Volllauf** (Login → alle Items beantworten → Abschließen → Ergebnisseite → Sieben Dimensionen),
  gegated über `E2E_ASSESSMENT_ID` (ein vorab freigeschaltetes, bezahltes Test-Assessment) — **ohne
  Stripe-Abhängigkeit** im Test.

---

## Neue/erweiterte Tests
- **`tests/p0-release-v3-70.test.ts`** (NEU, 16 Tests): Guard-Tests für alle zehn P0 (Migrationsversionen,
  Readiness fail-closed, Spec-Cross-Check, kein „Pol A/Pol B"-Literal + Unbeantwortet-Zustand,
  Snapshot-Quelle, Finalize-Härtung, RPC-Guards, Aktionshistorie-Schutz, Sieben Dimensionen, E2E aktiviert).
- **`tests/release-contract-v3-69.test.ts`** erweitert: +6 Vertragsprüfungen (duplicate_id/_code,
  missing_text, bad_module, unsupported_format, incomplete_options/duplicate_option_key) und +3
  Readiness-Fälle (fehlende Integritätsfunktion, fehlender/abweichender DB-Vertrag).

---

## Gate-Ergebnisse (lokal, alle grün)
- `tsc --noEmit` → 0
- `node scripts/claimcheck.mjs` → **68 Dateien, keine riskanten Claims**
- `npx vitest run` → **405/405** (37 Dateien; vorher 378)
- `eslint .` → 0
- `next build` → **Compiled successfully**, Exit 0
- `npm audit` → **1 low** (esbuild, **nur Dev**, Windows-Dev-Server; nicht im Produktions-Bundle;
  Fix nur über Breaking-Upgrade — wie in den Vorreleases als akzeptabel dokumentiert)
- `node scripts/pdf-fulltest.mjs` → **4/4 Varianten fehlerfrei**

---

## Was offen bleibt — ausdrücklich Bernies Live-Verantwortung (statisch nicht prüfbar)
Diese Schritte sind **nicht** von hier aus verifizierbar und müssen auf einer frischen Staging-/Prod-
Umgebung laufen — der Audit und diese Auslieferung sind sich über diese Grenze einig:
1. **Migrationen 01–46** auf frischer DB anwenden; Reihenfolge 45 → 46 erzwingt schema_version 45 → 46.
2. **`npm run preflight` / `/api/admin/readiness` → 200** (vorher bewusst 503, solange 46 fehlt).
3. **Echter Stripe-Testkauf** (Webhook via Stripe CLI/Fixtures) → Vertragsmail + PDF empfangen.
4. **Voller Refund** → Ergebnis/Report/Check-ins/Abschluss gesperrt (402/Sperrseite).
5. **Antwortqualitäts-Test** (sehr schnell + gleichförmig) → Premium blockiert, kostenloser Neuversuch.
6. **E2E live** mit gesetzten `E2E_EMAIL/PASSWORD/E2E_ASSESSMENT_ID` (Playwright, nicht Teil von vitest).
7. **Juristische Freigabe** (Datenschutz/AGB/Art. 22) bleibt bei deinem Anwalt.

Keine dieser offenen Punkte wird hier als „erledigt" behauptet.
