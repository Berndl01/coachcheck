# HARDENING v3_36 — FAGG-/Vertrags-Blocker geschlossen

Adressiert die vier vom v3_35-Audit verifizierten Verkaufsblocker plus drei
Pflicht-Textkorrekturen. Der v3_35-Changelog hatte die Mechanik teils
überzeichnet — dieser Stand ist gegen den realen Code geprüft (alle Gates grün,
161/161 Tests).

> Wichtig (Ehrlichkeit): Dieser Stand liefert den **Mechanismus** (vollständige
> Inhalte, atomare Freischaltung, belastbarer Widerruf). Ob er die **rechtliche
> Schwelle** erfüllt (z. B. Erlöschen des Widerrufsrechts, Steuerangaben), ist
> eine anwaltliche/steuerliche Bewertung — nicht vom Code zugesichert.

---

## Blocker 1 · § 4 FAGG-Vertragsinformationen vollständig & unveränderbar

**Vorher:** Bestätigungsmail verlinkte nur die AGB; Leistungsumfang,
Bereitstellung, Gewährleistung sowie Funktionalität/Kompatibilität/
Interoperabilität fehlten als Inhalt.

**Jetzt:**
- `lib/legal/withdrawal.ts` — vier kanonische § 4-Bausteine (`BEREITSTELLUNG`,
  `GEWAEHRLEISTUNG`, `FUNKTIONALITAET_KOMPATIBILITAET`,
  `NUTZUNG_HAFTUNG_VERFUEGBARKEIT`) + produktspezifische `serviceDescriptionFor()`
  (ehrliche Hauptmerkmale je Produkt, ohne Heils-/Validitätsversprechen). Diese
  Texte werden in den unveränderbaren `ContractSnapshot` (`serviceTerms`)
  eingefroren.
- `lib/email/order-confirmation.ts` — rendert alle § 4-Blöcke **inline** in der
  Mail (nicht nur als Link), aus dem Snapshot.
- `lib/pdf/contract-document.tsx` (NEU) — hängt das vollständige Vertragsdokument
  als PDF an (Bestelldaten, Anbieter, § 4-Bedingungen, Zustimmungen mit
  Zeitstempel, Widerrufsbelehrung, Muster-Widerrufsformular). Nur eingebaute
  Fonts (Helvetica), dynamischer `renderToBuffer`-Import → kein Build-Zeit-IO.
  Inhaltshash (`contract_pdf_sha256`) + Zeitpunkt werden auf der Purchase
  gespeichert. Best effort: scheitert das Rendern, geht die Mail **ohne** Anhang
  raus — die Pflichtangaben stehen ohnehin vollständig im Text.

## Blocker 2 · Atomare Freischaltung (keine Dauer-Sperre mehr)

**Vorher:** Versandmarker und Assessment-Freischaltung waren zwei getrennte
Updates ohne Fehlerbehandlung. Szenario A: `confirmation_sent_at` gesetzt, aber
Freischaltung scheitert → Kunde dauerhaft gesperrt, Retry übersprang ihn.

**Jetzt:**
- `supabase/migrations/35_*.sql` — `finalize_order_confirmation(p_purchase_id,
  p_assessment_id)` (SECURITY DEFINER): setzt Versandmarker **und** schaltet das
  Assessment `awaiting_contract_confirmation → pending` in **einer Transaktion**.
  Entweder beides oder keines. Rechte nur für `service_role`.
- `lib/email/order-confirmation.ts` — ruft diese RPC statt zweier Einzel-Updates.
  Scheitert die RPC nach erfolgreichem Mailversand, bleibt `confirmation_sent_at`
  leer und der Fehler wird protokolliert → der Retry zieht nach.
- `app/api/internal/confirmation-retry/route.ts` — Selbstheilungs-Batch: bereits
  bestätigte, aber noch gesperrte Käufe werden per einzelnem, idempotentem Update
  (für sich atomar) freigeschaltet (`repaired`-Zähler).

*Bewusst akzeptiert:* das seltene Fenster „Mail raus, RPC scheitert" führt
maximal zu einer doppelten Bestätigungsmail — deutlich harmloser als eine
dauerhafte Sperre.

## Blocker 3 · Gespeicherter Consent-Wortlaut + strikte Validierung

**Vorher:** Snapshot nutzte Code-Konstanten statt des gespeicherten
`consent_text`; Freischaltung auch mit nur 3 von 4 Zustimmungen möglich.

**Jetzt:**
- `lib/email/order-confirmation.ts` — liest `consent_text` mit; `validateConsents()`
  verlangt **genau** die vier Pflichttypen, jeweils mit `accepted_at`,
  gespeichertem `consent_text` und zur Purchase passender Version, **bevor**
  freigeschaltet wird. Strikt bei Neukäufen (mit `checkout_attempt_id`);
  Altbestellungen ohne ID = best effort (kein Block).
- `lib/legal/withdrawal.ts` — `buildContractSnapshot()` friert den **gespeicherten
  Originalwortlaut** jeder Zustimmung ein (Code-Konstante nur Fallback).
