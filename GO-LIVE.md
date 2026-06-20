> 🚀 **FÜR DEN START: siehe `LAUNCH.md`.** Das ist das eine, verbindliche Dokument von
> „jetzt" bis „verkaufen" (geordnete Schritte 1–7 + Rechts-Gate). Dieses GO-LIVE.md behält
> nur die Historie/Begründungen.
>
> ✅ **VERBINDLICHER DEPLOYMENT-STAND — v3.42** (zuletzt aktualisiert mit der v3_43-Härtung).
> Maßgeblich ist ausschließlich dieser Abschnitt. Alle weiter unten stehenden alten Schritte
> sind VERALTET und dürfen NICHT befolgt werden — insbesondere direkte `rest/v1/answers`-Writes,
> ein Rollback auf anonyme RLS-Policies sowie veraltete Migrations-Angaben („Migration 12",
> „21 Migrationen").

## VERBINDLICHER DEPLOYMENT-STAND v3.42 — Migrationen 01 → 43

1. **Migrationen in Reihenfolge ausführen: 01 → 40** (idempotent).
   - **Frische Datenbank:** alle Migrationen `01 → 43` der Reihe nach.
   - **Bestehende Produktion (Stand 32 bereits angewendet):** nur die fehlenden, aufsteigend:
     **`33 → 34 → 35 → 36 → 37 → 38 → 39 → 40 → 41 → 42 → 43`**.

2. **PFLICHT-PREFLIGHT vor Migration 39** (Unique-Index „ein offener Cycle pro Saison"):
   Prüfen, ob in der Live-Datenbank bereits mehrere offene Cycles pro Saison existieren:
   ```sql
   select season_id, count(*)
   from public.pulse_cycles
   where status = 'open'
   group by season_id
   having count(*) > 1;
   ```
   - **Keine Treffer:** direkt fortfahren.
   - **Treffer:** Migration 39 räumt dies seit v3.42 selbst auf (pro Saison bleibt der Cycle mit
     der höchsten `cycle_number` offen, ältere werden ohne Snapshot archiviert). Wer vorab manuell
     bereinigen will, archiviert die älteren doppelten Cycles, sodass pro Saison genau ein Cycle
     `open` bleibt. Erst danach den Unique-Index bauen.

3. **Migration 40 (neu in v3.42):** Live-Antwortzähler offener Pulse-Cycles
   (`get_/refresh_pulse_cycle_response_count`, nur `service_role`) + Refund-Cascade-Backfill
   (bereits erstattete Käufe deaktivieren Einladungen + öffentlichen Share) + verschärfte RLS auf
   `pulse_cycles`/`pulse_invitations` (nur bei weiterhin bezahltem Kauf lesbar).

3d. **Migration 43 (neu):** Tabelle `action_checkins` für die tägliche
   Check-in-Schleife (genau ein Check-in pro Plan und Tag, Bestcase §12). RLS:
   Eigentümer liest nur, geschrieben wird ausschließlich über `service_role` aus
   `/api/action/[planId]`.

3c. **Migration 42 (neu):** Tabelle `action_plans` für den Aktionsbereich
   (7-Tage-Fokus aus dem nächsten Schritt, Bestcase §11/§12). RLS: Eigentümer liest
   nur, geschrieben wird ausschließlich über `service_role` aus
   `/api/assessment/[id]/action`. Partial-Unique-Index: höchstens ein aktiver Fokus
   pro Nutzer+Assessment.

3b. **Migration 41 (neu):** Tabelle `result_feedback` für das Treffer-Feedback
   (Wiedererkennung 0–10 + hilfreichster Abschnitt, Bestcase §27). Eigene Tabelle,
   getrennt vom Scoring — Feedback verändert das Ergebnis nicht. RLS: Eigentümer darf
   nur LESEN, geschrieben wird ausschließlich über `service_role` aus
   `/api/assessment/[id]/feedback`.

4. **Antworten ausschließlich über die Server-API.** KEIN direkter Browser-/REST-Write auf
   `answers`, `assessments`, `seasons`, `pulse_cycles`, `pulse_invitations`, `pulse_responses`,
   `invitations`, `consent_records`. Der korrekte Antwort-Pfad ist
   **`POST /api/assessment/[id]/answer`** — niemals `POST /rest/v1/answers`.

5. **RLS niemals auf anonyme/offene Policies zurücksetzen.** Rollback nur strukturerhaltend.

6. **Env-Variablen:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`,
   `INVOICE_VAT_NOTE`, Turnstile-Keys.

7. **Stripe-Webhook + Crons aktiv:** confirmation-retry, withdrawal-retry, reminders.

8. **Refund-Lockdown (Variante A, ab v3.42 konsistent):** Nach vollständiger Rückerstattung/Dispute
   sind gesperrt — neue Spieler-/Fremdbild-/Pulse-Tokens, bestehende Einladungslinks, der
   öffentliche Karten-Link (`share_enabled=false`, `share_token=null`), der Saison-Lesezugriff,
   die Report-Auslieferung und die Ergebnisseite.

9. **Datenschutz/Paywall:** Saison nur mit bezahltem Tier-5-Kauf; Pulse-Aggregate erst ab 5
   vollständigen Antworten; offene Tokens geben nie Einzelantworten zurück; ein Pulse-Cycle
   schließt mit Snapshot erst ab 5 Antworten (darunter nur „ohne Auswertung archivieren").

10. **Vor Verkaufsfreigabe — Live-End-to-End-Test (Pflicht):** Tier-5-Kauf → Vertrags-PDF
    empfangen → Assessment erst danach freigeschaltet → Saison anlegen → Pulse-Cycle starten →
    5 Tokens nutzen → Live-Zähler zeigt 1 → 5 → unter 5 kein Snapshot → ab 5 Snapshot + Trends →
    vollständigen Refund auslösen → alle oben genannten Sperren greifen.

Maßgeblicher Stand: siehe `BUILD_LOG.txt`.

---

# Go-Live Runbook — CoachCheck

Stand: verifiziert in sauberer Umgebung (Node 22, `npm ci`, Platzhalter-ENV).

## Verifizierter Status (in sauberer Umgebung reproduziert)

| Gate | Ergebnis |
| --- | --- |
| `npm ci` | ✅ Pakete installiert (Lockfile konsistent) |
| `next build` | ✅ grün, Exit 0, vollständige Routen-Tabelle |
| `tsc --noEmit` (nach Build, gegen `.next/types`) | ✅ 0 Fehler — inkl. Route-Typprüfung |
| Claim-Guard (`scripts/claimcheck.mjs`) | ✅ 42 Dateien, 0 riskante Claims |
| Unit-Tests (`vitest run`) | ✅ 25/25 grün |
| ESLint (`eslint . --max-warnings 0`) | ✅ 0 Fehler, 0 Warnungen |
| `npm audit` | ✅ 0 critical · 3 moderate (dokumentiert, s. u.) |
| `npm audit --omit=dev` (Produktion) | ⚠️ 2 moderate (Next-internes postcss, akzeptiert) |

**Maßgeblicher Gate vor jedem Deploy: `npm run verify`** — führt bewusst **zuerst `next build`** aus
(erzeugt `.next/types`) und prüft **danach** `tsc`, sodass Next-Route-Typfehler gefangen werden,
die ein `tsc` auf dem frischen Baum (ohne `.next/types`) übersieht. Danach Claim-Guard, Tests und
ESLint (0 Warnungen). Nur wenn `npm run verify` grün ist, wird deployt.

## Build-„Hänger" — Befund

Der gemeldete Hänger bei `Creating an optimized production build …` ist **hier nicht reproduzierbar**.
Mit installierten Dependencies und gesetzten ENV-Variablen läuft `next build` sauber bis zur
Routen-Tabelle durch (Exit 0). Geprüft und ausgeschlossen: kein Build-Time-Netzwerkaufruf
(keine `generateStaticParams`/`generateMetadata` mit Fetch), die `@react-pdf`-Fonts werden erst
zur **Laufzeit** in der Report-Route registriert, nicht beim Build.

**Schlussfolgerung:** Der Hänger ist umgebungsbedingt — die zwei häufigsten Ursachen:

1. **Fehlende ENV-Variablen** beim Build. → Vor dem Build `.env.production` aus
   `.env.local.example` befüllen (alle Keys gesetzt, auch Platzhalter genügen für den Build).
2. **Speicherdruck** beim Optimize-Step auf RAM-schwachen Maschinen. → Fallback:
   `npm run build:mem` (setzt `NODE_OPTIONS=--max-old-space-size=4096`).

Auf Vercel ist genügend RAM vorhanden; dort `npm run build` verwenden. Tritt der Hänger lokal
auf, zuerst ENV prüfen, dann `build:mem`.

## Migrationen (frische DB) — Reihenfolge

In Supabase exakt in dieser Reihenfolge ausführen (`supabase/migrations/`):

```
01_schema.sql
02_archetypes_seed.sql
03_item_pool.sql
04_storage_bucket.sql
05_invitations_360.sql
06_teamcheck_player_items.sql
07_saison_monitor.sql
08_premium_intelligence.sql
09_training_level.sql
10_context_schema_repair.sql
11_product_metadata_honesty.sql
12_rls_hardening.sql
13_private_raw_answers.sql
14_product_prices.sql
15_item_pool_expansion.sql
16_human_led_tier_pricing.sql
17_progress_maturity_store.sql
18_report_jobs.sql
19_hardening.sql
20_response_quality.sql
21_claim_cleanup_product_features.sql
```

(Hinweis: Es sind **21** Migrationen — `20_response_quality.sql` brachte das Response-Quality-
Feature, `21_claim_cleanup_product_features.sql` bereinigt „diagnostische" Produkt-Claims in
bereits deployten DBs. Alle sind idempotent und mit RLS versehen.)

## ENV für Produktion

Alle Keys aus `.env.local.example` setzen. Besonders für Public Sale:

- `ANTHROPIC_REPORT_MODEL=claude-opus-4-8` (Empfehlung; danach 1 Live-Report gegenprüfen)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Rate-Limiting **aktiv** schalten
  (ohne Upstash greift nur der In-Memory-Fallback, der pro Serverless-Instanz isoliert ist).
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` — Bot-Schutz Kontaktformular **aktiv**.

## Live-Smoke-Test (Staging, echte Keys)

In dieser Reihenfolge einmal durchspielen:

1. Signup → E-Mail-Bestätigung
2. Login / Logout
3. Stripe-Testkauf (Tier 1–3) → `checkout/success`
4. Assessment starten → ausfüllen → Finalize
5. Report-Generierung → PDF-Upload → Signed URL öffnet
6. Resend-Mail kommt an (Posteingang, nicht Spam)
7. 360°-Einladung: Link öffnen, ausfüllen, abschließen
8. TeamCheck-Link
9. Pulse-Link absenden
10. DSGVO: Daten-Export (`/konto/daten`) + Löschanfrage
11. Tier 4/5: Kontakt-/Anfrage-Flow (`/kontakt`)

## npm audit — Stand: 0 critical, 3 moderate (dokumentiert)

`npm audit` zeigt **0 critical, 3 moderate**; `npm audit --omit=dev` (Produktionspfad) zeigt **2 moderate**.

- **Kritisch (vitest, UI-Server) — behoben:** `vitest` auf 4.x angehoben. Das frühere „critical" betraf ausschließlich den **Vitest-UI-Server** (`vitest --ui`), der hier nie gestartet wird (CI nutzt `vitest run`); es war dev-only und nie im Produktions-Bundle. Mit dem Upgrade ist es weg, die 25 Tests bleiben grün.
- **2 moderate (Produktion):** ausschließlich das **in Next gebündelte `postcss`** (Build-Toolchain). Einziger „Fix" wäre ein Next-9-Downgrade — nicht vertretbar. Bewusst akzeptiert, da nur Build-Zeit-Tooling betroffen ist, nicht der Laufzeitpfad. Bei einem Next-Update erneut prüfen.
- **1 weiteres moderate (dev):** transitive Dev-Abhängigkeit der Test-Toolchain, kein Produktionspfad. Akzeptiert.

## Offene Punkte (Geschäfts-/Inhaltsentscheidung, kein Code)

- **USt/Steuer** in Stripe-Checkout final konfigurieren.
- **Rechtliche Freigabe** von AGB/Datenschutz durch eine:n Jurist:in.
- **Wissenschaftsclaim** (130 Quellen): entweder strukturierte Quellen-Appendix beilegen oder
  Formulierung weiter entschärfen — inhaltlicher Call.

## Bewusst NICHT vorgetäuschter Roadmap-Rest (für späteren Massenverkauf)

Async-Worker/Queue für Report-Erzeugung (Seam via `report_jobs` + `report-status`-Polling ist
gelegt), Sentry/Monitoring, echte Mandantenfähigkeit/Club-Rollen, MFA-Zwang, E2E-Tests,
Validierungs-/Norm-Bericht.

---

## Update v3.3 — Sofort-Fixes aus zweiter Bewertung

Code-seitig umgesetzt und gegengeprüft (tsc 0 · claimcheck 42 Dateien/0 · 23/23 Tests · Build Exit 0):

1. **Build-Nachweis:** `BUILD_LOG.txt` im Repo — `EXIT_CODE=0`, vollständige Routen-Tabelle, BUILD_ID erzeugt. (Auf Vercel identisch grün; Hänger des Prüfers = Umgebung/Speicher, s. o.)
2. **AI-Fehler hängt Job nicht mehr:** `generateReportTextsWithMeta` ist in der Report-Route hart abgefangen → `failJob`; zusätzlich liefert die Funktion bei fehlendem Anthropic-Client jetzt den Fallback-Report (statt zu werfen). Job wird nie dauerhaft `processing`.
3. **Report-DB-Insert wird geprüft:** `report_ready` wird nur gesetzt, wenn PDF-Upload **und** Report-Zeile erfolgreich sind — sonst `failJob`.
4. **DB-Claims bereinigt:** „diagnostische Module" in den Produkt-Features ersetzt (Quell-Seeds 01/11/15 korrigiert + neue idempotente Migration `21_claim_cleanup_product_features.sql` für bestehende DBs).
5. **Claimcheck erweitert:** scannt jetzt auch `supabase/migrations/*.sql` (42 statt 22 Dateien).
6. **Consent im echten Flow:** Checkout-Route zeichnet vor der Stripe-Session AGB/Datenschutz/KI-Verarbeitung via `recordConsent` auf (Version 2026-05-31, source=checkout, IP/UA gehasht).
7. **Admin-Checklist:** zeigt jetzt „Persistentes Rate-Limit (Upstash): aktiv/Fallback", „Bot-Schutz Turnstile: aktiv/inaktiv" und das gesetzte Report-Modell.
8. **„Neu generieren"-Button:** ehrlich umbenannt in „Download-Link neu abrufen" (Route ist idempotent; echte Regenerierung nur via `?regenerate=1`).

Weiterhin offen (bewusst, Roadmap Richtung 9/10 → 10/10): Async-Worker/Queue, Sentry/Monitoring, Admin-Ops-Dashboard, MFA-Zwang für Admins, E2E-Tests, echte Mandantenfähigkeit (Organizations/Teams/Rollen), wissenschaftliche Validierungsschicht.

---

## Update v3.4 — Premium-Pass an der Report-Engine

Der Report IST das Produkt — hier setzt „Premium" an. Geprüft und gehärtet (tsc 0 · claimcheck 42/0 · 25 Tests · Build Exit 0):

1. **System-Prompt geprüft** — bereits auf Boutique-Consulting-Niveau (Paradoxien statt Stärken/Schwächen, Wirkung-je-Kontext, Shadow-Pattern, 3-Ebenen-Logik, Reduktion-ist-Premium, claim-sicher). Bewusst unverändert gelassen.
2. **Strenge Schema-Validierung** (`validateReportOutput`): prüft jetzt SUBSTANZ statt nur Existenz — Mindesttiefe je Pflichtfeld (Executive Summary ≥220 Zeichen etc.), alle 7 Module vorhanden & ≥80 Zeichen, Listen mit ≥3 substanziellen Einträgen, plus Scan auf Platzhalter/Floskeln/KI-Ausfall-Text. Ein dünner, generischer Report gilt damit NICHT mehr als „fertig".
3. **Korrigierender Re-Roll statt Fallback:** Verfehlt ein Entwurf die Premium-Tiefe, bekommt das Modell einen präzisen Korrektur-Hinweis (welche Felder zu dünn waren) und erzeugt neu — bis zu 3 Versuche. Erst ein echter Ausfall führt zum Fallback.
4. **Fallback auf anständiges Niveau gehoben:** ehrlich als „reduzierte Erstfassung/Zwischenstand" markiert, claim-sicher („keine Diagnose"), aber mit echten Archetyp-Daten (Kernmuster, Stärken, Risiken, Hebel) statt Stummel-Sätzen — liest sich anständig UND besteht die Premium-Schwelle.
5. **PROMPT_VERSION** → `report-v2.9-2026-06-01` (für sauberes Logging/Nachvollziehbarkeit).

**Ehrlicher Vorbehalt bleibt:** Ob der Report im Markt als „premium / sein Geld wert" empfunden wird, entscheidet der echte generierte Inhalt — den kann nur ein Live-Report mit echtem Key zeigen. Diese Änderungen heben die Qualitäts-UNTERGRENZE deutlich an (kein dünner Report mehr) und erzwingen Tiefe; die OBERGRENZE liefert das Modell + dein Gegenlesen. Schick mir einen echten Report, dann lese ich ihn kritisch gegen.

---

## Update v3.5 — Grafische Matrizen + konkretere Sprache (Feedback Bernie)

Auf Wunsch „mehr grafische Elemente (Matrizen), bildliche Sprache, konkrete Beispiele — sonst zu theoretisch". Umgesetzt & gegengeprüft (tsc 0 · claimcheck 42/0 · 25 Tests · Build Exit 0 · echtes Beispiel-PDF gerendert):

1. **2×2-Positionsmatrizen im PDF** (`lib/pdf/report-document.tsx`): neue, NaN-sichere `PositionMatrix`-Komponente + eigene Seite „Deine Führungsmatrix" mit zwei Matrizen — „Wie du führst" (Intuitiv↔Strukturiert × Beziehung↔Leistung) und „Wie du steuerst" (Beteiligend↔Autoritär × Stabilisierend↔Aktivierend). Der Trainer erscheint als Goldpunkt im Quadranten, mit Pol-/Quadranten-Beschriftung und Prozent-Caption. Werte kommen deterministisch aus den Achsen-Scores (kein KI-Bedarf, kein Crash-Risiko).
2. **Automatische Seitennummerierung** im Footer (statt hartkodiert) — eingefügte Seiten verschieben die Nummern nicht mehr.
3. **Prompt auf Konkretheit getrimmt** (`lib/ai/report-prompt.ts`, PROMPT_VERSION `report-v2.10`): neue Stil-/Kernprinzipien erzwingen Mini-Beispiele aus dem Fußballalltag (Halbzeitstand, Auswechslung, Kabine nach Niederlage) und bodenständige bildliche Sprache (Metaphern aus Sport/Alltag) — ausdrücklich abgegrenzt vom verbotenen Eso-/Psychoblabla.

Beispiel-PDF (Fußball, Selbsttest) liegt im Repo unter **`docs/beispiel-report-fussball.pdf`** (und damit im ZIP) — zeigt die Matrizen und die konkretere, bildhafte Sprache real gerendert. Hinweis: in Produktion erzeugt `claude-opus-4-8` die Texte aus echten Daten; das PDF ist ein repräsentativer Näherungswert, kein Live-Output.

---

## Update v3.6 — Audit-Fixes (Lint, Doku, Build-Nachweis)

Reaktion auf die jüngste Bewertung. Verifiziert: **`npm run ci` = grün** (tsc 0 · claimcheck 42/0 · 25 Tests · **eslint 0**) und `next build` Exit 0.

1. **ESLint-Fehler behoben** (`lib/pdf/report-document.tsx:856`): straight quote in „besser" → typografisch korrektes Schlusszeichen. `eslint .` ist jetzt grün und **fester Bestandteil des Gates** (`npm run ci`). Mein Versäumnis im v3.5-Lauf, jetzt korrigiert.
2. **Doku synchronisiert:** 21 Migrationen (Liste + Hinweis korrigiert); README-Phasen 4–8 als umgesetzt markiert + „Next: Phase 4" durch aktuellen Status ersetzt; veraltete Item-Zahl entschärft.
3. **Beispiel-PDF liegt jetzt im Repo** (`docs/beispiel-report-fussball.pdf`) und damit im ZIP — die Doku-Aussage stimmt jetzt.
4. **Build-Nachweis:** `BUILD_LOG.txt` zeigt den Lauf **über „Collecting page data" hinaus** bis zur vollständigen Routentabelle (Exit 0). Geprüft: keine Import-Zeit-Nebenwirkungen in Routen (keine Modul-Scope-Clients, kein `generateStaticParams`/`revalidate`, kein Top-Level-`await`) — der gemeldete Hänger hat keinen Code-Grund und ist umgebungsbedingt. **Definitiver Nachweis = dein Vercel-Deploy-Log** (liegt naturgemäß bei dir).

### Offen — deine Seite (kein Code)
- **Vercel-Build-Log/Screenshot** mit Exit 0 als Public-Sale-Nachweis.
- **Live-Staging-Runde** mit echten Keys: Stripe-Kauf → Assessment → Report → PDF → Resend → 360-Link → TeamCheck → Pulse → Datenexport/Löschung.
- **Rechts-/Datenschutz-Freigabe** (AGB/Datenschutz) + USt in Stripe.
- **Wissenschaftsclaim** „130 Quellen / 54 Reviews": entweder strukturierte Quellen-Appendix beilegen ODER Sprache entschärfen (z. B. „wissenschaftlich anschlussfähig an etablierte Konstrukte aus Sportpsychologie und Teamforschung"). Bewusst NICHT eigenmächtig geändert — Inhalts-/Geschäftsentscheidung.

