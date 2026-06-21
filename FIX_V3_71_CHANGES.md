# FIX v3_71 — Zweite Go-live-Blocker-Runde (7 × P0 + P1-Doku-Sync)

Antwort auf den **zweiten finalen Go-live-Audit** (NO-GO gegen v3.70). Jeder Punkt wurde
**zuerst empirisch gegen den echten Code geprüft** — **alle sieben P0 waren real** — und dann
behoben. Kernlinie unverändert: **fail-closed**, **Advertised = Delivered**, **eingefrorenes
Ergebnis statt Nachrechnen**, **psychometrische Geltung an Fachfreigabe gebunden**, **ehrliches
Scoping**.

---

## Umgesetzt (code-verifiziert, je P0)

### P0.2 — Readiness prüft jetzt den VOLLSTÄNDIGEN Item-Vertrag
- **`lib/release/readiness.ts`**: lädt Items nun mit `code, text_de` und führt **`checkItemsAgainstContract`**
  aus (neuer Check `full_item_contract`). Damit kann die Readiness nicht mehr HTTP 200 melden, während
  der bezahlte Kunde danach einen fail-closed gesperrten Fragebogen bekäme — geprüft werden jetzt auch
  doppelte Codes, fehlende Fragetexte, nicht unterstützte Formate, unvollständige Choice-Optionen und
  doppelte Optionsschlüssel.
- **`supabase/migrations/47_full_item_contract_integrity.sql`** (NEU): spiegelt **dieselben** Prüfungen
  datenbankseitig in `coachcheck_release_integrity()` und hebt `schema_version` auf **47** (die Readiness
  verlangt diese Version → DB **und** App müssen den vollen Vertrag halten).

### P0.5 — Choice-Finalisierung war bei fehlenden Optionen fail-open → fail-closed
- **`lib/assessment/answer-validity.ts`** (NEU): zentrale, **testbare** `isValidAnswerValue(format, row)`.
  Bei Auswahlformaten ohne gültige Optionen ist die Antwort jetzt **ungültig** (vorher `return true`).
- **`finalize/route.ts`**: nutzt diese Funktion statt der inline-Prüfung. Unit-getestet inkl. des
  vom Audit geforderten Falls „Choice ohne Optionen → ungültig".

### P0.7 — Report-Regeneration konnte das bestehende PDF verlieren → versionierte Pfade
- **`lib/pdf/storage.ts`**: `uploadReportPDF` schreibt unter `userId/assessmentId/<uuid>.pdf` mit
  `upsert:false`. Eine Regeneration überschreibt damit NIE die Live-Datei, bevor die DB-Transaktion steht.
- **`report/route.ts`**: merkt sich bei Regenerate den vorherigen Pfad und löscht die alte (dann
  superseded) Datei **erst nach erfolgreicher Finalisierung**. Scheitert der neue Lauf, bleibt das
  bestehende PDF gültig.

### P0.4 — Snapshot ist jetzt die alleinige Ergebnisquelle
- **`finalize/route.ts`**: Archetyp-Query lädt die Anzeigefelder mit (`short_trait, kernmuster,
  staerken, risiken, entwicklungshebel`); der `result_snapshot` friert die **vollständige
  Archetyp-Darstellung** ein (`archetypes.primary/secondary`).
- **`result/page.tsx`**: liest Achsen + Entwicklungsindikatoren **Snapshot-first**; Archetyp-Texte werden
  aus dem Snapshot über das FK-Objekt gelegt. Der **Re-Check** filtert jetzt auf gleiches **Produkt +
  Scoring-Version + Itempool-Version + vorhandenen Snapshot** und vergleicht **Snapshot gegen Snapshot**.
- **`report/route.ts`**: nutzt eingefrorene Achsen (`axisScoresFrozen`) und überlagerte Archetyp-Texte aus
  dem Snapshot; Entwicklungsindikatoren ebenfalls Snapshot-first. Ein späterer Edit am Archetypenmodell
  oder an Textbausteinen verändert damit einen neu erzeugten Report eines ALTEN Assessments nicht mehr.

### P0.6 — Modul-Pole fachlich nicht gedeckt → sichere qualitative Web-Darstellung
- **`result/page.tsx`**: Der Web-Bereich „Sieben Führungsdimensionen" zeigt jetzt **nur Modulnamen +
  Label „Qualitativer Reflexionsbereich"** mit klarem Hinweis — **keine bipolaren Pol-Positionen, keine
  pseudo-präzisen Prozentwerte**. Der gerichtete `moduleTendency`-Helper und der Positionspunkt sind
  entfernt. Das PDF zeigt Module ohnehin nur als Name + Titel + Narrativtext (unverändert, bereits sicher).

> ⚠️ **POLICY-FLAG (Entscheidung erforderlich):** Damit nehme ich meine **eigene v3.70-Ergänzung**
> (bipolare Modul-Pole + Richtungspunkt in der Web-Auswertung) **bewusst auf qualitativ zurück**. Grund:
> die Pole sind fachlich nicht bestätigt (Projektverlauf v3.66 abgeleitet → v3.67 als Fehlinterpretation
> entfernt → v3.69/70 wieder eingeführt), und das Modulsignal mischt Wichtigkeit/gelebtes Verhalten/Zustand,
> ist also keine saubere bipolare Dimension. Das entspricht deiner Linie „psychometrische Geltung an
> Profis". **Wenn du die bipolare Darstellung bewusst willst** (z. B. weil eine Item-Konstrukt-Matrix
> freigegeben ist), sag Bescheid — dann ist es ein Ein-Flag-Revert. Die Pol-Labels bleiben in
> `lib/release/contract.ts` als interne Struktur erhalten, nur die Kundendarstellung ist entschärft.

