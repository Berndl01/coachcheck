# CoachCheck — Änderungen v3_33

**Fokus:** Viertes Review. Die technischen Punkte aus v3_32 sind bestätigt
erledigt; neuer Punkt war die **Kaufbestätigung als Vertragsbeleg auf dauerhaftem
Datenträger** (FAGG, digitale Inhalte). Umgesetzt ist der **Mechanismus**
(vollständiger Beleg + zuverlässiger, protokollierter Versand). Das **Rechtsurteil**
(erfüllt das die Schwelle?) bleibt anwaltlich — siehe unten, ehrlich abgegrenzt.

---

## Was war (zu Recht bemängelt)
Nach der Zahlung ging nur eine freundliche Willkommensmail raus — ohne
Bestellnummer, Preis, Widerrufsbelehrung, dokumentierte Zustimmung,
Consent-Version/-Zeitpunkt oder AGB-Fassung. Versand „best effort": schlug er
fehl, wurde das Assessment trotzdem freigeschaltet und der Beleg war weg.

## Was jetzt ist

### 1) Vollständige Bestell- und Vertragsbestätigung
`lib/email/order-confirmation.ts` baut einen echten Vertragsbeleg mit:
- Bestellnummer (sequentiell, `CC-<nr>`), Bestelldatum + Uhrzeit (Europe/Vienna)
- Produktname, **Bruttopreis** (autoritativ aus dem gezahlten Betrag), Zahlungsart
- vollständige Anbieterangaben (aus `lib/legal/provider.ts`, Quelle: Impressum)
- **exakter Wortlaut** der Widerruf-Verzicht-Zustimmung (1:1 aus dem Checkout)
- Consent-Version + dokumentierter Zeitpunkt (aus `consent_records`)
- maßgebliche **AGB-Fassung** (Stand Mai 2026) + Link, Verweis auf
  Widerrufsbelehrung & Muster-Widerrufsformular in den AGB
- Hinweis zum Erlöschen des Widerrufsrechts bei digitalen Inhalten (FAGG)

Die Mail ist der dauerhafte Datenträger; sie ersetzt die alte Welcome-Mail
(deren warmer Ton bleibt erhalten, jetzt mit Vertragsteil).

### 2) Versandstatus + automatischer Retry
Migration `31_order_confirmation_tracking.sql`: `purchases` bekommt
`confirmation_sent_at`, `confirmation_attempts`, `confirmation_last_error` und
eine sequentielle `order_number`.
- `sendOrderConfirmationForPurchase()` ist **idempotent** (überspringt, wenn
  bereits gesendet) und **statusverfolgt** (Erfolg → Zeitstempel; Fehler →
  Versuch++ und Fehlertext).
- Webhook ruft sie nach Kauf auf — heilt auch einen früher fehlgeschlagenen
  Versand bei Stripe-Redelivery selbst.
- Neuer Endpoint `POST/GET /api/internal/confirmation-retry` (per `CRON_SECRET`
  geschützt) holt offene Bestätigungen nach. Für einen Scheduler (z. B. Vercel
  Cron) gedacht; ohne `CRON_SECRET` deaktiviert.

### Bewusste Design-Entscheidung (offen begründet)
Der Review schlug vor, das Assessment **nicht** freizuschalten, bis der Beleg
versandt ist. Das habe ich **nicht** so umgesetzt: einen zahlenden Kunden wegen
einer langsamen/fehlgeschlagenen E-Mail aus dem bereits gekauften Produkt
auszusperren, ist die schlechtere Nutzererfahrung. Stattdessen: Assessment bleibt
nutzbar, Beleg wird zuverlässig versandt + protokolliert + nachgeholt. Die App
trifft **keinerlei automatische Aussage** darüber, ob ein Widerrufsrecht erloschen
ist — sie schaltet nur frei. Diese rechtliche Einordnung gehört zur Anwaltsprüfung.

---

## EHRLICHE Abgrenzung (wichtig)
- Ich bin kein Anwalt. Ob dieser Beleg die **rechtliche Schwelle** (z. B.
  Erlöschen des Widerrufsrechts bei digitalen Inhalten) erfüllt, ist eine
  **anwaltliche Bewertung** — der Code liefert den Mechanismus, nicht das Urteil.
- **Umsatzsteuer:** Ich erfinde keinen Steuerstatus. Der Beleg zeigt den
  Bruttoendpreis + den Hinweis aus `INVOICE_VAT_NOTE`. **Setze diese Env-Variable
  vor echtem B2C-Verkauf** auf die korrekte Formulierung deines Steuerberaters
  (Kleinunternehmer-Hinweis ODER USt-Satz + UID). Der Default behauptet bewusst
  keinen Satz und keinen Kleinunternehmer-Status (das wäre eine erfundene
  Steuerangabe) — er nennt nur den wahren Endpreis.
- **PDF-Anhang der AGB:** nicht umgesetzt (der Mail-Versand unterstützt aktuell
  keine Attachments). Der Beleg referenziert die versionierte AGB-Fassung per Link.
  Falls dein Anwalt einen PDF-Anhang verlangt, ist das eine separate Erweiterung.
- **Widerruf-Button ab 19.06.2026:** bewusst **nicht** spekulativ eingebaut. Die
  WKO weist selbst darauf hin, dass die österreichische Umsetzung am 16.06.2026
  noch nicht final war. Für grenzüberschreitende/DE-Verkäufe sinnvoll vorzusehen —
  aber das ist deine Produkt-/Rechtsentscheidung, kein stiller Code-Change. Sag
  Bescheid, dann baue ich einen prominenten „Vertrag widerrufen"-Link ein.

---

## Gates (alle grün — echter Code + echte DB)
```
tsc ✓ · claimcheck ✓ 53 · vitest ✓ 105 (vorher 96) · eslint ✓
next build ✓ EXIT 0, 9/9 (+ /api/internal/confirmation-retry registriert)
npm audit (omit dev) ✓ 0 · PDF ✓ 3/3
Migrationen 01–31 ✓ frisch von null, alle Assertionen grün
order_number Auto-Vergabe ✓ · confirmation_sent_at/attempts/error ✓
RPC weiterhin ohne Scoring-Spalten ✓ · RLS-Lockdowns halten ✓
```

## Offener Reststand vor breitem B2C (fast nur noch NICHT-Code)
1. **Echter End-to-End-Stripe-Testkauf** durch die ganze Kette inkl. tatsächlich
   zugestellter Bestätigungsmail (das offene `tests/e2e/purchase-flow.spec.ts`).
2. **Erfolgreicher Vercel-Produktionsdeploy** als Nachweis.
3. **Anwaltliche Prüfung** von Beleg, Widerrufsprozess, USt-Darstellung/Rechnung.
4. `INVOICE_VAT_NOTE` korrekt setzen; optional Vercel-Cron auf den Retry-Endpoint.
5. (P1-Skalierung) Job-Queue/Worker für die Reportgenerierung.

## Deployment
Migrationen **26–31** einspielen. Env setzen: `INVOICE_VAT_NOTE` (Steuerstatus),
`CRON_SECRET` (Retry-Schutz), optional `RESEND_FROM_EMAIL`. Nach 31 prüfen:
`purchases` hat `confirmation_sent_at` + `order_number`. Optional Vercel-Cron
(z. B. stündlich) auf `/api/internal/confirmation-retry` mit
`Authorization: Bearer <CRON_SECRET>`.