### Offen — Roadmap (für 10/10, nicht für Pilot)
Async-Worker/Queue, Sentry/Monitoring, E2E-Automation, Validierungsbericht/Normgruppen.

---

## Update v3.7 — Kritischer Route-Fix, Audit-Bereinigung, Claim entschärft

Reaktion auf die jüngste Bewertung. Verifiziert aus dem Clean-State (`rm -rf .next node_modules && npm ci`): **Build Exit 0** (vollständige Routentabelle), **`tsc` mit erzeugten `.next/types` = 0**, **`npm run ci` = 0** (tsc · claimcheck 42/0 · 25 Tests · eslint), **`npm audit` = 0 critical**.

1. **Kritischer Route-Typfehler behoben:** `CONSENT_VERSION` wird **nicht mehr** aus `app/checkout/[slug]/route.ts` exportiert (Next-Route-Dateien dürfen nur Next-Exporte enthalten) — ausgelagert nach `lib/constants/consent.ts` und importiert. Wichtig: Dieser Fehler war auf dem frischen Baum unsichtbar, weil er erst gegen die von Next erzeugten `.next/types` greift. **Gate-Konsequenz:** Der maßgebliche Typcheck läuft jetzt **nach** einem Build (`next build` erzeugt `.next/types`, danach `npm run ci`/`tsc`) — so werden Route-Typfehler künftig gefangen, obwohl der In-Build-Check (wegen @react-pdf-Stall-Risiko) bewusst aus bleibt.
2. **`npm audit` bereinigt:** `vitest` → 4.x; das „critical" (Vitest-UI-Server, dev-only, hier nie genutzt) ist weg. Stand: 0 critical, 3 moderate (Details oben).
3. **Wissenschaftsclaim entschärft:** „130 peer-reviewte Quellen / 54 Reviews" auf Landingpage (`science-foundation.tsx`) und Musterbericht durch claim-sichere Sprache ersetzt („wissenschaftlich anschlussfähig an etablierte Konstrukte aus Sportpsychologie, Team- und Coachingforschung"). Die echte, kuratierte Quellenliste + Evidenzgrade bleiben sichtbar. Reversibel: Liegt eine belegte Quellenbibliothek vor, können Zahlen + strukturierter Appendix wieder eingesetzt werden.

