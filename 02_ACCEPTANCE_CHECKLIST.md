# ABNAHME-CHECKLISTE v3.72 — Go-live-Blocker-Runden (v3.69 → v3.70 → v3.71 → v3.72)

Diese Welle setzt die in v3.68 ausdrücklich vertagten **architektonischen P0s** als
zusammenhängende Release-Welle um (Readiness + Item-Vertrag + Modell-Konstanten,
Score-Snapshot, Antwortqualität-Gate, Report-Transaktion + ehrliche Fallback-Kennzeichnung,
Refund-Kaskade §14, Führungsreife-Entschärfung).

Die Liste trennt **statisch code-verifiziert** (von mir hier nachweisbar) von **Live-Abnahme**
(braucht deine echte migrierte Umgebung — von dir auszuführen).

---

## A) Statisch code-verifiziert (in dieser Welle erbracht)

- [x] **Zentraler Release-Vertrag** `lib/release/contract.ts`: 7 Module (A–G) + 6 Achsen +
      exakte Itemzahlen je Produkt (27/103/103/77) + Scoring-/Itempool-Version.
- [x] **Item-Vertragsprüfung vor Fragebogen** (`app/assessment/[id]/page.tsx`): stimmt Itemzahl
      nicht mit `product.item_count`, oder fehlt ein Spannungsfeld-Pol bzw. ist er ein
      Platzhalter („Pol A/Pol B") → **geschlossener, neutraler Fehlerzustand** statt
      unvollständiger Fragen. Unit-getestet (`tests/release-contract-v3-69.test.ts`).
- [x] **DB-Integritätsfunktion** `coachcheck_release_integrity()` (Migration 45) + Tabelle
      `release_contract`. Prüft serverseitig Module, Pole, ausgelieferte Itemzahl je Produkt,
      Archetypen.
- [x] **Readiness-Logik + geschützte API** (`lib/release/readiness.ts`,
      `app/api/admin/readiness/route.ts`): 200 nur bei vollständiger Vertragstreue, sonst 503
      mit Gründen. Zugriff: Admin **oder** `Bearer CRON_SECRET`. Unit-getestet (Fake-DB).
- [x] **Live-Preflight** `scripts/preflight-release.mjs` + `npm run preflight`.
- [x] **Unveränderbarer Ergebnis-Snapshot** (Migration 46 + `finalize`): Achsen, Modul-Signale,
      Entwicklungsindikatoren, Archetypen, Profil-Einordnung, Antwortqualität, erwartete
      Item-IDs, Scoring-/Itempool-Version werden eingefroren. **Ergebnis/Report/PDF lesen den
      eingefrorenen Stand** statt neu zu rechnen (Result + Report angepasst).
- [x] **Antwortqualität-Gate**: `nicht_interpretierbar` blockiert Premium-Ergebnis **und**
      Premium-Report und bietet **kostenlosen Neuversuch** (`/api/assessment/[id]/retry`,
      eng abgesichert). `eingeschränkt` wird nur abgemildert dargestellt.
- [x] **Report-Transaktion** (Migration 46 `finalize_report_atomic`): Report-Zeile + Status
      + Job in EINER Transaktion; bei DB-Fehler wird das hochgeladene **PDF wieder gelöscht**.
- [x] **Ehrliche Fallback-Kennzeichnung**: Ein Fallback ist eine **„Basis-Auswertung"**, kein
      Premium-Report. E-Mail, Reportstatus (`reportKind`) zeigen die Unterscheidung — **ohne**
      Alarm-Sprache („Dienst ausgelastet"). *(Siehe Hinweis unten — teilweise Umkehr einer
      früheren bewussten Entscheidung.)*
- [x] **Refund-Kaskade §14**: nach voller Rückerstattung kein neuer/erneuerter Aktionsplan,
      kein Check-in, kein Abschluss (Entitlement-Gate in den Action-Routen, 402); der Webhook
      **archiviert aktive Pläne**. (Einladungen/Share-Link/Saison/Pulse bereits seit v3.42/43.)
- [x] **Führungsreife → Entwicklungsindikatoren** (Result + PDF + Prompt + Landing + Progress):
      keine Verdikte, kein Schein-Norm-Prozent, Reflexions-Hinweis. Siehe `COPY_MAP_v3_69.md`.
- [x] **Gates**: tsc · claimcheck · vitest · eslint · next build · npm audit · PDF-Volltest.
      (Konkrete Zahlen siehe `FIX_V3_69_CHANGES.md` / `BUILD_LOG.txt`.)

## B) Live-Abnahme (deine migrierte Umgebung — nicht statisch erbringbar)

- [ ] **Migrationen 45 + 46 + 47 + 48** in Produktion anwenden (Reihenfolge 01 → 48). Jede endet mit
      `raise notice '... OK'`.
- [ ] **Readiness live**: `node scripts/preflight-release.mjs` gegen die echte URL → **Exit 0 /
      HTTP 200**. Erst dann den Fragebogen freischalten.
- [ ] **Echter Browserdurchlauf** eines Fragebogens: Spannungsfeld-Pole sichtbar, **nirgends**
      „Pol A/Pol B". (E2E-Gerüst: `tests/e2e/questionnaire.spec.ts`, mit `E2E_*`-Variablen.)
- [ ] **Echter Kauf** (Stripe Test/Live): Finalize → Snapshot gesetzt → Report/PDF aus Snapshot.
- [ ] **Refund-Test**: nach `charge.refunded` sind Ergebnis, Report, Einladungen, Share-Link,
      Saison/Pulse **und** aktive Aktionspläne gesperrt/archiviert; neue Aktionsschritte → 402.
- [ ] **Antwortqualität live**: ein absichtlich „durchgeklicktes" Assessment → Ergebnis blockiert,
      kostenloser Neuversuch funktioniert, danach belastbares Ergebnis.

## C) Rechts-Gate (unverändert offen — Anwalt/Steuerberater)

- [ ] FAGG-Konformität, AGB/Datenschutz/AVV, Widerruf-Formulierungen, USt. — **vor** breitem
      öffentlichem Marketing anwaltlich bestätigen. (Diese Welle ändert daran nichts.)

---

### Hinweis zur Fallback-Kennzeichnung (bewusste Teil-Umkehr)
Du hattest früher entschieden, Fallback-Reports **ohne** sichtbaren Hinweis auszuliefern (kein
„KI ausgelastet"). v3.69 führt **keine** Alarm-Sprache wieder ein — es stoppt nur, dass die
E-Mail einen deterministischen Fallback fälschlich „Premium" nennt (Claim-Ehrlichkeit). Willst
du das alte, vollständig stille Verhalten zurück, ist es eine **Ein-Flag-Umkehr** in
`app/api/assessment/[id]/report/route.ts` (E-Mail-Block) — sag Bescheid.

---

## C) Live-Abnahme — Nachweis (von Bernie auszufüllen)

Erst nach vollständigem Ausfüllen ist „go-live" belastbar (P0.1). Pro Zeile:
Datum · Umgebung (Staging/Prod) · Tester · Nachweis (Link/Screenshot/Log-ID).

| Schritt | Datum | Umgebung | Tester | Nachweis |
|---|---|---|---|---|
| Migrationen 01 → 48 angewandt | | | | |
| Readiness / Preflight → HTTP 200 | | | | |
| Browserdurchlauf Fragebogen (Pole sichtbar, kein Platzhalter) | | | | |
| Stripe-Testkauf → Vertragsmail + Vertrags-PDF | | | | |
| Report + PDF erzeugt | | | | |
| Vollständiger Refund → alle kostenpflichtigen Rechte gesperrt | | | | |
| Antwortqualität „durchgeklickt" → Premium blockiert + Gratis-Neuversuch | | | | |
| Vercel-Produktionsdeploy erfolgreich | | | | |
| Rechtliche/steuerliche Freigabe (Anwalt/Steuerberater) | | | | |

> **ABNAHME-UNTERSCHRIFT:** ________________________  Datum: ____________
