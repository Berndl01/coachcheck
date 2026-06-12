# HARDENING v3 — Sicherheit, Idempotenz, Compliance (2026-05-30)

Umsetzung der externen Audit-Empfehlungen (P0/P1), nach Gegenprüfung am echten
Code. Alles unten ist **typecheck-grün, lint-grün, claimcheck-grün und durch
Unit-Tests abgesichert** (`npm run ci`).

---

## Vor dem Deploy ausführen

1. **Migrationen** im Supabase SQL-Editor in Reihenfolge ausführen:
   - `18_report_jobs.sql`  (Report-Lock/Status)
   - `19_hardening.sql`    (Claim-Rename + stripe_events + admin_roles + Consent/Export/Deletion/Audit)
2. **Code deployen** (Vercel).
3. **ENV optional** (siehe `.env.local.example`): `UPSTASH_*` für persistenten
   Rate-Limit, `*_TURNSTILE_*` für Bot-Schutz, `ANTHROPIC_REPORT_MODEL` für
   Modellwechsel. Ohne diese läuft die App weiter (sichere Fallbacks).
4. **Erster Admin**: greift via `ADMIN_EMAILS` (Fallback). Für DB-Rollen eine
   Zeile in `admin_roles` anlegen.

---

## Was umgesetzt wurde

### P0 — vor öffentlichem Verkauf
- **Report-Statusmodell korrigiert**: `finalize` setzt jetzt `completed`
  (Scores fertig), `report_ready` erst nach erfolgreichem PDF-Upload.
- **Report-Idempotenz**: `report_jobs`-Tabelle + Partial-Unique-Index als
  atomarer Lock. Mehrfachklick/Reload löst KEINEN zweiten teuren KI-/PDF-/
  E-Mail-Lauf aus. Fertiger Report wird wiederverwendet; aktiver Lauf → `409`
  und das Frontend pollt (`/report-status`). Jeder Fehlerpfad gibt den Lock frei.
- **Persistenter Rate-Limit** (`lib/utils/rate-limit.ts`): Upstash-REST mit
  automatischem In-Memory-Fallback; verdrahtet in alle Token-Routes,
  Report-Route und Kontaktformular.
- **Kontakt-Bot-Schutz**: Honeypot (immer aktiv) + Cloudflare Turnstile
  (ENV-gated) + IP-Rate-Limit.
- **Security-Header** (`next.config.js`): CSP, HSTS, X-Frame-Options=DENY,
  nosniff, Referrer-Policy, Permissions-Policy.
- **Stripe-Event-Log** (`stripe_events`): Idempotenz über ALLE Event-Typen,
  zusätzlich zur bestehenden session_id-Klammer.
- **Claim-Cleanup**: Archetyp-Anzeigename „Diagnostiker" → „Strukturgeber"
  (Code/Slug stabil), statische „diagnostisch"-Marketing-/Legal-Texte
  bereinigt. **`npm run claimcheck`** ist als prebuild-Gate verdrahtet
  (negation-aware, scannt Marketing + Legal).

### P1 — professioneller Betrieb
- **DSGVO-MVP**: Tabellen `consent_records`, `data_exports`,
  `deletion_requests`, `audit_logs`. Routen `/api/account/export` (Art. 15/20)
  und `/api/account/delete` (Art. 17). Self-Service-Seite `/konto/daten`
  (Dashboard-Link, middleware-geschützt). Audit-/Consent-Helper.
- **Admin-Rollen DB-gestützt** (`admin_roles` + `isAdminUser`), ENV-Fallback.
- **Modell per ENV** (`ANTHROPIC_REPORT_MODEL`) — sauberer Wechsel auf Opus 4.8.
- **Tests** (Vitest): Scoring (inkl. Neutral-Coach-Regression), Claim-Guard,
  Rate-Limit. `npm test` / `npm run ci`.

---

## Bewusst NICHT in diesem Pass (ehrliche Roadmap)

Diese Punkte sind echte Mehr-Wochen-Vorhaben und werden NICHT vorgetäuscht:

- **P2 — Echte Mandantenfähigkeit (Club-OS)**: `organizations`/`teams`/
  `roles`/`memberships`, `organization_id` auf allen sensiblen Tabellen,
  rollenbasierte RLS, Club-/Coach-/Spieler-/Sportpsychologe-Dashboards.
  → Das `audit_logs.organization_id`-Feld ist als Naht bereits vorhanden.