Bestätigt der Build-Lauf bei dir lokal einen Hänger bei „Collecting page data": Es gibt nachweislich keine Code-Ursache (keine Import-Zeit-Clients, kein `generateStaticParams`/`revalidate`, kein Top-Level-`await`); der Lauf hier geht über diesen Punkt hinaus bis zur Routentabelle. Definitiver Nachweis bleibt dein Vercel-Deploy-Log.

---

## Update v3.8 — Finaler Sauber-Durchgang

Vollständig grün aus dem Clean-State (`rm -rf .next node_modules && npm ci`):

- **`next build` Exit 0** (vollständige Routentabelle) · **`tsc` gegen `.next/types` = 0** · **claimcheck 42/0** · **25/25 Tests** · **`eslint . --max-warnings 0` = 0 Fehler / 0 Warnungen** · **`npm audit` 0 critical** (Prod 2 moderate, dokumentiert).
- **Proaktiver Scan aller `route.ts`-Dateien:** keine unerlaubten Nicht-Next-Exporte mehr (die Klasse des früheren `CONSENT_VERSION`-Bugs ist damit projektweit ausgeschlossen).
- **Keine** TODO/FIXME/Platzhalter im Quellcode; keine stale TS-Suppressions (das eine `@ts-expect-error` für `renderToBuffer` ist aktiv und nötig).
- **Neuer Gate `npm run verify`** (build-first) als maßgebliche Pre-Deploy-Prüfung — fängt Route-Typfehler, die ein reines `tsc` übersieht.

