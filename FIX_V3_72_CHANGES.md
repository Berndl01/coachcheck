# FIX v3_72 — Migration-47-Datenbankfehler (`product_items`) behoben

Antwort auf den **dritten finalen Go-live-Audit** (NO-GO gegen v3.71). Der Audit nannte **einen
echten, blockierenden Datenbankfehler** in Migration 47 plus mehrere Test-/Prozess-Lücken. Jeder
Punkt wurde **zuerst empirisch gegen den echten Code und gegen eine echte PostgreSQL-Datenbank
geprüft** und dann behoben — kein bloßer SQL-Namentausch. Kernlinie unverändert: **fail-closed**,
**Advertised = Delivered**, **eingefrorenes Ergebnis statt Nachrechnen**, **psychometrische Geltung
an Fachfreigabe gebunden**, **ehrliches Scoping**.

---

## Entscheidung: Variante B (Migration 47 bleibt unverändert, Migration 48 repariert additiv)

Der Auftrag stellte zwei sich ausschließende Varianten zur Wahl:

- **Variante A** — Migration 47 direkt korrigieren (nur erlaubt, wenn 47 **nirgends** ausgeführt wurde).
- **Variante B** — Migration 47 unverändert lassen, neue **Migration 48** ersetzt die Funktion additiv.

Gewählt: **Variante B.** Begründung: Supabase verfolgt angewandte Migrationen **nach Dateiname**. Wäre
Migration 47 bereits auf Staging oder Produktion gelaufen, würde eine In-Place-Korrektur von 47 dort
**nie erneut** angewandt — der Fehler bliebe in genau den Umgebungen bestehen, die zählen. Eine
**additive** Migration 48 repariert dagegen **beide** Fälle: die frische DB (47 → 48 laufen
hintereinander) **und** die bereits migrierte DB (nur 48 kommt neu hinzu). Unter Unsicherheit über den
realen DB-Stand ist Variante B strikt dominant und fail-closed. Konsequenz: Es wurde **ausschließlich**
`schema_version` von 47 auf 48 gehoben; **`scoring_version` (1) und `itempool_version` (25) bleiben
unverändert**, weil weder Scoring-Algorithmus noch Itempool geändert wurden — nur die Integritäts-SQL.

> **Wichtige Korrektur gegenüber dem Audit-Text:** Der Auftrag beschrieb die Vertragstabelle als
> `public.coachcheck_release_contract` mit Spalten `release_name`, `singleton`, `item_pool_version`.
> Diese Tabelle/Spalten **existieren im realen Projekt nicht**. Die reale Tabelle ist
> **`public.release_contract`** (angelegt in Migration 45), Singleton erzwungen über
> `id boolean primary key check (id)`, Spalten `schema_version, scoring_version, itempool_version,
> updated_at`. Migration 48 wurde gegen das **reale** Schema geschrieben (`update public.release_contract
> set schema_version = 48 where id = true`). Hätte ich den Audit-Text wörtlich umgesetzt, wäre die
> Migration sofort an einer nicht existierenden Tabelle gescheitert.

---

## Umgesetzt (code- und DB-verifiziert, je P0)

### P0.1 — `product_items`-Fehler behoben (`items.package_tiers`)
- **`supabase/migrations/48_fix_release_integrity_product_items.sql`** (NEU): ersetzt
  `coachcheck_release_integrity()` per `create or replace` vollständig. Der einzige fehlerhafte Block —
  die Produkt-Itemzählung — verwendet jetzt die **reale** Zuordnung:
  ```sql
  select count(*) into served
  from public.items i
  where i.active = true
    and i.player_item = false
    and rec.tier = any(i.package_tiers);
  ```
  Die nicht existierende Tabelle `public.product_items` taucht in **ausführbarem SQL nicht mehr** auf
  (nur noch in erläuternden Kommentaren). **Alle acht** übrigen Vertragsprüfungen aus Migration 47
  (fehlende Module, Pol-Vollständigkeit, Archetypenzahl, doppelte Codes, fehlende Fragetexte, nicht
  unterstützte Formate, unvollständige Optionen, doppelte Optionsschlüssel) sind **unverändert
  erhalten**.
- **`lib/release/contract.ts`**: `RELEASE_SCHEMA_VERSION = 48`. Die Readiness vergleicht DB-Vertrag und
  Code-Konstanten exakt → DB **und** App müssen auf 48 stehen.

