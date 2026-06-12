# GO_LIVE_CHANGES.md — Final Pre-Release Hardening (v2.3)

Stand: 2026-05-16
Ausgangsbasis: `coachcheck_presale_hardened.zip`

Dieses Dokument listet ALLE Änderungen auf, die in dieser ZIP gegenüber der
Eingangsversion eingearbeitet wurden. Es ist die Übergabe-Doku für den
Programmierer.

## v2.3 — Änderungen gegenüber v2.2

### Migration 14: Neue Preisstaffel
**File:** `supabase/migrations/14_product_prices.sql` (NEU)

Preisanpassung in der Datenbank — vorher 9/29/99/299/1490 €, jetzt:

```
schnelltest      → €19
selbsttest       → €79
spiegel_360      → €199
teamcheck        → €399
saison_beratung  → €1.499
```

Defensiv: prüft erst, dass alle 5 slugs existieren (sonst ABORT mit
NOTICE), updated dann die Preise, verifiziert am Ende dass die Werte
gesetzt sind. Output beim Apply:

```
NOTICE:  [Migration 14] OK     schnelltest: 1900 cents (€19.00)
NOTICE:  [Migration 14] OK     selbsttest: 7900 cents (€79.00)
...
NOTICE:  [Migration 14] DONE — alle 5 Preise korrekt aktualisiert.
```

WICHTIG: Stripe Checkout zieht den Preis dynamisch aus der DB. Solange
diese Migration nicht angewendet ist, verkauft der Checkout zu den
ALTEN Preisen. Migration 14 ist nicht optional, sondern Voraussetzung
für den Verkauf zu den neuen Preisen.

### Frontend-Preise: 8 Stellen aktualisiert
**Files:**
- `app/admin/checklist/page.tsx` — Schnelltest-Hinweis
- `app/kontakt/contact-form.tsx` — alle 5 Dropdown-Optionen
- `app/kontakt/page.tsx` — teamcheck + saison_beratung Labels
- `app/archetyp/[slug]/page.tsx` — Selbsttest + Schnelltest
- `app/api/invitations/create/route.ts` — 360° Spiegel Fehler-Message
- `components/landing/final-cta.tsx` — „Einstieg ab 19 €"
- `components/landing/faq.tsx` — komplette Preisaufzählung
- `components/landing/mini-check.tsx` — Selbsttest-Upsell

`components/landing/products.tsx` und `app/dashboard/page.tsx` zeigen
dynamische Preise aus `p.price_cents` — die werden nach Migration 14
automatisch korrekt.

### Funnel-Fix: Landingpage → /checkout statt /signup
**Files:** `components/landing/products.tsx`, `components/landing/hero.tsx`

Vorher: alle Produktbuttons gingen auf `/signup?plan=<slug>` — für
bestehende eingeloggte Nutzer unnötiger Umweg.

Jetzt:
- Tier 1–3 → `/checkout/<slug>` direkt. Die Checkout-Route ist sauber
  programmiert: redirected unauthenticated User auf `/login?redirectTo=...`
  (bzw. von dort weiter zu /signup, wenn nötig), bei Erfolg direkt zu
  Stripe. Eingeloggte User springen ohne Zwischenseite zum Checkout.
- Tier 4–5 → `/kontakt?plan=<slug>` direkt (Anfrage-Workflow).

### Claim-Entschärfung: 5 Stellen
**Files:**
- `components/landing/footer.tsx` — „Diagnostik für Führung..." → „Coaching- und Reflexionssystem für Führung..."
- `components/landing/faq.tsx` Q5 — „Premium-Diagnostik" → „Premium-Coaching-Systeme"
- `components/landing/architecture.tsx` — „Diagnose, Interpretation, Hebel" → „Analyse, Interpretation, Hebel"
- `components/landing/ticker.tsx` — „1 klare Antwort" → „Eine Coaching-Sprache"
- `lib/pdf/report-document.tsx` — PDF-Cover „Premium Diagnostik" → „Premium Coaching-Analyse"
- `lib/ai/report-prompt.ts` — AI-Prompt erweitert um expliziten Hinweis:
  KEINE klinische Diagnostik, KEIN validierter Persönlichkeitstest;
  Aussagen als Coaching-Hypothesen, nicht als Diagnosen formulieren.

