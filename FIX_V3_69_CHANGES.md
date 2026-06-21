# FIX v3_69 — Architektur-Release-Welle (Readiness, Snapshot, Antwortqualität, Refund, Entschärfung)

Setzt die in v3.68 ausdrücklich vertagten **architektonischen P0s** als EINE zusammenhängende
Release-Welle um — keine isolierte Schnellkorrektur mehr. Schwerpunkt: Die App **versagt jetzt
geschlossen (fail-closed)**, wenn der Fragebogen-Itempool dem Release-Vertrag widerspricht; das
Ergebnis wird beim Abschluss **eingefroren** (nie mit neuen Gewichten nachgerechnet); nicht
interpretierbare Durchläufe **blockieren** das Premium-Ergebnis; die Report-Finalisierung ist
**transaktional** und kennzeichnet Fallbacks **ehrlich**.

## Umgesetzt (code-verifiziert)

### Release-Vertrag + Fail-Closed-Readiness (§2/§3/§4/§18)
- **`lib/release/contract.ts`** (NEU): eine Wahrheit — 7 Module (A–G) + 6 Achsen inkl. Pole,
  exakte Itemzahlen je Produkt (27/103/103/77), Scoring-/Itempool-Version, Mindest-Archetypenzahl.
  Plus `checkItemsAgainstContract()` (Itemzahl, fehlende/Platzhalter-Pole „Pol A/Pol B").
- **Fragebogen-Gate** (`app/assessment/[id]/page.tsx`): stimmt die Itemzahl nicht mit
  `product.item_count`, oder fehlt ein Spannungsfeld-Pol bzw. ist er ein Platzhalter →
  **neutraler technischer Fehlerzustand** statt unvollständiger Fragen + Weiterklick. (DE/EN-Keys.)
- **`supabase/migrations/45_release_contract_integrity.sql`** (NEU): Tabelle `release_contract` +
  Funktion `coachcheck_release_integrity()` (Module, Pole, ausgelieferte Itemzahl je Produkt,
  Archetypen). Idempotent, self-check.
- **`lib/release/readiness.ts`** + **`app/api/admin/readiness/route.ts`** (NEU): Live-Readiness
  gegen den Vertrag; 200 nur bei voller Treue, sonst 503 mit Gründen. Zugriff: Admin **oder**
  `Bearer CRON_SECRET`.
- **`scripts/preflight-release.mjs`** (NEU) + `npm run preflight`: Exit ≠ 0 bis Readiness 200.

### Unveränderbarer Ergebnis-Snapshot (§7)
- **`supabase/migrations/46_…`** (NEU): `profiles.timezone`; `assessments.scoring_version`,
  `itempool_version`, `result_snapshot`, `snapshot_finalized_at`; Funktion `finalize_report_atomic`.
- **`finalize`**: friert Achsen, Modul-Signale, Entwicklungsindikatoren, Archetypen,
  Profil-Einordnung, Antwortqualität, erwartete Item-IDs + Versionen ein.
- **Result + Report** lesen die **eingefrorenen** Werte statt neu zu rechnen (Report-Route:
  fehlerhaftes Re-Persist der Reife entfernt).

### Antwortqualität-Gate (§6, verbindlich)
- `nicht_interpretierbar` **blockiert** Premium-Ergebnis (Result) **und** Premium-Report
  (Report-Route, 409) und bietet **kostenlosen Neuversuch**:
  **`app/api/assessment/[id]/retry/route.ts`** (NEU, eng abgesichert: Eigentum + bezahlt +
  wirklich nicht interpretierbar) + **`components/assessment/answer-quality-retry.tsx`** (NEU).
- `eingeschränkt` wird nur **abgemildert** als Banner gezeigt.

### Report-Transaktion + ehrliche Fallback-Kennzeichnung (§13)
- **`finalize_report_atomic`**: Report-Zeile + Status + Job in EINER Transaktion.
- Bei DB-Fehler wird das hochgeladene **PDF wieder gelöscht** (kein verwaistes File).
- **Ehrliche Kennzeichnung:** Fallback = **„Basis-Auswertung"**, kein Premium-Report. E-Mail +
  Reportstatus (`reportKind: 'basis' | 'premium'`) zeigen die Unterscheidung — **ohne** Alarm
  („Dienst ausgelastet"). *Siehe Hinweis unten.*

### Refund-Kaskade §14
- Entitlement-Gate in den Action-Routen: nach voller Rückerstattung **kein** neuer/erneuerter
  Fokus, **kein** Check-in, **kein** Abschluss (402). Webhook **archiviert aktive Pläne**.

### „Führungsreife" → „Entwicklungsindikatoren" (§9, Modell-Ehrlichkeit)
- Result, PDF, AI-Prompts (Report + Archetyp-Personalisierung), Landing (`b3`/`s2text`),
  Progress, **Musterbericht** und Beispiel-Reportdaten: keine Verdikte („souverän"/„gefestigt"/
  „unreif"), kein Schein-Norm-Prozent, expliziter **Reflexions-Hinweis**. Berechnung unverändert.
  Details: **`COPY_MAP_v3_69.md`**.

## Tests
- **`tests/release-contract-v3-69.test.ts`** (NEU, 18 Tests): Vertrag, `checkItemsAgainstContract`
  (Zahl/fehlende Pole/Platzhalter), `evaluateReadiness` gegen Fake-DB (jeder Fehlpfad).
- **`tests/e2e/questionnaire.spec.ts`** (NEU): keine „Pol A/Pol B", Pole sichtbar; Kernlauf
  `test.fixme` (braucht laufende Instanz + Test-Account — von dir live ausführbar).
- **`tests/launch-doc-v3-51.test.ts`** + `LAUNCH.md`: Migrationsstand 01 → 46.

## Gates (alle grün)
- `tsc --noEmit` Exit 0
- `claimcheck` 68 Dateien, keine riskanten Claims
- `vitest` **378/378** (36 Dateien)
- `eslint` Exit 0
- `next build` Exit 0 (inkl. `/api/admin/readiness`, `/api/assessment/[id]/retry`)
- **`npm audit`: 1 low (esbuild, NUR Dev-Server unter Windows; transitiv via vite/tsx — nicht in der
  Produktionslaufzeit). Die zuvor gemeldete moderate js-yaml-Lücke wurde via `npm audit fix`
  behoben.** (Bewusst NICHT „0" behauptet.)
- `pdf-fulltest` 4/4 fehlerfrei

## ⚠️ Wichtig: Live-Abnahme nötig (deine migrierte Umgebung)
Diese Welle ist **statisch** verifiziert. Vor „live": Migrationen **45 + 46** anwenden,
`node scripts/preflight-release.mjs` → 200, echter Browserdurchlauf, echter Kauf, Refund-Test,
Antwortqualität-Test. Vollständig in **`02_ACCEPTANCE_CHECKLIST.md`**. Ohne Migration 46 schlägt
die Report-Finalisierung bewusst fehl (RPC fehlt) — Migrationen sind der erste Live-Schritt.

## Hinweise / deine Entscheidung
1. **Fallback-Kennzeichnung** kehrt deine frühere bewusste Entscheidung (stille Auslieferung)
   **teilweise** um — ohne „KI ausgelastet"-Alarm, nur ehrliche Bezeichnung. Ein-Flag-Umkehr im
   E-Mail-Block von `report/route.ts`, falls du das stille Verhalten zurück willst.
2. **Entwicklungsindikatoren** sind jetzt als Reflexionsraster gekennzeichnet, **kein** validiertes
   Reifemaß. Für eine wieder belastbare „Reife"-Aussage braucht es Item-Konstrukt-Matrix +
   empirische Validierung (siehe `COPY_MAP_v3_69.md`).
3. **Rechts-Gate** (FAGG/AGB/Datenschutz/AVV/USt.) bleibt unverändert offen → Anwalt/Steuerberater.
