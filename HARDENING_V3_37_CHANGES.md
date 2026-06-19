# HARDENING v3_37 — Aktivierungssperre geschlossen (echter Blocker aus v3_36-Audit)

Das v3_36-Audit fand einen **realen, neuen Bug**, den frühere Reviews übersahen:
Die Vertragsbestätigungs-Sperre war nur auf der E-Mail-/Zahlungs-Ebene scharf —
die Assessment-APIs und die Item-RPC prüften die Freischaltung NICHT. Ein
eingeloggter Käufer konnte die Sperre per direktem API-Aufruf umgehen. Plus zwei
weitere reale Punkte und mehrere Härtungen. Alle hier geschlossen.

Alle Gates grün: tsc · claimcheck (58) · **vitest 176/176** (v3_36: 161 → +15) ·
eslint · next build (9/9 Seiten, kein Hang) · npm audit 0 · PDF-Volltest.

---

## Blocker 1 · Aktivierungssperre jetzt in JEDER Schicht (war umgehbar)

**Vorher:** `answer/route.ts` blockierte nur `completed/report_ready/archived`;
`awaiting_contract_confirmation` lief durch und die Route setzte den Status selbst
auf `in_progress`. `finalize`/`context` prüften gar nicht. `get_items_for_assessment`
filterte nur nach Eigentümer, nicht nach Freischaltung. → Käufer konnte den
Fragebogen vor Vertragsbestätigung ziehen und ausfüllen.

**Jetzt — Sperre auf zwei Ebenen:**
- `lib/assessment/activation-gate.ts` (NEU) — `isAssessmentActivated(status)`:
  aktiv nur `pending`/`in_progress`.
- `app/api/assessment/[id]/answer|finalize|context/route.ts` — jede Route lehnt
  nicht-freigeschaltete Assessments mit **409 `assessment not activated`** ab
  (insbesondere `awaiting_contract_confirmation`).
- `supabase/migrations/36_*.sql`:
  - `get_items_for_assessment()` zusätzlich `and a.status in ('pending','in_progress')`
    → kein Fragebogen vor Freischaltung.
  - **Contract-Gate-Trigger** `trg_enforce_contract_gate`: ein Assessment darf
    `awaiting_contract_confirmation` NUR verlassen, wenn die Finalisierung das
    transaktionslokale Flag `app.finalizing='1'` gesetzt hat. Selbst wenn künftig
    eine Route den Check vergisst, blockiert die DB. Einzige Autorität für die
    Freischaltung bleibt `finalize_order_confirmation()`.

Glücklicher Pfad bleibt intakt: `pending→in_progress→completed→report_ready` läuft
(Trigger greift nur bei `awaiting→*` ohne Flag).

## Blocker 2 · Stripe-Link-Fehler sperrt keinen zahlenden Kunden mehr aus

**Vorher:** Webhook legte Purchase + Assessment an, verlinkte dann
`purchases.assessment_id`. Bei Link-Fehler nur `console.error`; Event wurde
`processed`; der Retry übersprang `assessment_id = null`; ein erneuter
Assessment-Insert krachte am Unique-Index → Endlos-500 → Kunde dauerhaft ohne
Produkt.

**Jetzt:**
- `app/api/stripe/webhook/route.ts` — vor dem Insert wird nach einem **bereits
  vorhandenen Assessment für diese `purchase_id`** gesucht und wiederverwendet
  (kein Unique-Index-Crash mehr). Schlägt die Verknüpfung fehl, gibt der Webhook
  **HTTP 500** zurück → Stripe stellt erneut zu → nächster Lauf findet das
  Assessment und repariert die Verknüpfung.
- `app/api/internal/confirmation-retry/route.ts` — neuer Selbstheilungs-Schritt:
  bezahlte Käufe mit `assessment_id = null` werden über `purchase_id` relinkt
  (`relinked`-Zähler). Die awaiting→pending-Reparatur läuft jetzt
  **ausschließlich über `finalize_order_confirmation`** (Trigger-konform). Plus
  einmalige Betreiber-**Eskalation** nach Erreichen des Versuchslimits.

## Härtung · finalize_order_confirmation()

**Vorher:** prüfte weder, ob der Kauf existiert, ob das Assessment zum Kauf
gehört, noch die betroffene Zeilenzahl.

**Jetzt (Migration 36, `create or replace`):** verifiziert die Zuordnung
Purchase↔Assessment (`v_belongs`); gehört das Assessment nicht zum Kauf →
**Exception** (kein „bestätigt", obwohl nichts freigeschaltet wurde). Setzt das
Freigabe-Flag für den Trigger. Freischaltung bleibt idempotent/race-sicher.

## Härtung · Snapshot-Persistenz, Consent, AGB-Aussage

- **Snapshot:** `lib/email/order-confirmation.ts` prüft jetzt den Speicher-Fehler
  des nachweisrelevanten `contract_snapshot`. Schlägt er fehl, wird **nicht
  versendet und nicht freigeschaltet** (Fehler protokolliert, Retry zieht nach).
- **Consent-Validierung:** zusätzlich „Version zwingend vorhanden" und „keine
  Duplikate je Typ"; DB-seitig per Unique-Index
  `consent_checkout_type_unique (user_id, checkout_attempt_id, consent_type)`.
- **AGB-Aussage korrigiert (Ehrlichkeit):** die E-Mail behauptet nicht mehr, die
  vollständige AGB sei im PDF. Das PDF enthält die Vertragsbestätigung mit den
  § 4-Bedingungen, Zustimmungen und der Widerrufsbelehrung; die vollständige AGB
  (Fassung beim Kauf akzeptiert) ist verlinkt.

## Kleinere Nachbesserungen

- Widerrufs-Route: DB-Fehler beim Speichern von `declaration_full`/Versandstatus
  werden nicht mehr stillschweigend ignoriert (geloggt).
- Widerrufs-Retry: Betreiber-Eskalation nach Versuchslimit (`admin_escalated_at`).
- Hinweis zur „unverzüglichen" Eingangsbestätigung: Die **primäre** Bestätigung
  wird bereits **synchron** beim Absenden verschickt; der Cron ist nur das
  Sicherheitsnetz für den seltenen Sendefehler.

---

## Datenbank — vor Go-Live ausführen

Idempotent, in Reihenfolge: **33 → 34 → 35 → 36**. Migration 36 enthält die
DB-seitige Aktivierungssperre (Trigger), die finalize-Härtung, den Item-RPC-Filter,
den Consent-Unique-Index und die Eskalations-Spalten.

> Achtung bei BESTEHENDER Produktion: `consent_checkout_type_unique` schlägt fehl,
> falls bereits doppelte Consent-Datensätze je (User, Checkout, Typ) existieren.
> Vorher prüfen/bereinigen.

## Offen (extern, nicht im Code abnehmbar)

- **Vercel-Produktionsbuild** + echter **Stripe-E2E-Kauf**: Zahlung → Bestätigung
  + Snapshot + Vertrags-PDF → Assessment-Freischaltung → Fragebogen → Report →
  Refund. Erst dieser eine reale Durchlauf beweist die Kette.
- Migrationen 33–36 in Produktion ausführen.
- `CRON_SECRET` in Vercel setzen (sonst laufen alle Crons nicht).
- Anwaltliche Prüfung der finalen Texte; `INVOICE_VAT_NOTE`-Steuerstatus.

Der vom Audit erneut beobachtete `npm run build`-Hang bei „Collecting page data"
war hier wieder **nicht reproduzierbar** (Compile + 9/9 Seiten erfolgreich) —
sehr wahrscheinlich umgebungsbedingt.