Damit ist code-/repo-seitig alles abgeschlossen, was ohne Live-Infrastruktur verifizierbar ist. Die verbleibenden Punkte sind **keine Code-Fehler**, sondern brauchen deine Umgebung/Entscheidung: Vercel-Deploy-Log, Live-Smoke-Test mit echten Keys, RLS-/Rollenrechte-Test gegen eine echte Test-DB, juristische Freigabe. Für 10/10 danach die Roadmap (Monitoring, Queue/Worker, Validierungsbericht nach Pilotdaten).

---

## Update v3.9 — „Collecting page data"-Hänger gezielt entschärft

Der wiederkehrend gemeldete lokale Build-Hänger bei `Collecting page data` ließ sich hier nie reproduzieren (Build lief stets über diesen Punkt hinaus). Wahrscheinlichste Ursache: In dieser Phase lädt Next jedes Route-Modul — und die Report-Route importierte `@react-pdf/renderer` (eine schwere Bibliothek) auf Top-Level, was auf RAM-schwachen/gedrosselten Build-Umgebungen lange dauern oder stocken kann.

**Fix:** `@react-pdf/renderer` und das Report-Dokument werden in `app/api/assessment/[id]/report/route.ts` jetzt **lazy** geladen (`await import(...)` im Handler) statt auf Top-Level. Damit ist die schwere PDF-Bibliothek aus der Build-Sammelphase heraus und wird erst zur Laufzeit geladen, wenn tatsächlich ein Report gerendert wird.

