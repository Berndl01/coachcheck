# CoachCheck — Änderungen v3_30

**Fokus:** Externes Hard-Review gegen den echten Code + echte DB gegengeprüft.
Der kritische Befund (umgehbare Paywall) wurde als **real & ausnutzbar bewiesen**
und geschlossen, dazu die belegten Kaufprozess-/Datenschutz-Quick-Wins.

---

## P0 — Paywall & Entitlement (war ausnutzbar, jetzt geschlossen)

### Befund (gegen echte DB als Rolle `authenticated` bewiesen)
Ein eingeloggter Nutzer **ohne jeden Kauf** konnte über die öffentliche
Supabase-REST-API:
1. ein Premium-Assessment (z.B. Tier 3 / 199 €) direkt anlegen,
2. `status='completed'` + `axis_scores` + `primary_archetype_id` direkt setzen
   (also `/finalize` komplett umgehen),
3. die Report-Route auslösen → Premium-PDF + KI-Kosten.

Ursachen: RLS-Policy `assessments_insert_own` ohne Kaufprüfung; `assessments_update_own`
ohne `with_check` (kritische Felder frei schreibbar); keine Bindung an eine
bezahlte Purchase; keine Entitlement-Prüfung in der Report-Route.

### Fix (drei Schichten — Lese-, Schreib- und Kostenpfad)
- **`27_paywall_entitlement_hardening.sql`**
  - `assessments.purchase_id` (FK → purchases) + Backfill + **Unique-Index**
    (höchstens ein Assessment je Purchase → schließt auch die Webhook-Race-Dublette).
  - **RLS-Lockdown:** `assessments_insert_own` und `assessments_update_own`
    entfernt. Browser darf assessments WEDER anlegen NOCH ändern; `SELECT`-eigene
    bleibt. Alle Writes laufen über die service_role.
  - **Assertion** bricht die Migration ab, falls eine Schreib-Policy verbleibt.
- **`lib/auth/entitlement.ts`** + Report-Route: vor jedem KI-/PDF-Schritt
  `checkPaidEntitlement` — nur mit verknüpfter Purchase im Status `paid`
  (gleicher Nutzer, gleiches Produkt). Sonst HTTP 402. `refunded` ≠ berechtigt.
- **Webhook**: setzt `purchase_id` beim Anlegen + verarbeitet **`charge.refunded`/
  `charge.dispute.created`** → Purchase auf `refunded` (entzieht die Berechtigung).
- **`context`-Route** und **Dev-Route** auf service_role umgestellt (nach
  Ownership-Check), damit der Lockdown keine legitimen Flows bricht; die Dev-Route
  legt jetzt eine bezahlte Test-Purchase an → Dev-Flow == Prod-Flow.

### Bewiesen (echte DB, Rolle `authenticated`, ein Request = eine Transaktion)
```
Angreifer INSERT Premium ohne Kauf .... ERROR: violates RLS policy   ✓ blockiert
Angreifer UPDATE status/scores eigen .. UPDATE 0                     ✓ blockiert
service_role create (wie Webhook) ..... OK, mit purchase_id          ✓ funktioniert
Entitlement bei paid .................. true                         ✓
Nutzer SELECT eigenes Assessment ...... 1                            ✓ lesbar
```

---

## Quick Wins (alle aus dem Review, alle belegt)

- **Toter EU-ODR-Link entfernt** (Plattform seit 20.7.2025 offline) — Impressum
  **und** AGB auf die aktuelle „Verbraucherschlichtung"-Formulierung umgestellt.
- **Consent-Nachweis ist Pflicht:** `recordConsent` prüft jetzt den Insert-Fehler
  und liefert ein Ergebnis; der Checkout **bricht ab (503)**, wenn die Speicherung
  scheitert. Keine Zahlung mehr ohne gesicherten Einwilligungsnachweis.
- **PDF-Storage-Löschung:** neue `deleteReportFiles()`; Account-Löschung entfernt
  jetzt die PDF-Dateien aus dem Storage (vorher blieben sie liegen) **und** prüft
  die DB-Löschfehler — kein falsches `ok:true` mehr.
- **Funktionierende Abmeldung:** `28_invitation_unsubscribe.sql` (`unsubscribed_at`).
  Die Einschätzungsseite verarbeitet `?unsubscribe=1` (markiert + zeigt Bestätigung),
  der Versand verweigert danach. Der One-Click-Unsubscribe-Header tut jetzt etwas.

---

## Regressions-Guards (neu)
- `tests/paywall-entitlement.test.ts` (11 Tests): nagelt Lockdown-Migration,
  Entitlement-Gate, Webhook-Bindung + Refund-Handling und Consent-Pflicht auf
  Quell-Ebene fest → kein stiller Rückfall durch künftige Refactors.

## Bewusst (noch) NICHT in diesem ZIP (ehrlich benannt)
Aus dem Review offen und für **bezahlte Werbung/Skalierung** empfohlen (P1/P2),
aber kein akuter Verkaufsstopper mehr: Job-Queue/Worker für die Reportgenerierung,
vollständiger Stripe-E2E-Test (statt `test.fixme`), persistentes Rate-Limiting
verbindlich, Rechnungs-/Steuerprozess, sowie die Positionierungs-Themen
(wissenschaftliche Claims, Testimonials-Nachweis). Diese sind dokumentiert, nicht
vergessen.

## Gates (alle grün — echter Code + echte DB)
```
tsc --noEmit ........... ✓
claimcheck ............. ✓ 50 Dateien
vitest ................. ✓ 75 Tests (vorher 64)
eslint ................. ✓
next build ............. ✓ EXIT 0, 9/9 Seiten
npm audit (omit dev) ... ✓ 0 vulnerabilities
PDF-Volltest ........... ✓ 3/3 Varianten
Migrationen 01–28 ...... ✓ frisch von null sauber, Lockdown-Assertion grün
Angreifer-Simulation ... ✓ blockiert · legitimer Pfad ✓ funktioniert
```

**Deployment:** Migrationen 26, 27, 28 müssen auf Supabase eingespielt werden.
Nach 27 prüfen: in Supabase → Authentication/Policies dürfen auf `assessments`
**keine** INSERT/UPDATE-Policies für `authenticated` mehr stehen (nur SELECT).
Stripe: Webhook zusätzlich für `charge.refunded` und `charge.dispute.created`
abonnieren (Dashboard → Webhooks → Events).
