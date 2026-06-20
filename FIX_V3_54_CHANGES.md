# FIX v3_54 — Premium-Sprach-/Ton-Durchgang über kundenseitige Texte

Systematischer Durchgang über die kaufentscheidenden Oberflächen (Landing, Checkout,
Ergebnis, Report-PDF, Report-Prompt, E-Mails, Dashboard, Archetyp-Seite). Ziel:
objektiv Falsches/Inkonsistentes/Anglizismen entfernen — **ohne** Marketing-Hype
(claimcheck bleibt grün) und ohne Bernies Stimme zu überschreiben.

## Behoben
1. `components/landing/hero.tsx` — „Live · Sample Insight" → „Live · Beispiel-Einblick"
   (Anglizismus im sichtbarsten Label der Startseite).
2. `lib/pdf/report-document.tsx` — 5 Anglizismen im **bezahlten Report**:
   - „01 — Executive Summary" → „01 — Überblick" (einziger englischer Abschnittstitel
     unter sonst durchgängig deutschen).
   - „Blind Spots" → „Blinde Flecken" (Label + Fallback-Satz; deutscher Fachbegriff).
   - „Coach Impact" → „Coach-Wirkung" (Intro-Satz + TeamCheck-Metrik-Label).
   Datenschlüssel (`blind_spots`, `coach_impact`, `coachImpact`) unverändert.
3. `lib/ai/report-prompt.ts` — 4 Terminologie-Angleichungen, damit die KI-generierte
   **Prosa durchgängig deutsch** bleibt: Executive Summary→Überblick, Blind Spots→
   blinde Flecken, Coach Impact→Coach-Wirkung, Psy-Safety→psychologische Sicherheit.
4. `app/dashboard/page.tsx` — „Premium Report" → „Premium-Report" (deutsches Kompositum).
5. `app/archetyp/[slug]/page.tsx` — „Deep Dive" → „Deep-Dive" (Schreibweisen-Konsistenz
   mit den 4 anderen Vorkommen).

## Bewusst NICHT angefasst (Befunde, keine Fehler)
- **Markenname-Split „CoachCheck" (38×) vs. „Humatrix Coach" (24×)** — größter
  Premium-Bruch, aber Marken- + Rechtsentscheidung (der Name steht auch im
  Widerruf-Consent-Text). Erfordert Bernies Festlegung; Rechtstext-Teil an den Anwalt.
- Produktterm **„Deep-Dive"** (5× konsistent als Feature-Name) und Tagline
  **„Premium Edition"** — bewusste stilisierte Begriffe, Produktentscheidung.
- Tarifnamen folgen der DB-Quelle der Wahrheit („Selbsttest", „360° Spiegel" etc.).
- Footer „Mindset Check" / „Leadership Edition" — Eigennamen anderer Humatrix-Produkte.

## Verifiziert bereits Premium (ehrlicher Befund — kein Eingriff nötig)
operating-manual.ts (generierter Report-Text), die Release-1/2-Komponenten und die
E-Mails (Bestellbestätigung/Fortschritt/Widerruf) — durchgängig starkes Premium-Deutsch.

Alle 7 Gates grün: tsc 0 · claimcheck 65 · vitest 348/348 · eslint sauber · build Exit 0
· npm audit 0 · PDF 4/4. Migrationen 01 → 43.
