# CoachCheck — Änderungen v3_31

**Fokus:** Zweites externes Hard-Review gegen echten Code + echte DB gegengeprüft.
Die gemeldeten **weiteren offenen RLS-Policies** (answers, items, invitations) sind
real — als Angriff bewiesen und geschlossen, dazu IP-Schutz, Webhook-Schärfung
und der Widerruf-Consent.

---

## P0/P1 — RLS-Härtung answers / items / invitations (war offen)

### Befund (gegen echte DB als Rolle `authenticated` bewiesen)
Dieselbe Klasse wie die (in v3_30 geschlossene) Paywall:
- `answers_insert_own` / `answers_update_own`: Käufer konnte Antworten direkt
  über die Supabase-REST-API schreiben/ändern (auch NACH Abschluss, mit
  ungültigen Werten) und die geprüfte answer-Route umgehen.
- `items_read_auth`: jeder eingeloggte Nutzer konnte die **komplette** items-
  Tabelle lesen — alle Fragen aller Pakete inkl. `axis_weights`, `reverse_scored`,
  Optionsgewichte. Pool + Scoring waren mit einem REST-Call abziehbar.
- `invitations_insert_owner`: Einladungen direkt erzeugbar, Server-Validierung
  (Tier/Typ/Limits) umgehend.
- `get_items_for_assessment` (security definer) prüfte das Assessment-Eigentum nicht.

### Fix — `29_rls_answers_items_invitations.sql`
- `answers_insert_own` + `answers_update_own` **entfernt** (SELECT-eigene bleibt).
- `invitations_insert_owner` **entfernt** (SELECT-eigene bleibt).
- `items_read_auth` **entfernt** → der Browser kann items **nicht mehr direkt**
  lesen; Items kommen nur über die security-definer-RPCs.
- `get_items_for_assessment` prüft jetzt `auth.uid() = a.user_id` (+ player_item-
  Filter aus 26).
- **Answer-Immutability-Trigger**: nach Abschluss (completed/report_ready/
  archived) sind Antworten unveränderbar — gilt auch für service_role.
- Assertion bricht die Migration ab, wenn ein Lockdown fehlt.

### Code (alle legitimen Pfade auf service_role)
- answer-Route liest Items + schreibt Antworten über admin.
- report-Route: Item-Reads (Fremdbild-/TeamCheck-Aggregation) über admin.
- invitation create + bulk: Insert über admin (nach Ownership/Tier-Check).
- admin-Checklist: globale Zahlen über admin (RLS-Client zählte nur eigene Zeilen;
  items wäre nach dem Lockdown 0 gewesen).

### Bewiesen (echte DB, Rolle `authenticated`)
```
items direkt lesen ................ 0           ✓ Pool nicht abziehbar
answer direkt INSERT .............. RLS-Violation ✓ blockiert
invitation direkt INSERT .......... RLS-Violation ✓ blockiert
fremde Items via RPC .............. 0           ✓ Ownership greift
legit answer-Write (pending) ...... OK          ✓ funktioniert
answer-Write auf completed ........ Trigger-Block ✓ unveränderbar
```

---

## IP-Schutz: keine Scoring-Metadaten mehr im Browser
- `lib/utils/sanitize-items.ts`: strippt `axis_weights`, `reverse_scored` und
  Options-Gewichte aus den RPC-Items, bevor sie an die Client-Runner gehen.
- `Item`-Typ (item-renderer) enthält diese Felder nicht mehr (wurden nie verwendet).
- Angewandt in assessment-, einschaetzung- und teamcheck-Seite.

## Webhook-Schärfung
- Verarbeitet nur Sessions mit `payment_status === 'paid'`.
- Rückerstattung entzieht die Berechtigung nur bei **voller** Erstattung
  (`amount_refunded >= amount`); Disputes immer. (Stripe sendet `charge.refunded`
  auch bei Teilrückerstattungen.)

## Checkout / Recht
- **Widerruf-Verzicht als vierter Pflicht-Haken**: „Ich verlange ausdrücklich …
  Beginn vor Ablauf der Widerrufsfrist … verliere mein Widerrufsrecht." Server
  erzwingt ihn und dokumentiert ihn versioniert (consent_type `widerruf_verzicht`).
- Datenschutz-Wording: „gelesen und akzeptiere sie" → „zur Kenntnis genommen".
- **SEPA** aus AGB + Datenschutz entfernt (Code ist `payment_method_types: ['card']`).
- `?regenerate=1` (teurer KI-/PDF-Lauf) nur noch für Admins.

## Regressions-Guard (neu)
- `tests/rls-hardening-v31.test.ts` (14 Tests): nagelt Lockdown-Migration,
  service_role-Pfade, IP-Sanitizing, Webhook-Schärfung und Widerruf-Consent fest.

## Bewusst NICHT geändert (ehrlich benannt)
- **Wissenschaftliche Zitate** (Cooke→Vella, Glandorf-Jahr): NICHT angepasst —
  Zitate korrigiere ich nicht auf Basis eines Reviews, das ich selbst nicht
  verifiziert habe. **Bitte gegen deine 130-Quellen-Datenbank prüfen.**
- **DB-Constraint** `invitation_type<>'spieler' or invited_email is null`: bewusst
  nicht als harter Check gesetzt (Risiko auf evtl. vorhandenen Legacy-Daten). Die
  Spieler-Anonymität ist app-seitig (bulk erzwingt `invited_email: null`) + per
  RLS-Lockdown geschützt.
- **Rechnungs-/Steuerlogik**, juristische Freigabe der Widerruf-Formulierung,
  14-Tage-Log-Retention-Implementierung, AVV/SCCs: deine/anwaltliche Entscheidung.
- Build hängt nur in der Prüfumgebung des Reviewers — hier mehrfach grün (9/9).

## Gates (alle grün — echter Code + echte DB)
```
tsc ✓ · claimcheck ✓ 51 · vitest ✓ 89 (vorher 75) · eslint ✓
next build ✓ EXIT 0, 9/9 · npm audit (omit dev) ✓ 0 · PDF ✓ 3/3
Migrationen 01–29 ✓ frisch von null, alle Lockdown-Assertionen grün
Angreifer-Simulation ✓ alle vier blockiert · legitime Pfade ✓ funktionieren
```

**Deployment:** Migrationen 26–29 auf Supabase einspielen. Nach 29 prüfen: auf
`answers`/`invitations` keine INSERT/UPDATE-Policies, auf `items` **keine**
SELECT-Policy mehr für `authenticated`. Stripe-Webhook zusätzlich für
`charge.refunded` und `charge.dispute.created` abonnieren.
