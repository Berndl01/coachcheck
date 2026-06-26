# CoachCheck v3.70 — Trainer-Profil + 360°-Sichtbarkeit

Enthält ALLES aus v3.69 (Release-Vertrag, Ergebnis-Snapshot, ehrlicher Report,
Fail-Closed-Fragebogen, Antwortqualitäts-Gate, Refund-Cascade,
Entwicklungsindikatoren) PLUS die hier beschriebene Profil-Funktion.

## Deine zwei Fragen

### 1) Ist Selbstbild & Fremdbild in der Oberfläche integriert?
**Ja — aber bisher nur tief in der Ergebnisseite eines 360°-Assessments.**
Der Trainer verwaltet 360°-Einladungen über den `InvitationsManager` auf
`/assessment/[id]/result` (ab Tier 3 „360° Spiegel"). Sobald Eingeladene
anonym antworten, erscheint der Selbstbild-/Fremdbild-Vergleich inkl.
Diskrepanzen in Ergebnis und PDF. Das war **schwer auffindbar** — es gab keinen
zentralen Einstieg. Das ist jetzt behoben (siehe unten).

### 2) Ein schönes Profil vom Trainer
**Neu gebaut:** `/profil` — eine eigene, aufgeräumte Profilseite.

## Neue Seite `/profil`

Zeigt an einem Ort:

- **Kopf:** Initialen-Avatar, Name, E-Mail, „Mitglied seit", Bearbeiten-Button.
- **Meine Käufe:** echte Bestellhistorie aus der `purchases`-Tabelle — Produkt,
  Preis (korrekt formatiert), Datum, Status-Badge (Bezahlt / Erstattet /
  Ausstehend / Fehlgeschlagen). Plus Hinweis, dass Vertrag & Rechnung per E-Mail
  zugestellt wurden (es gibt bewusst keinen ungesicherten Download).
- **Selbstbild & Fremdbild (360°):** pro 360°-Assessment der Stand der
  Einladungen (Antworten erhalten / offen) mit direktem „360° verwalten"-Link in
  die jeweilige Auswertung. Wer noch kein 360°-Paket hat, sieht eine erklärende
  Karte mit Verweis aufs Paket — die Funktion ist damit **endlich sichtbar**.
- **Mein Fortschritt:** drei Kennzahlen — abgeschlossene Auswertungen, aktive
  Foki, erhaltene 360°-Antworten.
- **Stammdaten:** Rolle, Sportart, Verein, Vereinstyp, Niveau, Altersgruppe —
  mit Bearbeiten-Link auf `/profil/setup`. Unvollständiges Profil wird sanft
  angestupst.
- **Daten & Sicherheit:** Links zu „Meine Daten" (Export/Löschung), Dashboard,
  Logout.

## Navigation

- **TopNav:** Eingeloggte Nutzer haben jetzt „Profil" neben „Dashboard".
- **Dashboard-Footer:** zusätzlicher „Profil"-Link.

## Technik

- Reine **RLS-Server-Reads** (kein Admin-Client): `purchases` über
  `purchases_select_own`, Einladungen über die bestehende Owner-Policy. Keine
  neuen Tabellen, keine Migration nötig.
- **Zweisprachig:** neuer `profile`-Namespace in DE und EN (Schlüssel-Parität per
  i18n-Test erzwungen). Wert-Labels (Sport/Niveau/Alter) werden aus dem
  bestehenden `dashboard`-Namespace wiederverwendet.
- Design konsequent im bestehenden System (font-display/-mono, ink/bone/gold/
  petrol), responsiv (zweispaltig ab `lg`).

## Gate-Abnahme (alle grün)

- `tsc --noEmit` — sauber
- `node scripts/claimcheck.mjs` — 68 Dateien, keine riskanten Claims
- `npx vitest run` — **385/385** (379 + 6 neue Profil-Tests)
- `eslint .` — sauber
- `next build` — erfolgreich (`/profil` als dynamische Route)
- `npm audit --omit=dev` — 0 Schwachstellen (keine neuen Abhängigkeiten)
- `node scripts/pdf-fulltest.mjs` — 5/5 Varianten

## Neue Dateien in v3.70 (zusätzlich zu den v3.69-Dateien)

- `app/profil/page.tsx`
- `tests/profile-page-v3-70.test.ts`

Geändert: `components/top-nav.tsx`, `app/dashboard/page.tsx`,
`lib/i18n/dictionaries/de.ts`, `lib/i18n/dictionaries/en.ts`.

> WICHTIG fürs Committen: weiterhin `git add -A` verwenden, damit die neuen
> Dateien (auch die v3.69-Dateien wie `lib/release-contract.ts`) mitkommen.
> Siehe `NEW_FILES_v3_70.txt`.
