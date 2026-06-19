# SECURITY v3_41 — Berechtigungs- & Datenschutz-Härtung (4. Audit)

Schließt die im 4. Audit gefundenen **echten** Berechtigungs-/Datenschutzlücken.
Mehrere davon stammten aus meinem eigenen v3_38/v3_40-Code (Share-Token,
Spielertyp-Karte). Alle 7 Gates grün: tsc · claimcheck (60) · **vitest 206/206**
(v3_40: 193 → +13) · eslint · build (9/9) · audit 0 · PDF 3/3.

---

## Blocker 1 · Saison-Monitor (Tier 5) war ohne Kauf nutzbar

**Vorher:** `seasons/create` prüfte Tier 5 nur, WENN `assessment_id` mitkam; ohne
sie wurde die Saison gratis angelegt. Zusätzlich erlaubte die RLS `seasons_owner_all`
direkte Browser-Schreibrechte → API komplett umgehbar.

**Jetzt:**
- Migration 38: `seasons.purchase_id` (FK auf purchases) + Unique-Index (eine Saison
  pro Kauf). Direkte Schreib-RLS auf `seasons`/`pulse_cycles`/`pulse_invitations`
  entfernt → nur noch Owner-SELECT; geschrieben wird ausschließlich serverseitig.
- `seasons/create` erzwingt jetzt serverseitig einen **bezahlten, bestätigten,
  nicht erstatteten Tier-5-Kauf** ohne bestehende Saison; sonst 403.

## Blocker 2 · Pulse-Anonymität (< 5 Antworten) wurde nicht eingehalten

**Vorher:** `compute_pulse_snapshot` lieferte Dimensionswerte schon ab 1 Antwort →
bei einem Teilnehmer = dessen Einzelantwort sichtbar.

**Jetzt:** Schwelle in der DB: unter 5 Teilnehmern `dimensions = {}` + `below_threshold`.
`detect_pulse_trends` verlangt in BEIDEN Zyklen ≥ 5 Antworten.

## Blocker 3 · Trainer konnte einzelne anonyme Antworten lesen

**Vorher:** (a) RLS `pulse_responses_owner_select` ließ den Owner einzelne
Pulse-Antworten direkt lesen; (b) die öffentlichen Token-Seiten
(`einschaetzung`/`teamcheck`/`pulse`) gaben bereits gespeicherte Einzelantworten
über den Trainer-Token zurück.

**Jetzt:** (a) `pulse_responses_owner_select` entfernt (Owner sieht nur Aggregate).
(b) Alle drei Token-Seiten laden KEINE gespeicherten Antworten mehr — der
öffentliche Token startet den Fragebogen nur noch leer.
> Hinweis: Damit entfällt für 360°/TeamCheck das Wiederaufnehmen nach Reload. Ein
> sicheres Resume (separates Geheimnis im HttpOnly-Cookie) ist als Folgeschritt
> möglich, falls gewünscht.

## Blocker 4 · Invitation-API umging Tier-/Anonymitätsregeln

**Vorher:** Tier-Prüfung nur bei `invitation_type === 'fremdbild'`; ohne Typ keine
Prüfung (Default trotzdem fremdbild). Außerdem ließ sich `spieler` MIT E-Mail
erzeugen (sollte anonym sein).

**Jetzt:** `invitations/create` ist Fremdbild-only, Tier-3-Prüfung **unbedingt**,
nur für freigeschaltete Assessments; `invitation_type` fest auf `fremdbild`.
DB-Check `invitations_spieler_no_email`: Spieler-Einladung darf keine E-Mail tragen.

## Weitere Fixes

- **Freigabe-Token-Rotation:** Beim Deaktivieren wird der Token gelöscht → alter
  Link stirbt dauerhaft; Reaktivierung erzeugt einen neuen Token. (Behebt
  meinen v3_38-Bug.)
- **Kein Fehler-Leak:** `archetyp/personalize` gibt keine Provider-Fehler mehr an
  den Browser, nur eine neutrale Meldung.
- **PDF-Umbruch:** Spielertyp- und Bedienungsanleitungs-Karten mit `wrap={false}`
  → keine zerrissene „ANPASSUNG"-Seite mehr. (Behebt meinen v3_38-Bug.)
- **Beispiel-Report neu erzeugt** (`public/beispiel-coachcheck-report.pdf`, mit den
  neuen Abschnitten); Landing-Claim auf „mehrseitig" entschärft (keine veraltete
  Seitenzahl).
- **Deployment-Doku** (GO-LIVE / LAUNCH_CHECKLIST / README): verbindlicher
  Aktueller-Stand-Banner vorangestellt, der die alten gefährlichen Schritte
  (Migration-12-Rollback, `rest/v1/answers`, anonyme RLS) ausdrücklich verbietet.

---

## Datenbank — vor Go-Live ausführen

In Reihenfolge: **33 → 34 → 35 → 36 → 37 → 38** (idempotent). 38 enthält die
Saison-Paywall, die Pulse-Schwelle, den RLS-Lockdown und den Invitation-Check.

## Bewusst NICHT geändert / offen

- **Fallback-Report (Audit-Punkt 6):** Bleibt wie in v3_40 von dir gewünscht — bei
  nicht verfügbarem KI-Dienst wird die deterministische Auswertung ausgeliefert,
  OHNE „ausgelastet"-Hinweis. Der Monitor markiert solche Reports (`ai_fallback`).
  Eine automatische Nachveredelung (KI-Version nachziehen, sobald verfügbar) ist
  ein möglicher Folgeschritt — nicht in diesem Release, weil es deine bewusste
  Entscheidung berührt.
- **Echter Stripe-E2E-Test (`tests/e2e/purchase-flow.spec.ts`, `test.fixme`):**
  weiterhin offen — nur im echten Live-System mit Stripe durchführbar.
- Beim Live-E2E zusätzlich prüfen: Saison nur mit Tier-5-Kauf anlegbar;
  Pulse unter 5 Antworten zeigt keine Werte; Token öffnet Fragebogen, gibt aber
  keine Antworten zurück; deaktivierter Freigabe-Link ist tot.
