# CoachCheck v3.69 — Release-Vertrag, Ergebnis-Snapshot, ehrlicher Report

Zusammenhängende Release-Welle (keine isolierte Schnellkorrektur). Umgesetzt
direkt gegen die reale v3.68-Codebasis und gegen den Vertrag aus
`CoachCheck_v3_68___verbindlicher_nächster_Umsetzungsschritt.pdf`.

**Hinweis zum Vorgehen:** Das im Begleittext erwähnte „Programmierpaket"
(`new-files/`, `replacements/`, `coachcheck_v3_68_programmierpaket.zip`) war den
Uploads NICHT beigefügt. Statt fremde Dateien blind zu kopieren (die ggf. nicht
zur echten Codebasis passen), wurde jeder Vertragspunkt direkt im vorhandenen
Code umgesetzt und gegen die Gates verifiziert.

## Gate-Abnahme (alle grün)

- `tsc --noEmit` — sauber
- `node scripts/claimcheck.mjs` — 68 Dateien, keine riskanten Claims
- `npx vitest run` — **379/379** (360 Bestand + 19 neu)
- `eslint .` — sauber
- `next build` — erfolgreich
- `npm audit --omit=dev` — **0 Schwachstellen** in Produktionsabhängigkeiten
- `node scripts/pdf-fulltest.mjs` — **5/5** Report-Varianten rendern (inkl. Basis-Auswertung)

## Neue zentrale Wahrheit

**`lib/release-contract.ts`** — Single Source of Truth für 7 Module, 6 Achsen
(inkl. Pole), 6 Entwicklungsindikatoren (+ Reflexions-Disclaimer), erwartete
Itemzahlen je Tier (27 / 103 / 103 / 77), Archetypen-Anzahl (12) und
Scoring-/Itempool-/Schema-Version. Bisher waren diese Definitionen über
`item-renderer.tsx`, `scoring.ts`, `result/page.tsx` und `report-document.tsx`
dupliziert; diese ziehen jetzt aus der zentralen Datei.

`validateItemContract()` prüft einen geladenen Itemsatz: richtige Itemzahl, alle
sieben Module, jedes Spannungsfeld mit beiden Polen, bekannte Formate, gültige
Auswahloptionen.

## Migrationen

