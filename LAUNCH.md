# CoachCheck — LAUNCH

**Das eine, verbindliche Dokument: von „jetzt" bis „verkaufen".**
Es bündelt für den Start, was in `GO-LIVE.md` über viele Versions-Notizen verstreut ist.

Stand: **v3.73** · Migrationen **01 → 48**, alle 7 Gates sauber
(tsc · claimcheck · vitest · eslint · build · npm audit 0 · PDF 4/4).

---

## 0 · Was fertig ist (durch Gates bewiesen, nicht behauptet)

- **Release 0 — Sicherheit/Verkaufbarkeit:** Entitlement-Gate über alle Einladungsrouten,
  Refund-/Dispute-Kaskade (entzieht Report, Einladungen, Share), Saison-Zugriffssperre,
  ≥5-Anonymitäts-Gate, Live-Response-Count. Alle vier P0-Blocker geschlossen.
- **Release 1 — der „Das bin ich"-Moment:** Mischprofile, Treffer-Feedback (0–10),
  gestaffelte 5-Bildschirm-Enthüllung, Coach-Card mit Zweittendenz. Konsistent über
  Ergebnis · PDF · Karte. Deterministisch (funktioniert sofort, ohne KI-Wartezeit).
- **Release 2 — der Aktionsbereich:** 7-Tage-Fokus setzen → täglicher Check-in + Streak
  → Abschluss-Würdigung + Historie. Der Bogen *verstehen → umsetzen → dranbleiben → abschließen*.

Der Code der drei Self-Service-Stufen (Schnelltest €19 · Coach-Profil €79 · 360° €199)
ist startklar. Was jetzt folgt, ist **Betrieb und Recht — nicht Code.**

---

## 1 · Der Weg zum Verkauf — in genau dieser Reihenfolge

### Schritt 1 — Supabase (Datenbank)
1. Projekt in Region **Frankfurt** nutzen/anlegen.
2. Migrationen **01 → 48 in Reihenfolge** anwenden (SQL-Editor oder `supabase db push`,
   Datei für Datei aufsteigend).
   - **Wichtig:** Die Migrationen sind selbstheilend/idempotent. Migration 39 enthält einen
     Dedup-Block *vor* einem Unique-Index — bei einer Bestandsdatenbank zuerst diese
     Migration sauber durchlaufen lassen.
3. **Verifikation:** Jede Migration endet mit `raise notice '... OK'`. Läuft eine durch
   ohne Exception, ist sie korrekt angewendet. Die neuen Tabellen müssen existieren:
   `result_feedback`, `action_plans`, `action_checkins`, `release_contract` (Migration 45).
   Migration 46 ergänzt `profiles.timezone`, den Ergebnis-Snapshot auf `assessments`,
   und Migration 47 spiegelt den vollständigen Item-Vertrag in `coachcheck_release_integrity()`; Migration 48 korrigiert dort die fälschliche `product_items`-Abfrage zurück auf `items.package_tiers` und führt die Integritätsprüfung während der Migration WIRKLICH aus (schema_version 48)
   und die Funktion `finalize_report_atomic`.
4. **Readiness-Preflight (Release-Vertrag):** Nach den Migrationen einmal
   `PREFLIGHT_BASE_URL=<deine-URL> CRON_SECRET=<secret> node scripts/preflight-release.mjs`
   ausführen. Exit 0 / HTTP 200 = das deployte Modell entspricht dem Vertrag
   (Module, Spannungsfeld-Pole, Itemzahlen, Archetypen). Bei Exit 1 die gemeldeten
   Punkte beheben, BEVOR der Fragebogen freigeschaltet wird.

### Schritt 2 — ENV-Variablen
Vollständige, kommentierte Liste in **`.env.local.example`** (inkl. SPF/DKIM/DMARC- und
Supabase-SMTP-Anleitung). Pflicht in Vercel **und** lokal:

| Gruppe | Variablen |
| --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Anthropic | `ANTHROPIC_API_KEY` (optional `ANTHROPIC_REPORT_MODEL`) |
| Resend | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO` |
| Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Upstash (Rate-Limit) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| App | `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAILS`, `KONTAKT_EMAIL`, `INVOICE_VAT_NOTE` |

> **`CRON_SECRET` ist zwingend erforderlich.** `vercel.json` definiert drei produktive Cron-Jobs,
> die ohne `CRON_SECRET` mit HTTP 503 antworten. Betroffene Prozesse:
> - `/api/internal/reminders` — Fortschritts- und Erinnerungsmails
> - `/api/internal/confirmation-retry` — Retry fehlgeschlagener Vertragsbestätigungen
> - `/api/internal/withdrawal-retry` — Retry fehlgeschlagener Widerrufsbestätigungen
>
> Smoke-Test nach Deploy (keine Route darf 401/503 liefern):
> `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/internal/confirmation-retry`

### Schritt 3 — Stripe
1. Live-Keys in die ENV (Schritt 2). Test- und Live-Keys nie mischen.
2. Das Produktkatalog-Gerüst kommt aus den Migrationen (`products`-Tabelle). Lege in Stripe
   die passenden Produkte/Preise für die drei Self-Service-Stufen an und stelle sicher, dass
   die Beträge mit der DB übereinstimmen (**„beworben = geliefert"** gilt auch für Preise).
3. **Webhook-Endpoint:** `https://<deine-domain>/api/stripe/webhook`
4. **Diese Events abonnieren** (genau diese drei werden behandelt):
   `checkout.session.completed`, `charge.refunded`, `charge.dispute.created`
5. Webhook-Signing-Secret → `STRIPE_WEBHOOK_SECRET`.

