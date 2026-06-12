# Pre-Sale Hardening Changes

Diese Änderungen adressieren die drei kritischsten Punkte aus dem
Pre-Sale-Audit: RLS-Sicherheit, Build-Stabilität, ehrliche Claims.
TypeScript-Check und Produktionsbuild laufen sauber durch.

## 1) RLS / Datenschutz

### Neue Migration: `supabase/migrations/12_rls_hardening.sql`

**Was sie macht:**
- Entfernt `invitations_anon_read_by_token` (`using (true)`)
- Entfernt `invitations_anon_update` (`using (true)`)
- Entfernt `invitation_answers_anon_insert`
- Entfernt `pulse_responses_anon_insert`
- Entfernt `pulse_invitations_anon_read` (`using (true)`)
- Ergänzt `answers_update_own` (war fehlend → Upsert konnte stillschweigend
  blocken, sobald ein Nutzer im Runner zurücksprang und eine Antwort änderte)

**Anwenden:**
```bash
supabase db push
# oder im Supabase Dashboard die Datei manuell ausführen
```

### Neue API-Routes (Service Role, alle Checks serverseitig)

```
POST /api/invitations/[token]/open       → markiert geöffnet (idempotent)
POST /api/invitations/[token]/answer     → speichert eine Antwort (Zod-validiert,
                                            prüft Tier-Zugehörigkeit des Items)
POST /api/invitations/[token]/complete   → schließt ab (verweigert wenn 0 Antworten)
POST /api/pulse/[token]/submit           → Pulse-Antworten bulk (Server bestimmt
                                            den aktiven Cycle, nicht der Client)
```

Geteilter Helper: `lib/utils/anon-api.ts`
- Token-Shape-Check (Länge 16–128, base64url-Zeichen)
- In-Memory Rate-Limit pro Token (gegen Massensubmits)
- Standard-JSON-Responses

### Runner umgestellt (kein Anon-Client mehr für token-basierte Writes)

- `app/einschaetzung/[token]/runner.tsx` → `fetch()` zu API-Routes
- `app/teamcheck/[token]/runner.tsx`     → `fetch()` zu API-Routes
- `app/pulse/[token]/runner.tsx`         → `fetch()` zu API-Routes
- Die Token-Pages reichen kein internes `invitationId` / `cycleId` mehr durch,
  weil der Token im Server-Endpoint Autorität ist.

**Effekt:** Browser kann gar nichts mehr direkt schreiben. Token, Expiry,
Status, Item-Validität, Rate-Limit werden alle im Backend geprüft.

## 2) Build-Stabilität

- `export const dynamic = 'force-dynamic'` + `export const runtime = 'nodejs'`
  in allen SSR-Pages, die Supabase / Cookies lesen, und allen API-Routes.
  Das fixt den `Collecting page data ...`-Hänger beim Build, weil Next.js
  nicht mehr versucht, diese Seiten statisch vorzurendern.
- `next.config.js`: `eslint.ignoreDuringBuilds = true` (TS bleibt scharf).
  Das entspricht dem Vorzustand — das alte `next lint` ohne `.eslintrc`
  hätte im CI ohnehin interaktiv geblockt.
- `package.json`: `next lint` (deprecated) → `eslint .`
- Neue Flat-Config: `eslint.config.mjs` (extends `next/core-web-vitals`)
- Neue Dev-Dep: `@eslint/eslintrc`

**Verifiziert:**
- `npx tsc --noEmit` → keine Errors
- `npx next build` → ✓ Compiled successfully in 6.1s

## 3) Ehrliche Claims

