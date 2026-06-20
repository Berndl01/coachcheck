# FIX v3_55 — Markenname vereinheitlicht: „CoachCheck" überall

Bernies Entscheidung: Der frühere Zweitname „Humatrix Coach" wird durchgängig durch
den Produktnamen **„CoachCheck"** ersetzt. Die **Firma „Humatrix"** (Anbieter im
Impressum, Footer-Spalte, Logo, Mail-Domain `humatrix.cc`) bleibt unangetastet.

## Wichtig: kein Anwalt nötig für die Umbenennung
Der rechtlich relevante **Widerruf-Consent-Text** (`lib/legal/withdrawal.ts`,
`checkout/consent-form.tsx`) nannte bereits „CoachCheck" — diese Stelle bleibt also
unverändert. Die Umbenennung berührt keinen Rechtstext.

## Umbenannt (25 Vorkommen in 21 Dateien + Signup-Sonderfall)
- **Sichtbar/kundenseitig:** Hero-Badge, Startseiten-Titel (`layout.tsx`),
  Musterbericht-Kicker, Beispielreport-Kicker (`sample-report.tsx`),
  Kontakt-Seite (Titel + Text), Konto-Daten-Text, alle Rechtsseiten-Titel
  (Impressum/AGB/Datenschutz/Widerruf).
- **E-Mails:** Kontakt-Bestätigungs-Betreff, Report-fertig-Betreff,
  Einladungs-Mail-Text.
- **Stripe-Checkout:** Line-Item-Name (`Humatrix Coach · …` → `CoachCheck · …`) —
  erscheint im Stripe-Checkout des Kunden.
- **Signup:** beide Account-Verweise → „CoachCheck-Account" (Logo `<HumatrixLogo/>`
  bleibt — Firmen-Login-Ebene).
- **Konfig/Hinweise:** `resend.ts` Fallback-Absendername + Kommentare,
  Admin-Checklist-Hinweis (`RESEND_FROM_EMAIL` → `"CoachCheck <noreply@humatrix.cc>"`).
- **Intern:** KI-Prompt-Persona (`report-prompt.ts`), Scoring-/PDF-Kommentare,
  PDF-Dokumenttitel.
- **Doku:** `README.md`, `GO-LIVE.md` Überschriften (historische Changelog-Einträge
  bleiben als Zeitdokument unverändert).

## Erhalten (Firma, nicht Produkt)
`HumatrixLogo` (3×), Footer-Spalte „Humatrix" + „© 2026 Humatrix · The Mind Club
Company", Impressum „Humatrix by Bernhard Lampl", Mail-Domain `humatrix.cc`.

## Neuer Guard-Test
`tests/brand-consistency-v3-55.test.ts` scannt `app/ components/ lib/` und schlägt fehl,
falls „Humatrix Coach" je wieder auftaucht; prüft zugleich, dass die Firma „Humatrix"
und der Produktname „CoachCheck" präsent bleiben. → Regressions-Schutz.

Alle 7 Gates grün: tsc 0 · claimcheck 65 · vitest 351/351 · eslint sauber · build Exit 0
· npm audit 0 · PDF 4/4. Migrationen 01 → 43.