### P0.2 — Integritätsfunktion wird WÄHREND der Migration wirklich ausgeführt
- Migration 47 prüfte nur die **Existenz** der Funktion — der `product_items`-Fehler blieb deshalb auf
  einer frischen DB verborgen, bis die Funktion das erste Mal aufgerufen wurde. Migration 48 ruft die
  Funktion **am Ende selbst auf** und bricht die Migration mit `raise exception 'CoachCheck release
  integrity failed: %'` ab, falls `ok != true`. Eine inkonsistente DB (fehlende Fragen, falsche
  Itemzahlen, fehlende Pole, gebrochener Release-Vertrag) kann damit **nicht mehr erfolgreich
  migrieren**.

### P0.3 / P0.4 — Release-E2E-Umgebung wird verpflichtend geprüft
- **`scripts/assert-release-e2e-env.mjs`** (NEU): bricht mit `process.exit(1)` ab, wenn eine von
  `PLAYWRIGHT_BASE_URL`, `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_ASSESSMENT_ID` fehlt.
- **`package.json`**: `release:assert-env` läuft in `release:verify` **vor** Playwright:
  `npm run ci && npm run preflight && npm run release:assert-env && npm run test:e2e:release`.

### P0.5 — Release-E2E kann nicht mehr still übersprungen werden
- **`tests/e2e/release-flow.spec.ts`**, **`tests/e2e/questionnaire.spec.ts`**,
  **`tests/e2e/purchase-flow.spec.ts`**: das frühere `test.skip(!ENV, …)` ist ersetzt durch einen
  **fail-loud** `test.beforeAll`-Guard, der bei fehlender Umgebung wirft:
  `Release-E2E-Umgebung unvollständig — fehlende Variablen: …`. Die env-freien Smoke-Checks bleiben
  bestehen; der echte Kernlauf wird nicht mehr grün-durch-Skip.

### P0.6 — Frischer DB-Aufbau + Integritätsaufruf als Release-Gate
- Dokumentiert und **real durchgespielt** (siehe nächster Abschnitt). `supabase db reset` muss alle
  Migrationen fehlerfrei durchlaufen, danach muss `select public.coachcheck_release_integrity()`
  `{"ok": true, "problems": []}` liefern und der Vertrag exakt `schema_version=48, scoring_version=1,
  itempool_version=25` zeigen.

### Lock-in-Tests
- **`tests/p0-release-v3-72.test.ts`** (NEU, 12 Tests): fixiert Migration 48 (package_tiers genutzt,
  kein ausführbares `product_items`, `schema_version=48`, `where id = true`, keine Referenz auf
  `release_name`/`singleton`/`coachcheck_release_contract` in ausführbarem SQL, harte
  Integritätsausführung, `RELEASE_SCHEMA_VERSION === 48`), prüft, dass **Migration 47 unverändert**
  bleibt (Variante B), sowie P0.3/P0.4 (Env-Assertion + Script-Reihenfolge) und P0.5 (kein
  env-`test.skip` mehr, beforeAll-Guard in allen drei Specs).

---

## Empirischer DB-Nachweis (echtes PostgreSQL 16, nicht statisch)

Lokales PostgreSQL 16.14 installiert, Supabase-Umfeld nachgebaut (Rollen `anon/authenticated/
service_role/authenticator`, `auth`-Schema + `auth.uid()/role()/jwt()`-Stubs, `storage`-Schema,
`pgcrypto`), dann alle 48 Migrationen real angewandt:

1. **Fehler reproduziert:** frische DB, Migrationen 01–47 laufen grün durch, aber
   `select coachcheck_release_integrity()` → `ERROR: relation "public.product_items" does not exist`.
   Bestätigt: Der Bug war echt und auf frischer DB erst beim Funktionsaufruf sichtbar.
2. **Bereits-migrierte DB (Szenario Staging/Prod):** Migration 48 auf die 01–47-DB angewandt →
   Integrität `{"ok": true, "problems": []}`, Vertrag `48 / 1 / 25`. ✓
3. **Frische DB (Szenario `supabase db reset`, P0.6):** kompletter Lauf 01–48 grün, Integrität
   `ok=true`, Vertrag `48 / 1 / 25`. ✓
