# FIX v3_42 — Saison-Monitor repariert + Härtung vervollständigt (5. Audit)

Schließt die Regressionen, die mein v3_41 EINGEBAUT hat (Saison-Schreibrouten
brachen, Pulse-RPC versehentlich geöffnet), plus die übrigen echten Punkte.
Diesmal wurde JEDE Route geprüft, die auf die gesperrten Tabellen schreibt —
nicht nur die im Audit genannten.

Alle 7 Gates grün: tsc · claimcheck (61) · **vitest 219/219** (v3_41: 206 → +13) ·
eslint · build (9/9) · audit 0 · PDF 3/3 (Beispiel jetzt 21 S., keine Leerseite).

---

## Regression 1 (mein v3_41-Fehler) · Saison-Monitor war funktionsblockiert

Migration 38 entfernte die Schreib-RLS auf `pulse_cycles`/`pulse_invitations`, aber
nur `seasons/create` wurde auf `service_role` umgestellt. `cycles/start` und
`invitations/bulk` schrieben weiter mit dem **User-Client** → nach Migration 38
verweigert → kein Cycle, keine Tokens.

**Jetzt:** alle Saison-Schreibrouten (`cycles/start`, `invitations/bulk`,
`cycles/close`) nutzen `createAdminClient()` UND den neuen Entitlement-Guard.

## Regression 2 (mein v3_41-Fehler) · Pulse-RPCs wieder browser-offen

Migration 38 hatte `compute_pulse_snapshot` + `detect_pulse_trends` versehentlich
wieder an `authenticated` vergeben (Migration 13 hatte sie bewusst gesperrt).

**Jetzt (Migration 39):** beide RPCs entzogen von public/anon/authenticated,
nur noch `service_role`. Zusätzlich gibt die öffentliche Submit-Route die interne
`cycle_id` nicht mehr zurück.

## Blocker 3 · Berechtigung bei JEDER Saison-Aktion (refund-fest)

**Vorher:** Tier-5/Kauf wurde nur beim Anlegen geprüft. Nach Refund blieb die
Saison aktiv.

**Jetzt:** zentraler Helper `requireSeasonEntitlement()` (lib/season/entitlement.ts)
prüft bei Cycle starten, Tokens erzeugen, Cycle schließen UND beim Annehmen von
Pulse-Antworten: Eigentümer + `purchase_id` vorhanden + Kauf `paid` (nicht erstattet)
+ Bestätigung versendet + Tier 5 + Saison aktiv. Migration 39 archiviert zudem
Alt-Saisons ohne Kauf und erzwingt `purchase_id` bei neuen Saisons (Insert-Trigger).

## Stripe-Refund · transaktional + fail-loud

**Vorher:** Refund-DB-Fehler wurde nur geloggt, Event als processed markiert, HTTP 200.

**Jetzt:** bei DB-Fehler **HTTP 500** (Event bleibt unprocessed → Stripe-Retry).
Beim vollen Refund/Dispute werden in einem Durchgang Kauf → `refunded`, zugehörige
Saison → `archived` und deren Pulse-Einladungen → `revoked` gesetzt; jeder
Teilschritt fail-loud.

## Weitere Fixes

- **Höchstens ein offener Pulse-Zyklus pro Saison** (Unique-Index, Migration 39) +
  freundlicher 409 in `cycles/start`.
- **PDF:** Spielertyp-Karten jetzt **2-spaltig (2×2)** statt gestapelt mit
  `wrap={false}` → keine fast leere Seite mehr (Beispiel 22 → 21 Seiten).
- **Deployment-Doku:** der gefährliche Rollback (anonyme `using (true)`-Policies)
  wurde ENTFERNT und durch sichere Anweisungen ersetzt; veraltete `cycle_id`-Angabe
  korrigiert.

---

## Datenbank — vor Go-Live ausführen

In Reihenfolge: **33 → 34 → 35 → 36 → 37 → 38 → 39** (idempotent). 39 korrigiert
die RPC-Rechte, bereinigt Alt-Saisons und ergänzt die Cycle-Eindeutigkeit.

## Offen

- **Echter Stripe-/Live-E2E** (`tests/e2e/purchase-flow.spec.ts`, `test.fixme`):
  weiterhin nur live durchführbar. Zu prüfen: Tier-5-Kauf → Saison → Token →
  5 Pulse-Antworten → Snapshot → Refund → danach muss jeder weitere Saison-Zugriff
  gesperrt sein.
- **Fallback-Report:** bleibt wie von dir gewünscht (deterministisch ausliefern);
  automatische Nachveredelung ist ein optionaler Folgeschritt.