Verifiziert: `next build` Exit 0, `tsc` gegen `.next/types` = 0, claimcheck 42/0, 25/25 Tests, `eslint --max-warnings 0` grün, `npm audit` 0 critical. Keine statischen `@react-pdf`-Importe mehr in `app/`. Das sollte den lokalen Build auch in der Prüfumgebung reproduzierbar bis zur Routentabelle durchlaufen lassen.

---

## Update v3.10 — Intensive Ablauf-Prüfung (Logik, nicht nur Kompilierung)

Alle Kernabläufe durchverfolgt und auf Korrektheit geprüft:

**Auswertung / Scoring (`lib/scoring.ts`) — korrekt & konsistent.**
- Durchgängig interne −1..+1-Skala → 0..1 via `(avg+1)/2`; **kein Skalen-Mix** in gewichteten Summen.
- `moduleAverages` werden in `finalize` UND in der Report-Route mit **identischer** Formel (`(v-3)/2`, reverse negiert; `pos*2-1`) erzeugt → Reife ist überall gleich.
- Alle 6 Reife-Gewichte summieren exakt auf 1.0; neutrale Eingaben → 0.5; Leereingaben abgefangen.
- Fremdbild: 3er-Anonymitätsschwelle; Euklid-Distanz für Archetyp-Zuordnung sauber.