| Datei | Vorher | Nachher |
|---|---|---|
| `components/landing/hero.tsx:76` | "24 Seiten Report" | "7–18 Seiten Report" |
| `components/landing/how-it-works.tsx:11` | "24-seitiger Premium-Report auf Consulting-Niveau" | "Ausführlicher Premium-Report mit konkreten Entwicklungshebeln" |
| `components/landing/trust-band.tsx` | "Vom ersten Premium-Item bis zum 24-Seiten-Report" | "...zum ausführlichen Report" |
| `components/landing/trust-band.tsx` | "100% Anonyme Spielerbefragung — keine Namen, keine Daten" | "Anonymisierte Spieler-Aggregation ab 3 Antworten" |
| `components/landing/trust-band.tsx` | "Wissenschaftler × Trainer × Sportler" | "praxisnah, wissenschaftlich anschlussfähig" |
| `components/landing/footer.tsx:52` | "von Wissenschaftlern, Profi-Trainern und Sportlern" | "praxisnah aus der Arbeit mit Trainern, wissenschaftlich anschlussfähig an etablierte Modelle aus Sportpsychologie und Teamforschung" |
| `components/landing/faq.tsx` (Coaching-Frage) | "...objektiv sichtbar sind" | "...strukturiert sichtbar werden" |
| `components/landing/faq.tsx` (Wissenschaftlichkeit) | "psychometrisch deutlich valider als klassische Typen-Tests" | Ehrliche Formulierung: "wissenschaftlich anschlussfähig an etablierte Konstrukte ... laufend weiterentwickeltes Coaching- und Reflexionsmodell, keine klinisch validierte Persönlichkeitsdiagnostik" |
| `components/landing/faq.tsx` (Wer dahinter) | "international eingesetzt" | weggelassen |
| `components/landing/faq.tsx` (Anonymität) | "Ja. ... komplett anonym" | "anonym ... aggregiert ab Mindestanzahl (3 bei 360°, 5 bei TeamCheck/Pulse)" |
| `app/einschaetzung/[token]/runner.tsx` (Intro) | "100% anonym" | "Anonymisierte Auswertung" |
| `app/teamcheck/[token]/runner.tsx` (Intro) | "100% anonym" | "Anonymisierte Auswertung" |
| `app/api/invitations/send/route.ts` (Email) | "100% anonym" | "anonymisiert ausgewertet (ab mindestens 3 Einschätzungen)" |
| `components/assessment/invitations-manager.tsx` | "100% anonym" | "anonymisiert (ab 3 Einschätzungen)" |
| `supabase/migrations/11_product_metadata_honesty.sql` | "100% anonym" in product features | "anonymisiert ab 5 Antworten" |

## Was bewusst NICHT angefasst wurde

- 13 ESLint-Warnings im Bestandscode (no-explicit-any, no-unescaped-entities,
  no-html-link-for-pages). Sind keine Build-Blocker mehr, sollten aber im
  Refactoring nach und nach aufgeräumt werden. Liste via `npm run lint`.
- Die Honesty-Migration 11 ist eigentlich schon korrekt und überschreibt
  die `01_schema.sql`-Seeds zur Laufzeit. Migration 11 muss vor Migration 12
  laufen — die Reihenfolge der Dateinamen sorgt dafür automatisch.
- Inhaltliche Erweiterungen aus der Analyse (Konfidenz-Score, Antwortqualitäts-
  Index, Demo-Report, Coach-Card, B2B-Dashboard, Zertifizierungslogik) sind
  nicht in diesem Patch — das ist Produktentwicklung, kein Pre-Sale-Fix.

## Manueller Test (nach Deploy)

1. `supabase db push` (Migration 12 anwenden)
2. Trainer als User A: 360°-Einladung erstellen, Token kopieren
3. Im Inkognito-Browser: `/einschaetzung/[token]` öffnen
   - DevTools → Network: alle Submits gehen jetzt an `/api/invitations/[token]/...`,
     nicht mehr direkt an `rest/v1/invitations` oder `rest/v1/invitation_answers`
4. Selber Token, zweiter Versuch nach Complete → API antwortet mit `409 Invitation already completed`
5. Manipulierter Token (z. B. Anhängsel) → API antwortet mit `400 Invalid token` oder `404 Invitation not found`
6. Auf Supabase direkt mit Anon-Key `select * from invitation_answers` → leer / kein Zugriff

## Empfohlene nächste Schritte (Reihenfolge laut Analyse)

1. ✅ RLS / Datenschutz → erledigt in diesem Patch
2. ✅ Build stabil → erledigt
3. ✅ Landingpage ehrlich → erledigt
4. ⏭ Demo-Report + Screenshots auf Landingpage
5. ⏭ Konfidenz + Antwortqualitäts-Index im Scoring
6. ⏭ Club-Version als eigenes Produkt + Dashboard
7. ⏭ Validierungsplan sichtbar ("Validation in Progress")
