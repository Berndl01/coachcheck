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

# CoachCheck Assessment

Premium-Assessment-System für Sport-Trainer. Wissenschaftlich fundiertes Analyse-Modell mit 12 Archetypen, 7 Modulen, 6 Kernachsen.

**Stack:** Next.js 15 · Supabase · Stripe · Resend · Claude API · React-PDF

---

## ⚡ Quick Start

### 1. Dependencies
```bash
npm install
```

### 2. Environment
```bash
cp .env.local.example .env.local
```
Eintragen:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase → Settings → API → `anon public`
- `SUPABASE_SERVICE_ROLE_KEY` → selbe Seite → `service_role`
- Stripe-Keys (Test-Mode ok)

### 3. Supabase-Migrationen (Dashboard → SQL Editor)
Der Reihe nach ausführen:
1. `supabase/migrations/01_schema.sql` — Tabellen, RLS, Produkte
2. `supabase/migrations/02_archetypes_seed.sql` — 12 Archetypen
3. `supabase/migrations/03_item_pool.sql` — 55+ Premium-Items

Check:
- `products` (5), `archetypes` (12), `items` (55+)

### 4. Dev Server
```bash
npm run dev
```

---

## 🧪 Assessment testen ohne Stripe (DEV)

Einmal im Browser eingeloggt, dann diese URL aufrufen:

```
http://localhost:3000/api/dev/create-assessment?slug=selbsttest
```

→ legt ein leeres Assessment an und leitet direkt zur Assessment-UI weiter.

Slug-Optionen: `schnelltest`, `selbsttest`, `spiegel_360`, `teamcheck`.

---

## 📋 Phasen-Roadmap

- [x] **Phase 1** — Auth, Schema, Stripe Checkout, Dashboard
- [x] **Phase 2** — Komplette Landingpage (14 Sections)
- [x] **Phase 3** — Item-Pool + Assessment-UI + Scoring-Engine + Ergebnis-Seite
  - Premium-Item-Pool über 7 Module, 8 Formate (in `15_item_pool_expansion.sql` erweitert)
  - Item-Renderer für alle Formate (Likert, Forced Choice, Spannungsfeld, Szenario, Dilemma, Gap, State, Ranking)
  - Scoring-Engine: Axis-Berechnung + Euclidean Distance für Archetyp-Match
  - Finalize-API: wertet aus, speichert Primär- + Sekundärtyp + Signatur
  - Result-Page mit Archetyp, Kernachsen-Profil, Stärken/Risiken/Hebel
- [x] **Phase 4** — Report-Generator (Claude API + React-PDF, inkl. grafischer Matrizen)
- [x] **Phase 5** — 360° Spiegel: Fremdbild-Einladungen mit Token
- [x] **Phase 6** — TeamCheck: Spieler-Token-Flow
- [x] **Phase 7** — Saison-Monitor / Pulse
- [x] **Phase 8** — Admin-Checklist + Premium-Intelligence-Layer
- [~] **Go-Live-Härtung** — Sicherheit/RLS, DSGVO-MVP, Report-Idempotenz, Claim-Guard, Antwortqualität (laufend; Stand & offene Punkte in `GO-LIVE.md`)

---

## 🏗️ Struktur (Phase 3)

```
app/
  page.tsx                          Landingpage (14 Sections)
  signup/  login/  dashboard/       Auth + User-Hub
  assessment/[id]/page.tsx          Runner (Item-UI)
  assessment/[id]/result/page.tsx   Ergebnis mit Archetyp + Signatur
  checkout/[slug]/                  Stripe init
  api/stripe/webhook/               Erzeugt Assessment nach Kauf
  api/assessment/[id]/finalize/     Scoring-Engine-Endpoint
  api/dev/create-assessment/        DEV: Bypass Stripe

components/
  landing/                          14 Landingpage-Sections
  assessment/
    item-renderer.tsx               Dispatcht zu Format-Component
    runner.tsx                      Fortschritt, Speichern, Navigation
  logo.tsx  top-nav.tsx

lib/
  supabase/client.ts / server.ts / admin.ts
  scoring.ts                        Kern-Algorithmus
  types.ts

supabase/migrations/
  01_schema.sql                     Tabellen + RLS + Produkte
  02_archetypes_seed.sql            12 Archetypen mit Axis-Profilen
  03_item_pool.sql                  55+ Items + RPC-Function
```

---

## 🎯 Scoring-Logik (kurz)

**Pro Antwort** werden die 6 Kernachsen gewichtet:
- Likert 1–5 → signed −1..+1 (3 = neutral)
- Forced Choice / Szenario / Dilemma → die Weights der gewählten Option werden mit +1 skaliert
- Spannungsfeld → Position 0..1 → −1..+1
- Gap-Fragen: wichtig + gelebt werden als zwei Items gescort, Differenz fließt später in den Report

**Am Ende:**
- Weighted Average pro Achse → 0.0..1.0
- Euclidean Distance zu allen 12 Archetypen
- Closest Match = **Primärer Typ**
- Second Closest = **Sekundärer Typ**
- Signature = Label + Intensität pro Achse

---

## 🚀 Deployment (Vercel)

```bash
npx vercel
```
Env-Variablen in Vercel Settings duplizieren, Custom Domain `coach.humatrix.cc` konfigurieren.

---

## 📝 Report-Generator (implementiert)

> **Status:** umgesetzt — Claude API + React-PDF, inkl. 360°-/TeamCheck-/Saison-Abschnitten und grafischen Positionsmatrizen. Report-Modell per `ANTHROPIC_REPORT_MODEL` (Empfehlung: `claude-opus-4-8`). Aktueller Fokus: Go-Live-Härtung & kontrollierter Pilot — Details, Migrations-Reihenfolge und offene Punkte in **`GO-LIVE.md`**.

Der Premium-Report pro Paket:
- Claude API generiert personalisierte Interpretationstexte pro Modul
- React-PDF rendert das Ergebnis als edles Dokument
- Gespeichert in Supabase Storage
- Download-Link an User via Resend-Mail

---

## 🔴 Go-Live Pflichtchecks nach Fix 10

1. **Alle Migrationen ausführen**
   - Wichtig: nicht nur 01-03, sondern `01_schema.sql` bis `10_context_schema_repair.sql`.
   - Migration 10 behebt fehlende Premium-Kontextfelder und leert den Supabase/PostgREST Schema-Cache.

2. **Storage Bucket prüfen**
   - Supabase Storage Bucket `reports` muss existieren und privat sein.
   - Falls PDFs beim Speichern fehlschlagen: Migration `04_storage_bucket.sql` erneut ausführen.

3. **PDF-Report Voraussetzungen**
   - `ANTHROPIC_API_KEY` muss gesetzt sein.
   - `SUPABASE_SERVICE_ROLE_KEY` muss gesetzt sein.
   - `NEXT_PUBLIC_APP_URL` muss auf die echte Domain zeigen.

4. **E-Mail über Resend**
   - App-Mails laufen über `RESEND_API_KEY` und `RESEND_FROM_EMAIL`.
   - Signup-Bestätigung und Passwort-Reset kommen von Supabase Auth. Damit auch diese über Resend laufen, Resend in Supabase unter Authentication → SMTP als SMTP-Anbieter eintragen.

5. **Stripe Webhook**
   - Endpoint: `/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - Webhook-Secret als `STRIPE_WEBHOOK_SECRET` setzen.
   - Der Webhook ist idempotent; doppelte Stripe-Zustellungen erzeugen kein zweites Assessment mehr.