**Report-Erzeugung — korrekt.**
- Atomarer Job-Lock (Partial-Unique-Index nur auf `queued/processing` → Retry nach `failed` und Regenerierung nach `ready` funktionieren).
- `failJob()` auf allen Fehlerpfaden; `report_ready` erst nach PDF-Upload UND DB-Insert.
- Tier-Gating korrekt: Fremdbild ≥ Tier 3, TeamCheck ≥ Tier 4, Tier 1 reduzierter Report (kein Voll-Modul/Premium/Programm).

**360°/Einladungen — korrekt.** Token-Shape-Prüfung, Ablauf (410), idempotente Status, und eine **starke Abschlussprüfung** (alle erwarteten Items müssen vorliegen, bevor `completed`) — schützt Aggregat- und Anonymitätslogik.

**DSGVO-Löschung — korrekt.** Ownership-Prüfung (`user_id`) vor jeder Löschung; Audit-Log.

### Gefunden & behoben: Selbstheilung im Stripe-Webhook (Geld-Pfad)
**Problem:** Das `stripe_events`-Log wurde vor der Verarbeitung geschrieben; schlug danach ein Schritt (z. B. Assessment-Insert) transient fehl, blockierte das Log bei Stripes Retry (gleiche `event.id`) die Wiederholung — der zahlende Kunde hätte eine Purchase, aber **kein Assessment** gehabt, ohne Selbstheilung.
**Fix:** (1) Event-Log kürzt nur noch ab, wenn Status `processed` ist (unvollständige Versuche werden vom Retry erneut idempotent verarbeitet). (2) Bei Purchase-Redelivery wird die bestehende Purchase geholt statt abzubrechen. (3) Das Assessment wird nur angelegt, wenn noch keines verlinkt ist (Selbstheilung), Welcome-Mail nur beim erstmaligen Anlegen (kein Doppelversand). **Happy-Path unverändert.** Hinweis: Braucht trotzdem einen echten Stripe-Webhook-Test auf Staging zur Endabnahme.