- **45_release_contract_integrity.sql** — `schema_meta` (Versionen) +
  `check_release_contract()` (prüft live: Itemzahl je Tier, Modulpräsenz,
  Archetypen-Anzahl, vollständige Spannungsfeld-Pole, bekannte Formate,
  „beworben = geliefert"). Selbst-testend.
- **46_score_snapshot_timezone_report_finalize.sql** —
  `assessments.result_snapshot` (Ergebnis-Snapshot), `profiles.timezone`,
  `reports.report_kind` ('premium' | 'basis') und `finalize_report_atomic()`
  (transaktionaler Report-Abschluss). Selbst-testend.

## Fail-Closed-Fragebogen

- **`app/assessment/[id]/page.tsx`** prüft VOR dem Öffnen den Item-Vertrag. Bei
  Verletzung erscheint ein neutraler technischer Fehlerzustand — kein
  unvollständiger Bogen, keine Ersatztexte.
- **`components/assessment/item-renderer.tsx`**: „Pol A"/„Pol B"-Ersatztext
  ENTFERNT. Fehlt ein Pol, wird der Regler nicht angezeigt („Frage nicht
  verfügbar"). Spannungsfeld-Regler hat jetzt ein **bewusstes 50/50**: solange
  der Trainer nicht interagiert, gilt die Frage als unbeantwortet (kein
  stillschweigend gespeicherter Default). Unbekannte Formate fallen neutral aus.

## Ergebnisvertrag (unveränderbarer Snapshot)

- **Finalize** speichert beim Abschluss einen `result_snapshot` mit
  Scoring-/Itempool-/Schema-Version, erwarteten Item-IDs, Achsen, Modulsignalen,
  Entwicklungsindikatoren, Archetypen, Profilklassifikation, Antwortqualität und
  Abschlusszeitpunkt.
- **Result-Seite** und **Report-Route** rechnen Indikatoren NICHT mehr beim
  Lesen neu (vorher `computeMaturityScores` zur Laufzeit), sondern lesen den
  gefrorenen Snapshot. Alt-Assessments fallen sauber auf die persistierte Spalte
  `maturity_scores` zurück.

## Antwortqualitäts-Gate

- `nicht_interpretierbar` blockiert Ergebnis UND Premiumreport und bietet einen
  **kostenlosen Wiederholungstest** an (`/api/assessment/[id]/retake`, an genau
  diesen Schutzfall gebunden).
- `eingeschränkt` wird als sichtbarer Hinweis-Banner erklärt; das Ergebnis bleibt
  sichtbar, aber vorsichtiger gerahmt.

## Report: transaktional + ehrlich

- Report-Zeile, Assessment-Status und Job-Status werden über
  `finalize_report_atomic()` in EINER Transaktion abgeschlossen. Schlägt die DB
  fehl, wird die bereits hochgeladene PDF wieder gelöscht (kein verwaister
  Storage-Eintrag).
- Ein KI-Fallback ist jetzt ehrlich eine **„Basis-Auswertung"** (`report_kind =
  'basis'`): Cover/Meta im PDF, E-Mail-Betreff/-Text und die Rückgabe der Route
  zeigen die Unterscheidung. Kein verstecktes „Premium-Report"-Versprechen mehr.

## Refund-Cascade vervollständigt

- **Stripe-Webhook**: Bei vollem Refund werden zusätzlich aktive
  **Aktionspläne archiviert**.
- **`/api/assessment/[id]/action`** (Plan setzen) und
  **`/api/action/[planId]`** (Check-in / Abschluss) prüfen jetzt
  `checkPaidEntitlement` — nach Refund keine neuen Pläne, keine Check-ins, kein
  Fertigstellen.

## Entwicklungsindikatoren statt „Führungsreife"

- Result-Seite und PDF benennen die zweite Schicht als
  **„Entwicklungsindikatoren"** mit ausdrücklichem Reflexions-Disclaimer.
  Normierende Wertungen („souverän"/„gefestigt"/„unreif") entfernt; nur noch
  neutrale Tendenz-Verortung. Die Werte werden als Reflexionshinweise
  gekennzeichnet — sie geben NICHT vor, normierte Führungsreife zu sein.

## Abnahme-Werkzeuge (für Live-Umgebung)

- **`app/api/admin/readiness/route.ts`** — geschützte Readiness-API
  (Bearer `CRON_SECRET`): ruft `check_release_contract()` und gleicht die
  schema_meta-Version mit dem Code ab. HTTP 200 = freigabefähig, 503 = Verstöße
  im Body.
- **`scripts/preflight-release.mjs`** (`npm run preflight`) — prüft die Live-DB
  gegen den Vertrag, Exit ≠ 0 bei Verletzung.
- **`tests/e2e/questionnaire-flow.spec.ts`** — Playwright-Durchlauf: sichtbare
  Pole (nie „Pol A/B"), alle Items beantworten, Finalisierung, sechs Achsen im
  Ergebnis. Smoke-Teil läuft immer; voller Lauf via `E2E_*`-Env.

## Bewusst NICHT blind programmiert

Die Indikator-Formel ist KEINE empirisch validierte Reife-Skala. Sie wird
deshalb als Reflexionshinweis dargestellt, nicht als normierte Führungsreife.
Für ein wissenschaftlich belastbares Modell braucht es danach eine dokumentierte
Item-Konstrukt-Matrix und eine fachliche/empirische Prüfung. → siehe `P0.6` in
der Abnahmecheckliste, Sign-off durch Bernie.

## Offen — Bernies Live-Abnahme (nicht statisch verifizierbar)

Siehe `RELEASE_V3_69_ACCEPTANCE.md`. Kurz: migrierte DB + Readiness HTTP 200 +
echter Browserdurchlauf + echter Kauf + Vertragsmail + Refund-Test.