### P0.3 — Echter Release-E2E + variable Antwortsequenz
- **`package.json`**: neue Skripte `test:e2e:release` und **`release:verify`** (`ci` + `preflight` +
  `test:e2e:release`).
- **`tests/e2e/release-flow.spec.ts`** (NEU): verbindlicher, env-gated Volllauf (Login → bezahltes
  Assessment → **alle Items** → Ergebnis: sechs Achsen + sieben Module → Report/PDF → optionale
  Refund-Sperre). Antworten **deterministisch, aber VARIABEL** (1→5→2→4→3, Spannungsfeld bewusst 50/50,
  Choice rotierend) — nie konstant, damit keine absichtlich „nicht interpretierbare" Qualität entsteht.
- **`tests/e2e/questionnaire.spec.ts`**: läuft jetzt durch **ALLE** Items und prüft **jedes**
  Spannungsfeld auf nicht-leere Pole ohne Platzhalter (statt nur den ersten Screen).
- *Grenze (ehrlich):* Der echte Stripe-Checkout/-Webhook/-Refund braucht Stripe-Test-Infrastruktur
  (Stripe CLI/Fixtures) und läuft nur mit gesetzten Variablen in deiner Umgebung — nicht von hier aus.

### P1 — Dokumentation synchronisiert
- **`02_ACCEPTANCE_CHECKLIST.md`**: Titel auf v3.71; Live-Schritte auf Migrationen **01 → 47**; neue
  **Nachweistabelle** (Datum · Umgebung · Tester · Nachweis) + Abnahme-Unterschrift (für P0.1).
- **`LAUNCH.md`**: E2E nicht mehr „test.fixme", sondern echte env-gated Tests + `release:verify`;
  Migrationsstand **01 → 47** inkl. Migration-47-Hinweis.
- E2E-Datei-Kommentare: „test.fixme"-Verweise entfernt.

---

## Neue/erweiterte Tests
- **`tests/p0-release-v3-71.test.ts`** (NEU, 17 Tests): Unit-Tests für `isValidAnswerValue` (inkl.
  Choice-ohne-Optionen → false) + Guard-Tests für P0.2/P0.3/P0.4/P0.6/P0.7.
- **`tests/release-contract-v3-69.test.ts`**: +2 behaviorale Readiness-Tests (`full_item_contract` schlägt
  bei nicht unterstütztem Format bzw. doppeltem Code an).
- **`tests/p0-release-v3-70.test.ts`** an die v3.71-Realität angepasst (Choice-Prüfung in zentraler
  Funktion; Module qualitativ statt bipolar; Snapshot-Lesepfad).

---

## Gate-Ergebnisse (lokal, alle grün)
- `tsc --noEmit` → 0
- `node scripts/claimcheck.mjs` → **69 Dateien, keine riskanten Claims**
- `npx vitest run` → **424/424** (38 Dateien; vorher 405)
- `eslint .` → 0
- `next build` → **Compiled successfully**, Exit 0
- `npm audit` → **1 low** (esbuild, **nur Dev**, nicht im Produktions-Bundle; Fix nur über
  Breaking-Upgrade — wie in den Vorreleases als akzeptabel dokumentiert)
- `node scripts/pdf-fulltest.mjs` → **4/4 Varianten fehlerfrei**

---

## Bewusst NICHT umgesetzt (ehrliches Scoping)

### P1 — Auto-Upgrade Basis-→Premium-Report (deferred)
Schlägt die KI-Generierung fehl, wird ein regelbasierter **Basisreport** gespeichert; ein automatisches
erneutes Premium-Retry (Cron/Queue mit `fallback_ready`-Status + Admin-Monitor) ist **noch nicht** gebaut.
Das ist im Audit **P1, kein Launch-Blocker**. Ich baue es bewusst **nicht halb** — sag, ob es als
nächstes kommen soll, dann sauber mit Status/Queue/Monitor.

### P0.1 — Live-Abnahme bleibt deine Verantwortung (statisch nicht erbringbar)
1. Migrationen **01 → 47** auf frischer DB (Reihenfolge erzwingt schema_version bis 47).
2. **`npm run preflight` / Readiness → 200** gegen die echte DB.
3. **Echter Stripe-Testkauf** (Webhook via Stripe CLI/Fixtures) → Vertragsmail + PDF.
4. **Voller Refund** → Ergebnis/Report/Einladungen/Share/Saison/Aktionen gesperrt.
5. **Antwortqualität „durchgeklickt"** → Premium blockiert + Gratis-Neuversuch.
6. **`npm run release:verify`** mit gesetzten `PLAYWRIGHT_BASE_URL`/`E2E_*` (+ optional `E2E_REFUND_URL`).
7. **Vercel-Produktionsdeploy** + **juristische/steuerliche Freigabe**.

Nichts davon wird hier als „erledigt" behauptet. Die ausfüllbare Nachweistabelle steht in
`02_ACCEPTANCE_CHECKLIST.md` (Abschnitt C).