### Schritt 4 — Resend (E-Mail)
- Domain `humatrix.cc` in Resend **verified** (SPF/DKIM/DMARC stehen bei dir).
  API-Key → `RESEND_API_KEY`, From/Reply setzen.
- Supabase-Auth-Mails (Signup/Reset) laut `.env.local.example` über Resend-SMTP routen.
- Vor Live-Tests: Domain-Status grün, sonst Fallback `onboarding@resend.dev` (sendet nur an
  den Account-Owner).

### Schritt 5 — Vercel-Deploy
- Repo verbinden, alle ENV aus Schritt 2 setzen, deployen.
- `NEXT_PUBLIC_APP_URL` auf die echte Domain setzen (Redirects/Links/Webhook-URLs hängen daran).

### Schritt 6 — Live-Smoke-Test (echte Keys, ~20 Min)
Diese Klick-Strecke **einmal vollständig** mit echten Keys durchspielen:
1. Registrieren + Profil vervollständigen (Auth-Mail kommt an).
2. **Schnelltest (€19) kaufen** → echten Stripe-Checkout durchlaufen.
3. Assessment ausfüllen → Ergebnis öffnen: **gestaffelte Enthüllung** erscheint (5 Bildschirme).
4. **PDF generieren** und öffnen (lädt, keine Fehlerseite).
5. **7-Tage-Fokus setzen** → Dashboard zeigt ihn → **Check-in** machen (Fortschritt/Streak).
6. **Treffer-Feedback** (0–10) abgeben.
7. **Refund-Pfad:** In Stripe die Zahlung erstatten → erneut Ergebnis/Report/Share öffnen →
   muss **„Zugriff gesperrt"** zeigen. Das beweist die Kaskade live.

### Schritt 7 — Live-Stripe/Supabase-E2E-Refund-Test
Die E2E-Tests sind **echte, env-gated Tests** (`test.skip`, wenn `PLAYWRIGHT_BASE_URL` /
`E2E_EMAIL` / `E2E_PASSWORD` / `E2E_ASSESSMENT_ID` fehlen) — kein `test.fixme` mehr.
Der verbindliche Release-Lauf ist `npm run release:verify`
(`ci` + `preflight` + `test:e2e:release` → `tests/e2e/release-flow.spec.ts`). Er fährt
Login → bezahltes Assessment → alle Items (variabel) → Ergebnis → Report; der Stripe-
Checkout-/Webhook-/Refund-Teil braucht zusätzlich Stripe-Test-Infrastruktur und einen
optionalen `E2E_REFUND_URL`-Hook. Einmal gegen die echte Umgebung ausführen — das ist der
Beweis, den ich von hier aus nicht führen kann.

---

## 2 · RECHTS-GATE (vor breitem Marketing) — deine Anwältin/dein Anwalt

Vor öffentlichem Verkauf zwingend anwaltlich bestätigen lassen:
- **FAGG:** Widerrufsbelehrung und Wertersatz/Erlöschen des Widerrufsrechts bei *sofort
  erbrachter digitaler Leistung* (Ergebnis/Report). Die ausdrückliche Zustimmung wird im
  Kaufprozess erfasst — die **juristische Formulierung** gehört geprüft.
- **AGB, Datenschutzerklärung.**
- **Auftragsverarbeitungsverträge (AVV)** mit allen Verarbeitern: Supabase, Stripe, Resend,
  Anthropic, Upstash, Cloudflare.

> Hierzu treffe ich **keine** Aussage. Die *Mechanik* (Consent-Erfassung, Sperr-Kaskade,
> Datentrennung) ist gebaut und getestet; die *rechtliche Hinlänglichkeit* ist anwaltlich zu
> bestätigen. Das ist kein Code-Thema und bewusst offen.

---

## 3 · „Du bist live"-Definition

Alle **Schritte 1–7 grün** **und** Rechts-Gate (Abschnitt 2) freigegeben →
du kannst die drei Self-Service-Stufen öffentlich verkaufen.

TeamCheck (€890) und Saison (€3.900) sind ohnehin **kontakt-/anfragebasiert** mit deiner
persönlichen Beteiligung — sie brauchen für den Start keinen Self-Service-Fluss.

---

## 4 · Was NICHT für den Start nötig ist (kein Blocker)

Bewusst nicht gebaut bzw. nach dem Start sinnvoll — keiner dieser Punkte hält dich auf:
- **Nudges** (Erinnerungs-Mails) — berührt genau die Consent-Fragen aus Abschnitt 2; nach
  Rechts-Signoff nachrüstbar.
- **Releases 3–5** aus dem Bestcase (Upgrade-System, Referral, Vereine/Rollen …).
- **§27-Produkt-Analytics** + Admin-Metrik-Oberfläche (die Daten werden bereits erfasst).
- **§16-Erweiterungen** der Coach Card (Foto/Freistellung, QR, granulare Toggles).
- **PlayerCheck-Härtung** (separate Codebasis, noch nicht auf CoachCheck-Niveau).

---

## 5 · Wenn etwas hakt

- **Bezahlt, aber kein Zugriff / Report fehlt:** Admin-Monitor unter `/admin/monitor`
  (für `ADMIN_EMAILS`) listet Problemfälle (fehlgeschlagene Jobs, „bezahlt ohne Assessment"
  usw.).
- **Mails kommen nicht an:** Resend-Domain-Status prüfen (Schritt 4); mit
  mail-tester.com Score ≥ 9/10 anstreben.
- **Migrationen unvollständig:** meist fehlt `SUPABASE_SERVICE_ROLE_KEY` oder eine Migration
  wurde übersprungen — Reihenfolge 01 → 46 prüfen.
