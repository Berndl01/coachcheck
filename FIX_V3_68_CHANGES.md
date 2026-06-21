# FIX v3_68 — Audit-Welle 1: bestätigte Schnell-Fixes + E-Mail im Profil

Erste Welle aus dem technischen Abnahmebericht: die bestätigten, klar abgegrenzten Punkte ohne
Migration. Große architektonische P0s + Modell-/Marken-/Rechtsentscheidungen folgen in eigenen
Wellen (siehe Triage in der Antwort).

## Umgesetzt
- **E-Mail im Profil (explizite Bitte):** `app/profil/setup` zeigt jetzt „Angemeldet als
  {user.email}" (read-only, aus der Auth-Session). Neuer Dict-Key `profileSetupPage.loggedInAs`.
- **§16 Hero-Widerspruch:** Hero zeigte „6 Module" — das Modell hat **sieben**. Korrigiert auf 7
  (konsistent mit `introB`, `tag3`, Architektur-Sektion). „6 Achsen" bleibt korrekt.
- **§16 Datenschutz-Claim (Claim-Disziplin):** „Wir geben keine Daten an Dritte weiter." war als
  absolute Aussage angreifbar (es werden Auftragsverarbeiter wie Stripe/Resend/Supabase genutzt).
  Ersetzt durch eine präzise Formulierung (kein Verkauf, keine Weitergabe für fremde Werbung;
  vertraglich gebundene technische Dienstleister) — DE + EN. **Finalen Wortlaut bitte vom Anwalt
  bestätigen lassen.**
- **§17 CRON_SECRET:** LAUNCH.md behauptete „keine Cron-Jobs aktiv". `vercel.json` hat aber drei
  produktive Crons (reminders, confirmation-retry, withdrawal-retry) und die Routen existieren.
  LAUNCH.md korrigiert: CRON_SECRET zwingend + Prozesse + Smoke-Test.
- **§6 Archetyp-Count:** finalize prüfte nur `=== 0`. Jetzt `< 2` (zwei Archetypen nötig).
- **§15 Timezone (Sofort-Teil):** Check-in-Datum nutzte UTC (`toISOString().slice(0,10)`) → falscher
  Kalendertag um Mitternacht in Österreich. Neuer Helper `lib/utils/local-date.ts`
  (`localDateISO`, Default Europe/Vienna), in der Action-Route verwendet. Per-Nutzer-Zeitzone
  (`profiles.timezone`) folgt mit Migration in einer späteren Welle.

## Bereits erledigt (Audit-Annahme veraltet — verifiziert)
- §6 Fehler 1+2: finalize filtert bereits auf erwartete Items (`ANSWER_SET_INVALID`) und validiert
  Choice-Werte gegen erlaubte Keys. Beides vorhanden.

## NICHT in dieser Welle (siehe Triage/Plan)
Große P0s mit Migration/Architektur (§2/§3/§4 Readiness+Item-Vertrag+Modell-Konstanten, §7
Score-Snapshot, §13 Report-Transaktion, §14 Action-Entitlement bei Refund, §18 Admin-Readiness,
§19 echte DB/Browser-E2E) sowie Punkte, die DEINE Entscheidung brauchen (§8 Modul-Scoring = Modell,
§9 „Führungsreife"-Umbenennung = Modell/Methodik, §16 „Mindset Check"/„Sport Mindset Lab" = Marke).

## Gates
tsc OK · claimcheck 66 · vitest 360/360 (35) · eslint OK · next build Exit 0 · npm audit 0 · PDF 4/4.