- Sicher, weil der Checkout-Start (`app/checkout/[slug]/start/route.ts`) Stripe
  verweigert (503), wenn nicht alle vier Consents persistiert wurden → zur
  Zahlung sind alle vier garantiert vorhanden.

## Blocker 4 · Online-Widerruf belastbar

**Vorher:** Vertragsidentifikation optional (beide Felder leer möglich);
Bestätigungsmail ohne Erklärungsinhalt/Freitext; fehlgeschlagene Kundenmail wurde
nicht erneut versucht (UI behauptete trotzdem Versand).

**Jetzt:**
- `app/api/widerruf/route.ts` — mind. **eine** Identifikation (Bestellnummer ODER
  Produkt) ist Pflicht (klare deutsche Fehlermeldung). Antwort enthält
  `confirmationEmailSent` (ehrlicher Versandstatus).
- `lib/email/withdrawal-confirmation.ts` (NEU) — geteilter Baustein für Route +
  Cron. `buildWithdrawalDeclaration()` baut den **vollständigen Erklärungsinhalt**
  (feste Widerrufsformel + Vertragsangaben + optionaler Freitext); wird in
  `withdrawals.declaration_full` gespeichert **und** in der Mail wiedergegeben
  (Inhalt, Datum, Uhrzeit der Erklärung).
- `app/api/internal/withdrawal-retry/route.ts` (NEU) — CRON_SECRET-geschützter
  Cron; versendet ausstehende Bestätigungen erneut (exponentielles Backoff,
  Versuchslimit), zieht ggf. `declaration_full` nach.
- `app/widerruf/widerruf-form.tsx` — Client-Validierung (eine Identifikation
  Pflicht); Button „**Widerruf bestätigen**"; Erfolgsmeldung behauptet keinen
  Versand mehr, wenn die Mail noch aussteht.
- `supabase/migrations/35_*.sql` — `withdrawals` +`confirmation_attempts`,
  +`confirmation_last_error`, +`confirmation_next_retry_at`, +`declaration_full`
  + Teilindex für fällige Retries.
- `vercel.json` — neuer Cron `/api/internal/withdrawal-retry` (15 */2 * * *).

## Blocker 5/6/7 · Versionen & ehrliche Texte

- **5 (Versionen):** `AGB_VERSION = '18. Juni 2026'`, `CONSENT_VERSION =
  '2026-06-18'`; AGB-/Datenschutz-Seite „Stand: 18. Juni 2026".
- **6 (Rechnung):** AGB § 5(3) verspricht keine automatische PDF-Rechnung mehr —
  Bestätigung auf dauerhaftem Datenträger + formelle Rechnung **auf Anfrage**.
  § 5(1) USt-Formulierung an die Realität angepasst (kein unbedingtes
  „auf der Rechnung ausgewiesen").
- **7 (Logs):** Datenschutz behauptet keine 14-Tage-Löschung mehr — reale
  Provider-Aufbewahrung (Vercel) benannt; in der eigenen DB nur gehashte
  Nachweisdaten (IP-Hash zu Einwilligung/Widerruf).

---

## Gate-Ergebnisse (dieses Environment)

| Gate | Ergebnis |
|------|----------|
| `tsc --noEmit` | ✅ 0 Fehler |
| `claimcheck` | ✅ 57 Dateien, keine riskanten Claims |
| `vitest run` | ✅ **161/161** (v3_35: 139 → +22 neue) |
| `eslint .` | ✅ 0 |
| `next build` | ✅ sauber durchgelaufen (kein „Collecting page data"-Hang; 9/9 Seiten; beide Cron-Routen gebaut) |
| `npm audit --omit=dev` | ✅ 0 Vulnerabilities |
| PDF-Report-Volltest | ✅ alle 3 Report-Varianten |
| Vertrags-PDF-Render | ✅ alle 3 Produkttypen (NEU) |

Der vom Audit beobachtete Build-Hang war hier **nicht reproduzierbar** — sehr
wahrscheinlich umgebungsbedingt (lokale Maschine/Env), kein Code-Defekt.

## Datenbank — vor Go-Live ausführen

Idempotent, in Reihenfolge: **33** (Snapshot + awaiting-Status +
checkout_attempt_id), **34** (withdrawals-Tabelle), **35** (finalize-Funktion +
Vertrags-PDF-Hash + Widerruf-Retry-Spalten).

## Offen (extern, nicht im Code abnehmbar)

- Erfolgreicher **Vercel-Produktionsbuild** + echter **Stripe-E2E-Kauf**
  (Mail + Assessment-Freischaltung + Report + Vertrags-PDF + Refund).
- `CRON_SECRET` in Vercel setzen — sonst laufen **alle drei** Crons (Reminder,
  confirmation-retry, withdrawal-retry) nicht (HTTP 503).
- **Anwaltliche Prüfung** der finalen Vertrags-/Widerrufs-/Steuertexte.
- **INVOICE_VAT_NOTE** mit korrektem Steuerstatus belegen (Steuerberater);
  Default behauptet bewusst keinen Satz/Kleinunternehmerstatus.
