# FEATURE v3_74 — Verkaufsreife Landing: ehrlich, de-normiert, claim-sicher

Aufbauend auf dem Embed-Fix (v3.73). Ziel: Die Landing soll **verkaufen, ohne zu lügen** — der Trainer soll
„ja, das gefällt mir" sagen, und jede Aussage muss haltbar sein. Kernlinie: **Advertised = Delivered**,
**psychometrische Geltung an Fachfreigabe gebunden**, **keine erfundenen Belege**.

---

## Umgesetzt

### 1 — Hero entnormiert (keine erfundene Schulnote mehr)
- **`components/landing/hero.tsx`**: Die hartkodierte **„87/100"** plus die Buchstaben-Noten **A / B+ / C**
  sind ersetzt durch ein **qualitatives Wirkungsprofil** — drei Achsen mit Wort-Beschreibung
  („deutlich sichtbar" / „situativ direkt" / „Entwicklungsfeld") und **zahllosen** Positionsbalken.
  Begründung: Ein normiert wirkender Punktwert und Schulnoten suggerieren eine validierte Messung, die das
  Instrument so nicht beansprucht. Das Profil bildet stattdessen ehrlich die Achsen-**Position** ab.

### 2 — Übertriebene/absolute Claims entschärft (DE **und** EN gespiegelt)
- „**Kein Team sagt dir die Wahrheit.**" → „Ehrliches Feedback bekommst du selten."
- „… Diese Lücke **entscheidet Spiele.**" → „… kostet dich Wirkung — oft, ohne dass du es merkst."
- „Drei Schritte. **Null Aufwand.**" → „Drei Schritte. Ein klares Bild."

### 3 — Testimonials ehrlich gemacht (Rechtsrisiko entfernt)
- **`components/landing/voices.tsx`** + Dictionaries: Die **erfundenen Namen** (Markus W. / Lena B. /
  Tobias F.) und konkreten Vereins-/Regionsangaben sind **raus**. Erfundene Testimonials sind in AT/EU
  (UWG) unzulässig. Der Abschnitt heißt jetzt **„Beispielhafte Erkenntnisse"**, jede Karte trägt einen
  **„Beispiel"**-Marker und einen rein **kategorischen** Kontext (z. B. „Handball · Vereinssport"). Die
  Texte sind als **illustrativ** umformuliert (dritte Person, kein vorgetäuschtes Zitat).

### 4 — claimcheck gehärtet (reale Lücke geschlossen)
- **`scripts/claimcheck.mjs`**:
  - **`lib/i18n/dictionaries`** zu den Scan-Roots ergänzt. Wichtig: Die kundensichtbaren Texte leben in den
    i18n-Dictionaries; die Landing-Komponenten enthalten nur noch `t()`-Keys. **Ohne** diese Root hätte
    claimcheck die echten Claims gar nicht mehr gesehen — die Prüfung lief faktisch ins Leere.
  - **Drei neue harte Regeln** als Dauer-Sperre: `null aufwand`, `entscheidet spiele`,
    `kein team sagt dir die wahrheit`. Die entschärften Aussagen können nicht zurückkehren.
- Verifiziert: Dictionaries bestehen alle bestehenden **und** neuen Regeln; claimcheck prüft jetzt
  **73 Dateien**.

### i18n
- DE/EN bleiben **schlüsselgleich** (typgebunden über `Dictionary = typeof de`), alle Werte nicht-leer —
  durch `tsc` und `tests/i18n-foundation.test.ts` erzwungen. Neue Keys: `cardProfileTitle`,
  `cardClarityVal`, `cardToneVal`, `cardClosenessVal`, `voices.exampleTag`.

---

## Bewusst NICHT in diesem Drop (ehrliches Scoping)

Die übrigen **Coach-Cockpit**-Teile sind **nicht** enthalten — und zwar absichtlich:

- **Aktiver-Fokus-Erinnerung per Mail**: braucht eine **Schema-Migration** (Reminder-Status auf
  `action_plans`, damit genau **einmal** erinnert wird statt täglich zu spammen — heute fehlt jede
  Tracking-Spalte und es gibt kein E-Mail-Log zum Dedup). Eine Migration gehört **gegen ein echtes
  Postgres verifiziert** (dein Gold-Standard aus v3.72), nicht statisch dazugebolzt. Wird als sauberer,
  PG-verifizierter nächster Schritt gebaut.
- **Dashboard-Reframe**: Das Dashboard zeigt den aktiven Fokus (Streak, Heute-Check) bereits prominent.
  Eine reine Umbenennung würde getesteten, laufenden Code (`action-area`-, `checkin-loop`-,
  `focus-completion`-Tests) für geringen Mehrwert anfassen — separat, wenn er echten Nutzen bringt.

---

## Verbindliche Gates — alle grün (echte Läufe)

```text
tsc --noEmit                          ✓
node scripts/claimcheck.mjs           ✓  (73 Dateien, inkl. Dictionaries)
npx vitest run                        ✓  (443/443)
eslint .                              ✓
next build                            ✓  (vollständige Route-Tabelle)
npm audit --omit=dev --audit-level=high ✓  (0)
node scripts/pdf-fulltest.mjs         ✓  (4/4)
```

> `npm audit` (inkl. dev) meldet weiterhin **eine** „low"-Schwachstelle (`esbuild`-Dev-Server,
> GHSA-g7r4-m6w7-qqqr, transitiv über die Vitest-Toolchain, **nicht** im Produktionsbundle) — bewusst als
> akzeptabel dokumentiert.

## Vor dem Deploy

War zwischenzeitlich je eine **neuere** Version auf Vercel live, vorher mit GitHub abgleichen, bevor du
deployst — sonst überschreibst du evtl. neueren Stand. Die vollständige **Live-Kette** (Stripe-E2E,
Supabase, Cron) bleibt deine Verantwortung; sie ist hier **nicht** als bestanden behauptet.

## Version

`CoachCheck v3.74` (auf v3.73). Migrationsstand unverändert **01 → 48**.
