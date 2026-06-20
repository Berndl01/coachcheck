# FIX v3_43 — Premium-Refund-Lockdown + Live-Pulse-Zähler (6. Audit)

Schließt die 4 P0-Release-Blocker des 6. Audits plus den Migration-39-Preflight
und die P1-Punkte. Kernthema: **Refund/Widerruf wirkt jetzt konsistent über ALLE
Premium-Wege** (Einladungen, Saison, Report, Share) — nicht nur dort, wo neu
generiert wird. Vorher konnten erstattete Kunden weiter Tokens erzeugen, Reports
lesen und Saison-Daten sehen → Chargeback-/Rechts-Risiko.

Alle 7 Gates grün: tsc · claimcheck (62) · **vitest 262/262** (v3_42: 219 → +43) ·
eslint · build (voll, alle Routen) · audit 0 · PDF 3/3 + Beispiel.

---

## P0/1 · Premium-Einladungen umgingen Vertrags-/Refund-Sperren

**Vorher:** Die 6 Einladungsrouten prüften nur Eigentum + Tier, nicht
Aktivierung/Bezahlt/Bestätigung/Refund. Nach einem Refund ließen sich weiterhin
Fremdbild-/Spieler-Tokens erzeugen und nutzen.

**Jetzt:** Zentraler Helper `requireActiveAssessmentEntitlement()`
(`lib/auth/assessment-entitlement.ts`) prüft: Assessment aktiviert (nicht
`awaiting_contract_confirmation` → 409), `purchase_id` vorhanden, Kauf desselben
Nutzers, Status `paid` (sonst 402), `confirmation_sent_at` gesetzt, optional
`minTier`. Eingesetzt in:

- `invitations/create` (Fremdbild, Tier ≥ 3)
- `invitations/bulk` (Spieler, Tier ≥ 4, **Cap 200 aktiv / 50 pro Request** — vorher unbegrenzt)
- `invitations/send`
- `invitations/[token]/open` · `/answer` · `/complete` — über
  `requireActiveInvitationByToken()`; bereits ausgegebene Tokens nehmen nach Refund
  nichts mehr an.

**Refund-Cascade im Stripe-Webhook erweitert:** Bei vollem Refund/Dispute werden
pro Assessment zusätzlich (a) normale Einladungen auf `expired` gesetzt und (b) der
öffentliche Karten-Link gesperrt (`share_enabled=false`, `share_token=null`) — vor
dem bereits bestehenden Saison-Archivieren + Pulse-Token-Revoke. Alle DB-Fehler →
500, damit Stripe den Webhook erneut zustellt.

## P0/1 · Refund-Lockdown (Variante A) beim Lesen

Konsistente Sperre nach vollständiger Rückerstattung — Standard-Auslegung, am besten
verteidigbar:

- `report-status` (GET): `checkPaidEntitlement` → 402 statt Signed-URL.
- Ergebnisseite `assessment/[id]/result`: Eigentum geklärt, dann
  `checkPaidEntitlement` → „Zugriff gesperrt"-Panel statt Report.
- Share-Aktivierung (`share` POST): nur bei weiterhin bezahltem Kauf → 402.

## P0/2 · Saison nach Refund weiter lesbar

**Vorher:** Die Saison-Detailseite lud Daten mit dem User-Client; die
Owner-Select-RLS ignoriert den Refund-Status.

**Jetzt:** `saison/[id]/page.tsx` klärt Eigentum (Admin), prüft dann
`requireSeasonEntitlement()`. Ohne Berechtigung → „Zugriff gesperrt"-Panel, **keine
Daten geladen**. Mit Berechtigung werden Cycles + Tokens serverseitig
(`service_role`) geladen. Migration 40 verschärft zusätzlich die Owner-Select-RLS
auf `pulse_cycles`/`pulse_invitations` (nur bei bezahltem Kauf + nicht-archivierter
Saison) als Defense-in-Depth gegen direkte REST-Reads.

## P0/3 · Offener Pulse-Cycle zeigte immer „0 Antworten"

**Vorher:** `response_count` wurde nur beim Schließen aktualisiert. Der Trainer sah
nie, ob die Anonymitätsschwelle (≥ 5) erreicht ist. Schließen war zudem ungeschützt
(kein Open-Check, < 5 erzeugte leeren Snapshot ohne Reopen).

**Jetzt — Migration 40:**
- `get_pulse_cycle_response_count(uuid)` — reine Zählung
  (`count(distinct respondent_token)`), nur `service_role`, gibt nie Einzelantworten zurück.
- `refresh_pulse_cycle_response_count(uuid)` — schreibt den Live-Stand in
  `pulse_cycles.response_count`, nur `service_role`. Backfill für offene Cycles.