Erhalten geblieben (bewusst):
- Archetyp-Name „Der Analytische Diagnostiker" — Eigenname, nicht
  diagnostischer Claim.
- Legal-Disclaimer in `impressum/page.tsx` und `agb/page.tsx`, die
  EXPLIZIT sagen „keine psychologische oder medizinische Diagnose".
- FAQ-Antwort, die bereits richtig hedged („keine klinisch validierte
  Persönlichkeitsdiagnostik").

## v2.2 — Änderungen gegenüber v2.1

### Migration 13 defensiv gegen fehlende Funktionen
**File:** `supabase/migrations/13_private_raw_answers.sql`

Problem (real beim Apply aufgetreten): PostgreSQL's `REVOKE EXECUTE ON FUNCTION`
hat KEIN `IF EXISTS`. Wenn auch nur eine der fünf RPC-Funktionen in der
Ziel-Datenbank fehlt (z. B. weil Migration 05/06/07 nicht vollständig
angewendet wurden, oder weil sie später gedropped wurden), bricht die
gesamte Migration ab mit:

```
ERROR: 42883: function public.get_fremdbild_aggregate(uuid) does not exist
```

Fix: jede REVOKE/GRANT läuft jetzt in einem `DO $$ ... $$`-Block mit
`to_regprocedure()`-Check. Nicht-existierende Funktionen werden als NOTICE
gemeldet und übersprungen statt Abbruch. Der Policy-Verifikations-Block am
Ende bleibt scharf — die Anonymitäts-Lockdown-Logik selbst wird nicht
weicher.

Output beim Apply:

```
NOTICE:  [Migration 13] OK   — revoked & granted: <funktion>
NOTICE:  [Migration 13] SKIP — Funktion existiert nicht: <funktion>
NOTICE:  [Migration 13] Zusammenfassung: X Funktionen abgesichert, Y fehlten.
NOTICE:  [Migration 13] Policy-Verifikation OK
```

Wenn nach dem Apply SKIP-Meldungen auftauchen, prüfen ob die jeweilige
Funktion in der App wirklich gebraucht wird — falls ja, fehlende
Migrationen nachziehen.

## Verifikationsstatus + Build-Timing

### Verifikationsstatus (lokal vor Auslieferung, mit Dummy-ENV)

```
✓ npm install                  — successful
✓ npm run lint                 — 0 errors, 0 warnings
✓ npx tsc --noEmit             — 0 errors
✓ npm run build                — Compiled successfully, BUILD_ID written
                                 Gesamtdauer ~73 Sekunden (siehe Timing unten)
```

### Build-Timing-Referenz

Damit niemand ungeduldig abbricht: ein erfolgreicher Build auf einer
durchschnittlichen CI-VM braucht ~70-90 Sekunden gesamt. Die Schritte:

```
00:00  Start
00:52  Compiled successfully           (Webpack-Bundle fertig)
00:52  Collecting page data ...        (lädt Routen-Module)
00:58  Generating static pages (0/9)   (page-data step ~6s)
00:59  Generating static pages (9/9)   (statische Seiten fertig)
01:01  Collecting build traces ...     (NFT-Trace für Vercel-Bundle)
01:13  Done — .next/BUILD_ID written   (Traces ~12s)
```

Wenn der Build bei "Collecting page data" länger als 60 Sekunden hängt,
diagnostisch nachsehen:

```bash
npm run build:verbose
```

Das Script (neu hinzugefügt) prefixed jede Build-Zeile mit einem Timestamp,
sodass sichtbar wird, wo genau die Zeit verloren geht.

`npm audit --omit=dev` zeigt noch 1 moderate Issue in einem transitiven
`postcss` unterhalb von `next` (`<8.5.10`). Das ist KEIN direkter Dependency
und wird mit dem nächsten Next-Update automatisch behoben. Kein P0-Blocker.

## v2.1 — Änderungen gegenüber v2

### Result-Seite + Datenschutz: Text-Härtung Runde 2
**Files:** `app/assessment/[id]/result/page.tsx`, `app/legal/datenschutz/page.tsx`

Drei verbleibende zu starke Anonymitäts-Claims entschärft:

1. Result-Seite 360°-Block: „komplett anonym" → „anonymisiert und ausschließlich
   aggregiert ausgewertet; Einzelantworten sind für dich als Trainer nicht abrufbar".
2. Result-Seite TeamCheck-Block: „keine Einzelpersonen identifizierbar" →
   „Einzelantworten sind für dich nicht abrufbar".
3. Datenschutz §5 Speicherdauer: „Aggregierte Fremdbild- und Spieler-Antworten:
   Unbegrenzt, da anonymisiert" → ehrliche Variante:
   > Aggregierte Reports/Snapshots: solange der Account besteht.
   > Tokenbasierte Rohantworten: nur solange für Auswertung, Support und Missbrauchsschutz erforderlich.

### Build-Diagnose-Script
**File:** `package.json`

Neues Script `npm run build:verbose` — gibt jede Build-Zeile mit
HH:MM:SS-Timestamp aus. Hilft beim Identifizieren, ob ein „Hang" bei
„Collecting page data" wirklich ein Hang ist oder nur eine langsame Maschine.

## v2 — Änderungen gegenüber v1

### Build-Stall fix
**Files:** `next.config.js`, `package.json`

Problem: `next build` hängt auf einigen Maschinen bei "Checking validity of types"
— die in `next build` integrierte TypeScript-Prüfung kann auf Projekten mit
`@react-pdf/renderer` (sehr breite generische Typen) auf langsameren CPUs /
in Vercel-Build-Containern unbestimmt lange laufen.

Lösung: zweistufig:
1. `next.config.js` → `typescript.ignoreBuildErrors: true` — schaltet die
   redundante in-build Typprüfung ab.
2. `package.json` → `prebuild` Script ruft automatisch `tsc --noEmit` auf,
   BEVOR `next build` startet. Type-Errors blocken den Build also weiterhin
   zwingend, aber über den schnelleren standalone-tsc statt über den
   integrierten Next-Check.

Effekt: Build kompiliert in ~27 s statt unbestimmter Hang. Type-Sicherheit
bleibt erhalten — ohne grünen `tsc` läuft `npm run build` gar nicht erst los.

### Datenschutz-Texte v2 (zwei Stellen, die nach v1 noch zu stark waren)

**File:** `app/legal/datenschutz/page.tsx`

Intro-Absatz: „Anonyme Fremdeinschätzungen können wir technisch nicht auf
Einzelpersonen zurückführen" → ersetzt durch ehrliche Variante, die
anerkennt, dass `invitations.invited_email` administrativ existiert:

> Fremdeinschätzungen werden dem Trainer ausschließlich aggregiert angezeigt
> — Einzelantworten sind für Trainer nicht abrufbar. Zur sicheren Einladung
> und Zuordnung werden technische Einmal-Tokens verarbeitet; administrative
> Zugriffe auf Rohdaten sind technisch und organisatorisch beschränkt.

**File:** `app/einschaetzung/[token]/runner.tsx`

Onboarding-Bullet "Wir speichern keinen Namen, keine E-Mail" → ersetzt:

> Auf dieser Antwortseite fragen wir keinen Namen ab. Wenn du per E-Mail
> eingeladen wurdest, wird die Versandadresse getrennt zur Einladung
> verarbeitet — nicht zusammen mit deinen Antworten. {firstName} sieht
> keine einzelne Antwort, sondern nur aggregierte Ergebnisse ab
> Mindestanzahl.

## Eingangs-Hardening (v1, bleibt unverändert)

### 1) Security-Patched Dependencies
**File:** `package.json`
- `next`: `^15.0.3` → `^15.5.18`
- `@anthropic-ai/sdk`: `^0.90.0` → `^0.96.0`
- `postcss`: `^8.4.49` → `^8.5.14`
- `eslint-config-next`: `^15.0.3` → `^15.5.18`

### 2) Build hängt nicht mehr bei "Collecting page data"
**Files:** `app/page.tsx`, `app/kontakt/page.tsx`, `app/legal/{datenschutz,agb,impressum}/page.tsx`, `app/checkout/success/page.tsx`

Alle Seiten mit `TopNav` haben jetzt:
```ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

Die `TopNav`-Komponente liest die Supabase-Cookie-Session serverseitig — ohne diese
Direktiven versucht Next.js, die Seiten statisch zu rendern und hängt beim
Sammeln der Page-Data.

**Verifikation:** lokaler Build endet sauber mit Route-Tabelle und BUILD_ID.

### 3) Lint sauber
**Files:** `app/legal/agb/page.tsx`, `components/landing/hero.tsx`, `components/landing/how-it-works.tsx`, `components/landing/quote-break.tsx`, `components/landing/voices.tsx`, `components/top-nav.tsx`, `lib/pdf/report-document.tsx`

- 6× `react/no-unescaped-entities` gefixt (Anführungszeichen, Apostrophe → HTML-Entities)
- 3× `<a href="/#...">` → `<Link href="/#...">` in `top-nav.tsx`
- 2× `eslint-disable-next-line @typescript-eslint/no-require-imports` entfernt (Rule war nicht installiert)
- 1× unused `eslint-disable jsx-a11y/alt-text` entfernt

**Verifikation:** `npm run lint` läuft mit 0 Errors / 0 Warnings.

### 4) Rohantworten-Lockdown (Migration 13)
**File:** `supabase/migrations/13_private_raw_answers.sql` (NEU)

- Droppt `invitation_answers_select_owner` (war in `01_schema.sql:273`)
- Droppt `pulse_responses_owner_select` (war in `07_saison_monitor.sql:157`)
- Entzieht `execute` für `anon`/`authenticated`/`public` auf:
  - `get_fremdbild_aggregate(uuid)`
  - `get_teamcheck_aggregate(uuid)`
  - `compute_pulse_snapshot(uuid)`
  - `detect_pulse_trends(uuid, uuid)`
  - `get_items_for_invitation(text)`
- Gewährt `execute` exklusiv für `service_role`
- Eingebauter `DO $$ ... $$`-Block am Ende verifiziert: keine `SELECT`-Policy für `authenticated` mehr auf `invitation_answers`/`pulse_responses`.

**Code-Audit ergab:** Alle drei Token-Runner (`einschaetzung`, `teamcheck`, `pulse`)
nutzen `createAdminClient()` (Service Role) serverseitig. Die Migration ist
sicher anwendbar und bricht keine Funktionalität.

### 5) Complete-Endpoint vollständig
**File:** `app/api/invitations/[token]/complete/route.ts`

Neu: Lädt erwartete Items über `get_items_for_invitation` RPC und vergleicht
`submitted < expected`. Abschluss nur bei vollständiger Beantwortung. Response
enthält `expected`/`submitted` für Debugging.

### 6) Answer-API vollständig validiert
**File:** `app/api/invitations/[token]/answer/route.ts`

Neu:
- Lädt `invitation_type` zusätzlich
- Lädt Item mit `format, options, player_item`
- Spieler-Einladung verweigert Items ohne `player_item=true`
- 360°-Einladung verweigert Items mit `player_item=true`
- `likert_5`/`state`/`gap_wichtig`/`gap_gelebt`: Integer 1..5 zwingend
- `spannungsfeld`: Number 0..1 zwingend
- `forced_choice`/`szenario`/`dilemma`/`ranking`: `value_choice` MUSS in `item.options[].key` enthalten sein
- Felder werden vor dem Insert normalisiert (alle anderen Werte → `null`)

### 7) Pulse-Submit vollständig
**File:** `app/api/pulse/[token]/submit/route.ts`

Lädt jetzt alle aktiven `pulse_items` und verlangt Set-Gleichheit zwischen
submitted und expected Items. Lehnt mit `400 Pulse incomplete` ab, wenn der
Cycle nicht vollständig ausgefüllt ist.

### 8) TeamCheck Anonymous-only Mode (Option A)
**Files:** `components/assessment/teamcheck-manager.tsx`, `app/api/invitations/bulk/route.ts`

- UI: kein E-Mail-Modus mehr. Nur noch anonyme Token-Links (mit Text: „Die App
  speichert keine Spieler-E-Mail-Adressen").
- API: `mode: 'emails'` wird explizit mit `400` abgelehnt, `emails`-Parameter
  wird ignoriert.
- Damit ist die Datenschutz-Aussage „keine Spieler-E-Mail wird gespeichert"
  jetzt technisch wahr.

### 9) Anonymitäts-Texte korrigiert
**Files:**
- `app/legal/datenschutz/page.tsx` (3 Stellen)
- `app/einschaetzung/[token]/runner.tsx` (1 Stelle)
- `app/pulse/[token]/runner.tsx` (1 Stelle)
- `components/landing/faq.tsx` (Q&A-Block neu formuliert)
- `lib/pdf/report-document.tsx` (2 Stellen: Datenbasis-Footer 360° + TeamCheck)

Pattern: „anonym" / „vollständig anonym" / „keine Daten" → „anonymisiert und
ausschließlich aggregiert ausgewertet · technischer Einmal-Token zur sicheren
Zuordnung".

## P1 — Zusätzlich eingearbeitet (über Original-Briefing hinaus)

### 10) Stripe-Webhook Race-Fix
**File:** `app/api/stripe/webhook/route.ts`

Bisher: SELECT-then-INSERT — konnte bei gleichzeitigen Webhook-Redeliveries
Waisen-Assessments erzeugen.

Neu: Purchase zuerst einfügen (UNIQUE-Constraint auf `stripe_session_id` als
atomare Idempotenz-Klammer). 23505 → 200 `already_processed`. Erst danach
Assessment anlegen und Purchase per Update verlinken. Damit kein Waisen-
Assessment mehr möglich.

## NICHT eingearbeitet (bewusst für später)

### Upstash/Redis Rate-Limit
`lib/utils/anon-api.ts` nutzt weiterhin In-Memory-Map pro Lambda-Instanz. Für
Presale-Pilot mit bekannten Kunden akzeptabel; vor breitem Verkauf an
Akademien/Clubs durch Upstash oder Vercel KV ersetzen. Siehe
`coachcheck_briefing_addendum.md`, Ergänzung 3.

### Error-Monitoring Scrubbing
Sentry/Logflare sind nicht angeschlossen. Wenn sie aktiviert werden, vorher
`beforeSend`-Hook zum Scrubbing von Tokens/Emails einbauen. Siehe Addendum
Ergänzung 6.

### Antwortqualitätsindex / Konfidenzscore
P1 aus Original-Briefing (Punkte 10/11). Nicht für Go-Live nötig, aber für
Premium-Wirkung empfohlen.

## Deployment-Reihenfolge (zwingend)

1. Code deployen (ohne Migration 13)
2. Vercel-Build grün abwarten
3. Migration 12 anwenden (falls noch nicht geschehen)
4. **Migration 13 anwenden** — der eingebaute DO-Block macht Verifikation
5. Smoke-Test laufen:
   - Direkter Roh-Select gegen `invitation_answers` mit anon-Key → muss 401/leer
   - Direkter Roh-Select gegen `pulse_responses` → muss 401/leer
   - Einen 360°-Token komplett ausfüllen → Report generieren → keine
     einzelnen Antworten im PDF, nur Aggregat
   - Webhook-Event in Stripe-Dashboard zweimal manuell „resenden" → nur EIN
     Assessment in der DB
6. ENV in Vercel verifizieren:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `RESEND_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_APP_URL=https://coachcheck.humatrix.cc`
   - `ADMIN_EMAILS`

## Eine Zeile für den Entwickler

> Die Anonymitäts-Aussage hält jetzt technisch. Wenn vor breitem Verkauf
> noch das Upstash-Rate-Limit nachgezogen wird, ist die Story komplett
> verkaufbar.