- **Async-Report-Worker** (QStash/Inngest/Supabase Queue): Generierung läuft
  weiterhin synchron, ist aber idempotent und über `report_jobs` bereits
  worker-fähig vorbereitet. Poll-Endpoint existiert.
- **Live-E2E-Tests** (Playwright gegen echten Stack): braucht laufende
  Supabase-/Stripe-Testumgebung.
- **Wissenschaftliches Validierungslabor** (P3): Reliabilität, Itemstatistik,
  Normgruppen, Konfidenz-/Datenqualitätsflags im Report.
- **Admin-Operations-Dashboard-UI**: Daten-/Rollen-Fundament steht; die volle
  Betriebs-Oberfläche (Retry, Refund, Supportfälle) ist noch zu bauen.
- **CSP-Härtung** auf Nonce-Basis statt `unsafe-inline` (Next.js-Constraint).

---

## Status der Quality-Gates

```
npm run typecheck   → 0 Fehler
npm run claimcheck  → 22 Dateien, 0 riskante Claims
npm test            → 23/23 Tests grün
npm run lint        → 0 Fehler (geänderte/neue Dateien)
```

---

# HARDENING v3.1 — Antwortqualität & KI-Härtung (2026-05-30)

Setzt zwei weitere 10/10-Blöcke aus der Audit-Spec um (#6 und #8).

## Migration (nach 19)
`20_response_quality.sql` — `assessments.response_quality jsonb`,
`reports.prompt_version`, `reports.ai_fallback` (alles additiv/idempotent;
`prompt_tokens`/`completion_tokens` existierten bereits).

## #6 — Antwortqualität / Datenqualität
- `lib/insight/response-quality.ts`: reine, getestete Engine. Flags
  `too_fast`, `straightlining`, `excessive_middle_answers`,
  `inconsistent_reverse_items`, `low_completion_quality` — **rein
  serverseitig aus vorhandenen Antwortdaten + Ausfülldauer**, keine
  Frontend-Änderung nötig.
- Ableitung `dataQuality` (gut / eingeschränkt / nicht interpretierbar) +
  `confidence` (hoch / mittel / niedrig).
- `finalize` berechnet & speichert das beim Abschluss.
- Wirkt zweifach im Report: (a) der **Prompt** hedged bei schlechter Qualität
  explizit, (b) ein **PDF-Callout** auf der Executive-Summary-Seite zeigt
  „Datenqualität · Konfidenz" an (nur wenn nicht „gut").
- Akzeptanzkriterium erfüllt: Wer 80 Fragen in ~90 Sek „durchklickt", bekommt
  `nicht_interpretierbar` + niedrige Konfidenz statt eines präzise wirkenden
  Premium-Reports.

## #8 — KI-Schicht gehärtet
- **Retry** bei transienten Fehlern (429/5xx/Timeout/overloaded), Backoff.
- **JSON-Schema-Validierung** der KI-Antwort (`validateReportOutput`) — bei
  fehlenden Pflichtfeldern Retry.
- **Fallback-Report ohne KI** (`buildFallbackReport`): claim-sicher, valide,
  klar als reduziert markiert → ein KI-Ausfall zerstört den Userflow nicht.
- **Prompt-Versionierung** (`PROMPT_VERSION`) + **Token-/Kosten-Logging**
  (`prompt_tokens`/`completion_tokens`/`prompt_version`/`ai_fallback` am
  Report) für späteres Kosten-Monitoring.
- **Modell per ENV** (`ANTHROPIC_REPORT_MODEL`) bleibt aktiv.

## Tests
`tests/response-quality.test.ts`, `tests/report-validate.test.ts` — Flags,
Datenqualitätsbänder, Schema-Validierung, Fallback-Validität.

## Gates v3.1
```
typecheck → 0 · claimcheck → 0 · tests → 23/23 · lint → 0
```

## Weiterhin bewusst Roadmap (unverändert, nicht vorgetäuscht)
Echte Mandantenfähigkeit (P2), Validierungslabor mit Reliabilität/Normgruppen
(P3), volles Admin-Ops-Dashboard-UI, Sentry/Monitoring, Playwright-E2E,
Nonce-basierte CSP.