- Submit-Route ruft `refresh_…` (best-effort) und liefert `responseCount` zurück →
  der Trainer sieht 1 → 5 → … live.

**Close-Route gehärtet:** Status ≠ `open` → 409; `refresh` zuerst, bei < 5 → 409
(„Noch nicht genügend vollständige Antworten…"); Snapshot erst ab garantiert ≥ 5;
finaler Update mit `.eq('status','open')`-Race-Guard.

**Neue Route** `cycles/[cycleId]/archive`: Cycle ohne Auswertung archivieren
(`status='archived'`, kein Snapshot) — für den Fall „nie 5 erreicht". Mit
Entitlement + Eigentum + Open-Check + Race-Guard.

**UI (`season-control.tsx`):** Live-Antwortzahl, „Schließen+Snapshot" erst ab 5
aktiv (mit Hinweis darunter), „Ohne Auswertung archivieren"-Button, pro Token
Kopieren/Neuer-Link/Widerrufen, korrekte (gespeicherte) Labels beim Sammelkopieren.

## P0/4 · Deployment-Doku war falsch

GO-LIVE.md / LAUNCH_CHECKLIST.md / README.md sagten weiter „v3_41 / 01→38".

**Jetzt:** Verbindlicher Block auf **v3.42 / Migrationen 01 → 40**; bestehende
Produktion `33→34→35→36→37→38→39→40`; **Pflicht-Preflight vor Migration 39**
dokumentiert (Query auf doppelte offene Cycles). Der veraltete
`rest/v1/answers`-Selbsttest in LAUNCH_CHECKLIST wurde durch den korrekten Pfad
`POST /api/assessment/[id]/answer` ersetzt (inkl. „NICHT direkt `/rest/v1/answers`").
Stale `supabase db push  # wendet 12_rls_hardening.sql an` entfernt.

## Migration-39-Preflight (Self-Repair)

Der Unique-Index `pulse_cycles_one_open_per_season` (neu in v3.42) bricht ab, wenn
eine Saison bereits zwei offene Cycles hat → die ganze Migration scheitert.
**Jetzt** dedupliziert Migration 39 vorab selbst: pro Saison bleibt der Cycle mit
der höchsten `cycle_number` offen, ältere werden ohne Snapshot archiviert.
Idempotent, lässt saubere DBs unverändert.

## P1

- **Revoke/Rotate-Routen** (`seasons/[id]/invitations/[invitationId]/revoke` ·
  `/rotate`): Einzeltoken widerrufen (`revoked`) bzw. neuen unrätselbaren Token
  vergeben (`randomBytes(24)` base64url, 23505-Retry, `active`).
- **Falsche Aussagen entfernt:** „Du kannst pausieren und später weitermachen"
  (Antworten werden erst am Ende gespeichert) in teamcheck-/einschaetzung-Runner;
  „du bekommst automatisch wieder einen Link" → „nutze wieder denselben Link" im
  Pulse-Runner; beide Pause-Zeilen in der Einladungs-E-Mail bereits in v3.42 raus.
- **Zod-Validierung:** `seasons/create` (Name 1–120, Sport ≤ 100, Team 1–500,
  Intervall 7–365) und `cycles/start` (`closes_in_days` 3–60 — „abc" lief vorher
  über NaN in einen 500er). `seasons/[id]/invitations/bulk` mit Cap 200/Saison,
  100/Request und fortlaufender Label-Nummerierung (keine doppelten „Spieler 01").

---

## Gate-Ergebnisse v3_43

| Gate | Ergebnis |
| --- | --- |
| `tsc --noEmit` | ✅ 0 Fehler |
| claimcheck | ✅ 62 Dateien, keine riskanten Claims |
| vitest | ✅ **262/262** (neue Datei `hardening-v3-43.test.ts`, +43 ggü. v3_42) |
| eslint | ✅ keine Warnungen/Fehler |
| `next build` | ✅ Exit 0, vollständige Routen-Tabelle inkl. archive/revoke/rotate |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities |
| PDF | ✅ 3/3 Varianten + Beispiel-Report |

## Was NUR live geht (bleibt bei dir)

Der End-to-End-Test im echten Stripe/Supabase: Tier-5-Kauf → Vertrags-PDF →
Freischaltung → Saison → 5 Tokens → Live-Zähler 1 → 5 → Snapshot ab 5 → Refund →
alle Sperren (Tokens, Einladungen, Share, Saison-Lese, Report, Result) greifen.
Migrations-Reihenfolge + Preflight in Supabase, ENV, Webhook, Auth-Templates,
Anthropic-Key sind im Code nicht verifizierbar. Die juristische Freigabe (FAGG)
liegt bei deinem Anwalt.
