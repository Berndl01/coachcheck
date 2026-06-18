# HARDENING v3_35 — Verkaufsfreigabe-Blocker aus dem v3_34-Review

Basis: `coachcheck_HARDENED_v3_34.zip`. Diese Version adressiert die im
v3_34-Prüfergebnis genannten Punkte, die einem offenen B2C-Verkauf im Weg standen.
Geliefert wird jeweils der **Mechanismus**; der finale **Wortlaut** der Rechts-/
Steuertexte bleibt anwaltlich/steuerlich zu prüfen (Review-Punkt 8).

Gate-Sequenz: tsc ✅ · claimcheck (56) ✅ · vitest **139/139** ✅ · eslint ✅ ·
`next build` vollständig **9/9** ✅ (kein Hang) · npm audit 0 ✅ · PDF 3/3 ✅.

---

## 1 — Vertragsbestätigung als belastbarer dauerhafter Datenträger

**Problem (Review #1):** Die Mail verwies nur per Link auf `/legal/agb`. Ein Link
auf eine später veränderbare Seite genügt als Beweis nicht; die geltende Fassung
muss dauerhaft gespeichert und die Info direkt in der Mail enthalten sein.

**Umsetzung:**
- Neue zentrale Quelle `lib/legal/withdrawal.ts`: Widerrufsbelehrung,
  Muster-Widerrufsformular und die vier Consent-Wortlaute — wortgleich zur AGB.
- `lib/email/order-confirmation.ts` rendert die Bestätigung jetzt **aus einem
  unveränderbaren Vertrags-Snapshot** und enthält die **vollständige
  Widerrufsbelehrung + das Muster-Widerrufsformular direkt im Mailtext** (nicht
  nur als Link) sowie einen prominenten „Vertrag online widerrufen"-Button.
- **Migration 33** friert auf `purchases` ein: `contract_snapshot jsonb`,
  `agb_version`, `consent_version`, `consent_text_snapshot`. Der Snapshot wird
  beim ersten erfolgreichen Versand fixiert und bleibt unverändert — auch wenn
  AGB-Texte später geändert werden.

## 2 — Assessment erst NACH erfolgreicher Bestätigung freischalten

**Problem (Review #2):** Webhook legte das Assessment an und schaltete es sofort
frei; scheiterte Resend, war die Leistung trotzdem verfügbar.

**Umsetzung:**
- Neuer Assessment-Status `awaiting_contract_confirmation` (Migration 33,
  Check-Constraint idempotent erweitert).
- Webhook legt das Assessment **gesperrt** an. Erst wenn
  `sendOrderConfirmationForPurchase` erfolgreich versendet hat
  (`confirmation_sent_at` gesetzt), wird es **atomar** auf `pending`
  freigeschaltet (`.eq('status','awaiting_contract_confirmation')`).
- Scheitert der Versand, bleibt es gesperrt; der bestehende Retry-Cron holt
  Bestätigung **und** Freischaltung nach → kein zahlender Kunde wird dauerhaft
  ausgesperrt, aber die Leistung beginnt nicht vor der Bestätigung.
- Runner-Seite zeigt für den gesperrten Zustand einen ruhigen Wartebildschirm
  („Deine Bestätigung wird gerade zugestellt") statt 404/Fehler.

## 3 — Consent eindeutig an den konkreten Kauf binden

**Problem (Review #3):** Die Bestätigung zog „die letzten N Consent-Einträge des
Users"; bei mehreren Käufen konnte ein fremder Checkout-Consent erscheinen.

**Umsetzung:**
- `checkout_attempt_id` (uuid) wird im Checkout-Start serverseitig erzeugt und
  durchgereicht an: alle vier `consent_records` (Migration 33), Stripe-Session-
  Metadaten, `purchases`.
- Die Bestätigung wählt Consents jetzt **exakt über `checkout_attempt_id`**
  (Fallback nur für Altbestellungen ohne ID).
- Zusätzlich wird der **volle Wortlaut** jeder angeklickten Erklärung gespeichert
  (`consent_records.consent_text` + `purchases.consent_text_snapshot`) — nicht
  nur die Versionsnummer.

## 4 — Online-Widerrufsfunktion (Pflicht ab 19.06.2026)

**Problem (Review #4):** Keine Online-Widerrufsfunktion vorhanden.

**Umsetzung:**
- Seite `/widerruf` (eindeutig beschriftet, im Footer site-weit verlinkt → leicht
  zugänglich) mit Formular (Name, E-Mail, Bestellnummer, eindeutige Erklärung).
- Route `/api/widerruf`: Honeypot + Rate-Limit + Turnstile (gleiches Muster wie
  Kontakt), protokolliert den **Eingangszeitpunkt** in neuer Tabelle
  `withdrawals` (Migration 34), ordnet den Kauf best effort zu (nur bei
  passender E-Mail), sendet **Eingangsbestätigung auf dauerhaftem Datenträger**
  an den Kunden und benachrichtigt intern.
- **Ehrlich:** Die Bestätigung sagt zu, dass der Widerruf **geprüft** wird — sie
  verspricht keine automatische Rückerstattung (bei digitalen Inhalten kann das
  Recht durch den Verzicht bereits erloschen sein). Die Wirksamkeitsprüfung
  bleibt manuell/rechtlich.

---

## Weitere Nacharbeiten aus dem Review

- **`.env.local.example`**: `CRON_SECRET` und `INVOICE_VAT_NOTE` mit Erklärung
  ergänzt. Ohne `CRON_SECRET` liefern die Cron-Routen weiterhin 503 — in Vercel
  setzen.
- **Resume-Reminder** (Review): nutzt jetzt echte Inaktivität
  (`assessments.last_activity_at`, bei jeder Antwort gebumpt, in Migration 33
  für Bestandszeilen auf `coalesce(started_at, created_at)` backfilled) statt
  `created_at`.
- **One-Click-Unsubscribe** (Review): dedizierter POST-Endpoint
  `/api/unsubscribe` (RFC 8058); der `List-Unsubscribe`-Header von Reminder- und
  Einladungsmails zeigt jetzt dorthin. Sichtbarer Abmeldelink bleibt die
  GET-Seite.
- **Meilenstein-Mails** (Review): `notifyTrainerOnFremdbildResponse` claimt
  atomar über `first_response_notified_at` / `threshold_notified_at` (Migration
  33) mit `>=`-Schwelle → kein Doppelversand, kein übersprungener Meilenstein bei
  fast gleichzeitigen Abschlüssen.

---

## Geänderte / neue Dateien

**Neu**
- `lib/legal/withdrawal.ts`
- `app/widerruf/page.tsx`, `app/widerruf/widerruf-form.tsx`
- `app/api/widerruf/route.ts`
- `app/api/unsubscribe/route.ts`
- `supabase/migrations/33_contract_confirmation_gate.sql`
- `supabase/migrations/34_withdrawals.sql`
- `tests/withdrawal-and-gate.test.ts`

**Geändert**
- `lib/email/order-confirmation.ts` (Snapshot-Rendering, Volltext, Gate-Freigabe)
- `lib/email/progress-emails.ts` (Inaktivität, Meilenstein-Claim, Unsubscribe-URL)
- `lib/utils/audit.ts` (`recordConsent` + checkout_attempt_id/consent_text)
- `app/checkout/[slug]/start/route.ts` (checkout_attempt_id erzeugen/durchreichen)
- `app/api/stripe/webhook/route.ts` (gesperrtes Assessment, Kauf-Verknüpfung)
- `app/api/assessment/[id]/answer/route.ts` (`last_activity_at` bumpen)
- `app/api/invitations/send/route.ts` (Unsubscribe-Header → POST)
- `app/assessment/[id]/page.tsx` (Wartezustand)
- `app/legal/agb/page.tsx` (§7 Verweis auf Online-Widerrufsfunktion)
- `components/landing/footer.tsx` (Widerruf-Link)
- `.env.local.example`, `BUILD_LOG.txt`, `tests/order-confirmation.test.ts`

---

## Vor der Verkaufsfreigabe weiterhin offen (extern)

1. Erfolgreicher Vercel-Produktionsdeploy.
2. Echter Stripe-Testkauf: zugestellte Mail, Assessment-Freischaltung, Report,
   PDF, Refund-Test, Widerruf-Test (Eingangsbestätigung).
3. Anwaltliche Prüfung der finalen Vertrags-/Widerrufs-/Steuertexte.
4. `INVOICE_VAT_NOTE` mit korrektem Steuerstatus belegen lassen.
5. Falls die AGB-§7-Ergänzung als materielle Änderung gilt: `AGB_VERSION` +
   `CONSENT_VERSION` vor Go-Live hochzählen.
6. Migrationen 33 + 34 in Produktion ausführen; `CRON_SECRET` in Vercel setzen.