4. **Negativtest (fail-closed-Beweis):** auf einer 01–47-DB die beworbene Schnelltest-Itemzahl künstlich
   verfälscht (27 → 26), dann Migration 48 als **eine Transaktion** (`psql -1`) angewandt → Abbruch mit
   `ERROR: CoachCheck release integrity failed: {ok:false, problems:[Itemzahl-Drift … beworben 26,
   ausgeliefert 27]}`, `schema_version` blieb atomar auf **47** (Rollback). ✓ Das beweist: Das Gate ist
   **real**, nicht kosmetisch — eine inkonsistente DB wird hart abgewiesen.

---

## In dieser Runde von den Gates gefangene Regressionen (ehrlich dokumentiert)

Der Schlussauftrag verlangte ausdrücklich, **nicht** nur den SQL-Namen zu tauschen und zu liefern. Genau
deshalb wurden vor Auslieferung alle Gates real gefahren — und sie haben zwei selbst eingeschleppte
Fehler gefunden und gestoppt:

- **`tests/e2e/questionnaire.spec.ts`** — bei der P0.5-Umstellung war versehentlich die öffnende
  `test('…', async ({ page }) => {`-Zeile verloren gegangen; der Testkörper hing dadurch direkt im
  `describe`-Block (illegales `await` außerhalb einer async-Funktion). **ESLint** hat den Parserfehler
  gefangen; die `test(...)`-Hülle wurde wiederhergestellt. (Die beiden anderen Specs waren korrekt.)
- **`tests/launch-doc-v3-51.test.ts`** — eine zweite, hartkodierte Zusicherung erwartete weiterhin
  „01 → 47" in `LAUNCH.md`. Auf „01 → 48" nachgezogen.

---

## Doku-Synchronisation

- **`LAUNCH.md`** und **`02_ACCEPTANCE_CHECKLIST.md`**: Migrationsbereich „01 → 48", Migration-48-Fix und
  `schema_version = 48` vermerkt.
- Frühere `FIX_V3_*_CHANGES.md` bleiben als Historie unverändert.

---

## Verbindliche Gates — alle grün (echte Läufe)

```text
tsc --noEmit                  ✓
node scripts/claimcheck.mjs   ✓  (70 Dateien, keine riskanten Claims)
npx vitest run                ✓  (436/436)
eslint .                      ✓
next build                    ✓  (vollständige Route-Tabelle, fehlerfrei)
npm audit --omit=dev …=high   ✓  (0 Schwachstellen im Produktionsbundle)
node scripts/pdf-fulltest.mjs ✓  (4/4 PDF-Varianten)
```

> `npm audit` (inkl. dev) meldet weiterhin **eine** „low"-Schwachstelle: `esbuild`-Dev-Server
> (GHSA-g7r4-m6w7-qqqr, Windows-Dev-Server-Dateilesen), transitiv über die Vitest-Toolchain, **nicht im
> Produktionsbundle**. Ein Fix erzwänge ein Breaking-Upgrade; bewusst als akzeptabel dokumentiert. Das
> release-kritische `--omit=dev --audit-level=high` ist **0 Schwachstellen**.

---

## Was statisch NICHT verifizierbar ist — bleibt deine Verantwortung (P0.7–P0.11)

Diese Schritte brauchen eine laufende Staging-Umgebung mit echten Stripe-/Resend-/Supabase-Diensten und
können hier **nicht** bewiesen werden. Ich behaupte ausdrücklich **nicht**, dass die vollständige
Live-Kette bestanden wurde:

```text
[ ] P0.7  Readiness auf Staging → HTTP 200 (reale Route: /api/admin/readiness, Header CRON_SECRET)
[ ] P0.8  103-Fragen-Browserlauf: 7 Module, 6 Achsen, echte Pole, Web = PDF
[ ] P0.9  echter Stripe-Testkauf inkl. Webhook, Vertragsmail, Vertrags-PDF, Freischaltung
[ ] P0.10 vollständiger Refund → ALLE kostenpflichtigen Rechte danach gesperrt (402/403/409)
[ ] P0.11 Cron-Smoke: /api/internal/{reminders,confirmation-retry,withdrawal-retry} ≠ 401/403/503
```

> **Weitere Audit-Korrektur:** Die geschützte Readiness-Route heißt real **`/api/admin/readiness`** und
> nutzt **`CRON_SECRET`** — nicht `/api/internal/readiness` mit `DEPLOY_HEALTH_SECRET` (so im Audit-Text,
> existiert nicht). `scripts/preflight-release.mjs` zielt bereits auf die reale Route.

---

## Version

`CoachCheck v3.72` (von 3.71). Damit ist eindeutig dokumentiert, welche Version den Migration-47-Fix
(via Migration 48) enthält.
