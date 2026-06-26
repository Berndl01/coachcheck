# CoachCheck v3.69 — Verbindliche Abnahmecheckliste

Freigabe erfolgt erst, wenn ALLE Punkte abgehakt sind. Ein grüner Unit-Test
allein ist keine Verkaufsfreigabe.

## A — Statisch verifiziert (in dieser Auslieferung erledigt)

- [x] `tsc --noEmit` sauber
- [x] `node scripts/claimcheck.mjs` — 68 Dateien, keine riskanten Claims
- [x] `npx vitest run` — 379/379 grün
- [x] `eslint .` sauber
- [x] `next build` erfolgreich
- [x] `npm audit --omit=dev` — 0 Schwachstellen (Produktion)
- [x] `node scripts/pdf-fulltest.mjs` — 5/5 Varianten (inkl. Basis-Auswertung)
- [x] Zentraler Release-Vertrag (`lib/release-contract.ts`) vorhanden
- [x] Item-Vertragsprüfung vor Fragebogen (Fail-Closed)
- [x] Kein „Pol A/Pol B"-Ersatztext mehr; fehlende Pole → Frage übersprungen
- [x] Bewusstes 50/50 am Spannungsfeld-Regler (kein stiller Default)
- [x] Ergebnis-Snapshot beim Finalisieren (Versionen, Item-IDs, Achsen, Signale,
      Indikatoren, Archetypen, Profil, Antwortqualität, Zeitpunkt)
- [x] Result-Seite/Report lesen Snapshot, rechnen nicht neu
- [x] `nicht_interpretierbar` blockiert Ergebnis + Report, bietet Gratis-Wiederholung
- [x] `eingeschränkt` sichtbar erklärt
- [x] Transaktionaler Report-Abschluss + PDF-Löschung bei DB-Fehler
- [x] Fallback ehrlich als „Basis-Auswertung" (PDF, E-Mail, Status)
- [x] Refund archiviert aktive Aktionspläne
- [x] Action/Check-in nach Refund gesperrt (Entitlement-Gate)
- [x] „Entwicklungsindikatoren" statt normierter „Führungsreife"

## B — Bernies Live-Umgebung (NUR live verifizierbar — offen)

- [ ] **P0.1** Migrationen 01 → 46 in Reihenfolge auf der echten DB angewendet
      (45 + 46 sind additiv & selbst-testend).
- [ ] **P0.2** `npm run preflight` gegen die Live-DB → `RESULT: ✓` (alle
      Vertragsbedingungen erfüllt).
- [ ] **P0.3** Readiness-API liefert **HTTP 200**:
      `curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/admin/readiness`
- [ ] **P0.4** Echter Browserdurchlauf eines Assessments (z. B. Selbsttest):
      - [ ] sichtbare Pole ALLER Spannungsfelder (nie „Pol A/B")
      - [ ] alle Items beantwortbar, Spannungsfeld erst nach bewusster Bewegung „beantwortet"
      - [ ] vollständiges Ergebnis (sechs Kernachsen sichtbar)
      - [ ] identische Werte in UI und PDF
- [ ] **P0.5** Echter Stripe-Testkauf → Entitlement → Report → PDF → Vertragsmail.
- [ ] **P0.6** **Policy-Sign-off (Bernie):** Indikator-Darstellung als
      Reflexionshinweis ist bewusste Entscheidung. Bestätigen, dass KEINE
      normierte Führungsreife behauptet wird, bis eine dokumentierte
      Item-Konstrukt-Matrix + fachliche/empirische Prüfung vorliegt.
- [ ] **P0.7** Refund-Test (voller Refund über Stripe):
      - [ ] Ergebnis/Report nicht mehr abrufbar
      - [ ] Einladungen expired, Share-Link gesperrt
      - [ ] aktive Aktionspläne archiviert, keine neuen Check-ins möglich
      - [ ] Saison archiviert, Pulse-Einladungen widerrufen
- [ ] **P0.8** Basis-Auswertung-Pfad live geprüft (KI-Dienst künstlich
      ausfallen lassen): E-Mail/PDF/Status sagen „Basis-Auswertung", nicht „Premium".
- [ ] **P0.9** `nicht_interpretierbar` live: Durchklick-Test → Ergebnis blockiert,
      Gratis-Wiederholung startet sauber neu.

## C — Externe Sign-offs (außerhalb des Codes)

- [ ] Datenschutz/AGB-Sprache — Anwalt
- [ ] `INVOICE_VAT_NOTE` / USt-Behandlung — Steuerberater
- [ ] Psychometrische Validität der Skalen — Fachperson

---

# Copy-Map — geänderte kundensichtbare Texte (v3.69)

| Ort | Vorher | Nachher |
|-----|--------|---------|
| Result-Seite, Abschnittstitel | „Führungsreife" / „Wie souverän du führst." | „Entwicklungsindikatoren" / „Sechs Felder zum Weiterdenken." |
| Result-Seite, Indikator-Etikett | „souverän / gefestigt / im Aufbau / Entwicklungsfeld" + Prozent | „geringe / mittlere / ausgeprägte Tendenz" (kein normierendes Urteil) |
| Result-Seite, Disclaimer | — | „Reflexionshinweise, keine normierte Reifemessung …" |
| Result-Seite, Qualität | (keine sichtbare Sperre) | Banner bei „eingeschränkt"; Sperrseite + „Kostenlos wiederholen" bei „nicht interpretierbar" |
| Fragebogen, Spannungsfeld ohne Pole | Regler mit „Pol A/Pol B" | „Frage nicht verfügbar" (übersprungen) |
| Fragebogen, Spannungsfeld unbeantwortet | Regler optisch bei 50/50 | „Regler bewegen, um zu antworten" (erst Interaktion zählt) |
| Fragebogen, Vertrag verletzt | generische „keine Items"-Seite | neutraler technischer Fehlerzustand, Fail-Closed |
| PDF-Cover (Fallback) | immer „Premium Coaching-Analyse" | „Basis-Auswertung" + Meta „Auswertung: Basis-Auswertung" |
| PDF, zweite Schicht | „Premium · Führungsreife" / „Stil … Reife …" | „Premium · Entwicklungsindikatoren" / „Sechs Felder zum Weiterdenken." + Disclaimer |
| Report-E-Mail (Fallback) | „dein Premium-Profil wartet" | „deine Basis-Auswertung ist da" + ehrlicher Hinweis |
