# Humatrix Coach Assessment

Premium-Assessment-System für Sport-Trainer. Hybrides Diagnostik-Modell mit 12 Archetypen, 6 Modulen, 6 Kernachsen.

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
  - 55+ Premium-Items über 7 Module, 8 Formate
  - Item-Renderer für alle Formate (Likert, Forced Choice, Spannungsfeld, Szenario, Dilemma, Gap, State, Ranking)
  - Scoring-Engine: Axis-Berechnung + Euclidean Distance für Archetyp-Match
  - Finalize-API: wertet aus, speichert Primär- + Sekundärtyp + Signatur
  - Result-Page mit Archetyp, Kernachsen-Profil, Stärken/Risiken/Hebel
- [ ] **Phase 4** — Report-Generator (Claude API + React-PDF, 18–24 Seiten)
- [ ] **Phase 5** — 360° Spiegel: Fremdbild-Einladungen mit Token
- [ ] **Phase 6** — TeamCheck: Spieler-Token-Flow
- [ ] **Phase 7** — Saison-Monitor
- [ ] **Phase 8** — Admin-Interface

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

## 📝 Next: Phase 4 — Report Generator

Der 24-seitige Premium-Report pro Paket:
- Claude API generiert personalisierte Interpretationstexte pro Modul
- React-PDF rendert das Ergebnis als edles Dokument
- Gespeichert in Supabase Storage
- Download-Link an User via Resend-Mail