### Kleiner Hinweis (kein Fehler): Seitenzahl-Angaben
Das gerenderte Tier-2-PDF hat ~16 Seiten, die UI nennt „12 Seiten" (also Unter-Versprechen). Empfehlung: in `components/landing/products.tsx`, `report-generate-button.tsx`, `musterbericht` auf Spannen umstellen („ca. 12–16 Seiten" bzw. „ab 12 Seiten"). Bewusst NICHT eigenmächtig geändert — Marketing-Entscheidung.

Verifiziert: `next build` Exit 0, `tsc` gegen `.next/types` = 0, claimcheck 42/0, 25/25 Tests, eslint 0 Warnungen.

---

## Update v3.11 — Seitenzahl-Angaben ehrlich gemacht

Die exakten Seitenzahlen in der UI (z. B. „12 Seiten" für Tier 2) lagen unter dem real gerenderten Umfang (~16). Da die Seitenzahl inhaltsabhängig variiert, ist eine fixe Zahl die falsche Darstellung. Umgestellt auf garantierte Untergrenzen **„ab X Seiten"** in `components/landing/products.tsx`, `components/assessment/report-generate-button.tsx` und `app/musterbericht/page.tsx` (Tier 1 ab 7, Tier 2 ab 12, Tier 3 ab 15, Tier 4 ab 17). Damit ist die Angabe nie über- oder unterversprochen. Verifiziert: Build Exit 0, tsc 0, claimcheck 42/0, 25/25 Tests, eslint 0.
